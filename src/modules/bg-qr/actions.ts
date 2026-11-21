"use server";

import { redirect } from "next/navigation";

import { BgQrError, createBankQr, queryBankQrStatus } from "@/modules/bg-qr/client";
import { parseQrChargeInput } from "@/modules/bg-qr/charge-input";
import {
  findGeneratedQr,
  insertGeneratedQr,
  saveQrStatus,
} from "@/modules/bg-qr/repository";
import { getDashboardSession } from "@/modules/dashboard/session";
import { consumeRateLimit } from "@/shared/security/rate-limit";

export type QrActionState = {
  error: string | null;
  success: string | null;
  nonce: number;
};

export type QrLookupState = {
  error: string | null;
  nonce: number;
  qrId: string | null;
  message: string | null;
  orderState: number | null;
  payDate: string | null;
  payHour: string | null;
  transactionNumber: string | null;
};

export async function generateQrCharge(
  _state: QrActionState,
  formData: FormData,
): Promise<QrActionState> {
  const session = await requireQrOperator();
  const parsed = parseQrChargeInput(formData);

  if (!parsed.ok) {
    return { error: parsed.message, success: null, nonce: Date.now() };
  }

  const limit = await consumeRateLimit("bg-qr-generate", session.userId);

  if (!limit.allowed) {
    return {
      error: "Demasiadas generaciones. Espera un minuto antes de crear otro QR.",
      success: null,
      nonce: Date.now(),
    };
  }

  try {
    const created = await createBankQr({
      amount: parsed.value.amountValue,
      gloss: parsed.value.gloss,
      reference: parsed.value.reference,
      expirationDate: parsed.value.expirationDate,
      singleUse: parsed.value.singleUse,
    });

    await insertGeneratedQr({
      qrId: created.qrId,
      amount: parsed.value.amount,
      currency: "BOB",
      gloss: parsed.value.gloss,
      reference: parsed.value.reference,
      expirationDate: parsed.value.expirationDate,
      singleUse: parsed.value.singleUse,
      qrImage: created.qrImage,
      createdBy: session.username,
    });

    return {
      error: null,
      success: `QR ${created.qrId} generado.`,
      nonce: Date.now(),
    };
  } catch (error) {
    if (error instanceof BgQrError) {
      return { error: error.message, success: null, nonce: Date.now() };
    }

    if (isUniqueViolation(error)) {
      return {
        error: "Ese QR ya estaba registrado.",
        success: null,
        nonce: Date.now(),
      };
    }

    throw error;
  }
}

export async function refreshQrChargeStatus(
  _state: QrActionState,
  formData: FormData,
): Promise<QrActionState> {
  const session = await requireQrOperator();
  const qrId = String(formData.get("qrId") ?? "").trim();
  const existing = qrId ? await findGeneratedQr(qrId) : undefined;

  if (!existing) {
    return { error: "No se encontró el QR.", success: null, nonce: Date.now() };
  }

  const limit = await consumeRateLimit("bg-qr-status", session.userId);

  if (!limit.allowed) {
    return {
      error: "Demasiadas consultas. Espera un minuto antes de volver a preguntar.",
      success: null,
      nonce: Date.now(),
    };
  }

  try {
    const status = await queryBankQrStatus(existing.qrId);
    await saveQrStatus(existing.qrId, {
      orderState: status.orderState,
      statusMessage: status.message,
      payDate: status.payDate,
      payHour: status.payHour,
      transactionNumber: status.transactionNumber,
    });

    return {
      error: null,
      success: statusSummary(existing.qrId, status),
      nonce: Date.now(),
    };
  } catch (error) {
    if (error instanceof BgQrError) {
      return { error: error.message, success: null, nonce: Date.now() };
    }

    throw error;
  }
}

export async function lookupQrStatus(
  _state: QrLookupState,
  formData: FormData,
): Promise<QrLookupState> {
  const session = await requireQrOperator();
  const qrId = String(formData.get("qrId") ?? "").trim();

  if (!/^[A-Za-z0-9]{8,32}$/.test(qrId)) {
    return emptyLookup("El identificador debe tener entre 8 y 32 letras o números.");
  }

  const limit = await consumeRateLimit("bg-qr-status", session.userId);

  if (!limit.allowed) {
    return emptyLookup("Demasiadas consultas. Espera un minuto antes de volver a preguntar.");
  }

  try {
    const status = await queryBankQrStatus(qrId);
    const existing = await findGeneratedQr(qrId);

    if (existing) {
      await saveQrStatus(qrId, {
        orderState: status.orderState,
        statusMessage: status.message,
        payDate: status.payDate,
        payHour: status.payHour,
        transactionNumber: status.transactionNumber,
      });
    }

    return {
      error: null,
      nonce: Date.now(),
      qrId,
      message: status.message,
      orderState: status.orderState,
      payDate: status.payDate,
      payHour: status.payHour,
      transactionNumber: status.transactionNumber,
    };
  } catch (error) {
    if (error instanceof BgQrError) {
      return emptyLookup(error.message);
    }

    throw error;
  }
}

function emptyLookup(error: string): QrLookupState {
  return {
    error,
    nonce: Date.now(),
    qrId: null,
    message: null,
    orderState: null,
    payDate: null,
    payHour: null,
    transactionNumber: null,
  };
}

function statusSummary(
  qrId: string,
  status: {
    message: string;
    orderState: number | null;
    payDate: string | null;
    payHour: string | null;
    transactionNumber: string | null;
  },
) {
  const parts = [
    status.message || "Estado actualizado.",
    status.orderState === null ? null : `estado ${status.orderState}`,
    status.payDate,
    status.payHour,
    status.transactionNumber ? `transacción ${status.transactionNumber}` : null,
  ].filter((part): part is string => Boolean(part));

  return `${qrId}: ${parts.join(" · ")}`;
}

async function requireQrOperator() {
  const session = await getDashboardSession();

  if (!session) {
    redirect("/login");
  }

  if (session.mustChangePassword) {
    redirect("/cuenta/contrasena");
  }

  if (session.role !== "admin" && session.role !== "cobrador") {
    redirect("/");
  }

  return session;
}

function isUniqueViolation(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }

  if ("code" in error && (error as { code?: string }).code === "23505") {
    return true;
  }

  if ("cause" in error) {
    return isUniqueViolation((error as { cause?: unknown }).cause);
  }

  return false;
}
