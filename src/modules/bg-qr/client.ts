import { decodeJwt } from "jose";

import { readBgQrConfig, type BgQrConfig } from "@/modules/bg-qr/config";

export class BgQrError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BgQrError";
  }
}

export type BankQrStatus = {
  message: string;
  orderState: number | null;
  payDate: string | null;
  payHour: string | null;
  transactionNumber: string | null;
};

type TokenCache = {
  token: string;
  expiresAtMs: number;
};

let tokenCache: TokenCache | undefined;

export function requireBgQrConfig() {
  const config = readBgQrConfig();

  if (!config.ok) {
    throw new BgQrError(
      `Faltan variables de entorno: ${config.missing.join(", ")}.`,
    );
  }

  return config.value;
}

export async function createBankQr(input: {
  amount: number;
  gloss: string;
  reference: string;
  expirationDate: string;
  singleUse: "0" | "1";
}) {
  const config = requireBgQrConfig();
  const token = await getAccessToken(config);

  try {
    return await generateQr(config, token, input);
  } catch (error) {
    if (!(error instanceof BgQrError) || !isAuthFailure(error.message)) {
      throw error;
    }

    tokenCache = undefined;
    return generateQr(config, await getAccessToken(config), input);
  }
}

export async function queryBankQrStatus(qrId: string) {
  const config = requireBgQrConfig();
  const token = await getAccessToken(config);

  try {
    return await readStatus(config, token, qrId);
  } catch (error) {
    if (!(error instanceof BgQrError) || !isAuthFailure(error.message)) {
      throw error;
    }

    tokenCache = undefined;
    return readStatus(config, await getAccessToken(config), qrId);
  }
}

async function getAccessToken(config: BgQrConfig) {
  if (tokenCache && tokenCache.expiresAtMs > Date.now() + 15_000) {
    return tokenCache.token;
  }

  const data = await postJson(
    config.accessUrl,
    {
      userName: config.username,
      password: config.password,
    },
    { "X-Api-Key": config.apiKey },
    config.apiKey,
  );
  const token = typeof data.token === "string" ? data.token.trim() : "";

  if (!token) {
    throw new BgQrError(
      bankFailure(config.accessUrl, data.result, "El banco no devolvió un token.", config.apiKey),
    );
  }

  tokenCache = { token, expiresAtMs: tokenExpiry(token) };
  return token;
}

async function generateQr(
  config: BgQrConfig,
  token: string,
  input: {
    amount: number;
    gloss: string;
    reference: string;
    expirationDate: string;
    singleUse: "0" | "1";
  },
) {
  const data = await postJson(
    config.generateUrl,
    {
      accountReference: config.accountReference,
      amount: input.amount,
      currency: "BOB",
      gloss: input.gloss,
      reference: input.reference,
      expirationDate: input.expirationDate,
      singleUse: input.singleUse,
      userName: config.username,
      apiKey: config.apiKey,
    },
    {
      Authorization: `Bearer ${token}`,
      "X-Api-Key": config.apiKey,
    },
    config.apiKey,
  );
  const qrId = typeof data.qrId === "string" ? data.qrId.trim() : "";
  const qrImage = typeof data.qrImage === "string" ? data.qrImage.trim() : "";

  if (!qrId || !qrImage) {
    throw new BgQrError(
      bankFailure(
        config.generateUrl,
        data.result,
        "El banco no devolvió el código QR.",
        config.apiKey,
      ),
    );
  }

  return { qrId, qrImage };
}

async function readStatus(config: BgQrConfig, token: string, qrId: string) {
  const data = await postJson(
    config.statusUrl,
    {
      qrId,
      userName: config.username,
      apiKey: config.apiKey,
      type: 2,
    },
    {
      Authorization: `Bearer ${token}`,
      "X-Api-Key": config.apiKey,
    },
    config.apiKey,
  );

  return {
    message: typeof data.message === "string" ? data.message.trim() : "",
    orderState: readOrderState(data.orderState),
    payDate: typeof data.payday === "string" ? data.payday : null,
    payHour: typeof data.payHour === "string" ? data.payHour : null,
    transactionNumber: readTransactionNumber(data.transactionNumber),
  } satisfies BankQrStatus;
}

async function postJson(
  url: string,
  body: unknown,
  headers: Record<string, string>,
  apiKey: string,
) {
  let response: Response;

  try {
    response = await fetch(url, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...headers,
      },
      body: JSON.stringify(body),
      cache: "no-store",
      signal: AbortSignal.timeout(25_000),
    });
  } catch {
    throw new BgQrError(
      bankFailure(url, undefined, "No se pudo contactar al banco.", apiKey),
    );
  }

  const text = await response.text();
  const trimmed = text.replace(/^\uFEFF/, "").trim();
  let parsed: unknown;

  if (!trimmed) {
    throw new BgQrError(
      bankFailure(url, undefined, `HTTP ${response.status} sin contenido.`, apiKey),
    );
  }

  try {
    parsed = JSON.parse(trimmed);
  } catch {
    throw new BgQrError(
      bankFailure(url, undefined, bodyProblem(response.status, trimmed), apiKey),
    );
  }

  if (typeof parsed === "string") {
    const encoded = parsed;

    try {
      parsed = JSON.parse(encoded);
    } catch {
      throw new BgQrError(
        bankFailure(url, undefined, bodyProblem(response.status, encoded), apiKey),
      );
    }
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new BgQrError(
      bankFailure(url, undefined, bodyProblem(response.status, trimmed), apiKey),
    );
  }

  const record = parsed as Record<string, unknown>;

  if (record.result !== "COD000") {
    throw new BgQrError(bankFailure(url, record.result, record.message, apiKey));
  }

  return record;
}

function bankFailure(
  url: string,
  result: unknown,
  message: unknown,
  apiKey: string,
) {
  return `${operationName(url)}: result ${cleanBankText(result, apiKey)}, message ${cleanBankText(message, apiKey)}`;
}

function operationName(url: string) {
  try {
    return new URL(url).pathname.split("/").filter(Boolean).pop() ?? "banco";
  } catch {
    return "banco";
  }
}

function cleanBankText(value: unknown, apiKey: string) {
  const raw = typeof value === "string" ? value : "";
  const cleaned = raw
    .replaceAll(apiKey, "")
    .replace(/[\u0000-\u001F]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 180);

  return cleaned || "sin valor";
}

function bodyProblem(status: number, body: string) {
  if (/<!doctype html|<html/i.test(body)) {
    const plain = body
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 140);
    return plain
      ? `HTTP ${status} con HTML: ${plain}`
      : `HTTP ${status} con HTML.`;
  }

  return `HTTP ${status} con un formato inesperado.`;
}

function tokenExpiry(token: string) {
  try {
    const exp = decodeJwt(token).exp;

    if (typeof exp === "number") {
      return exp * 1000;
    }
  } catch {
    // A non-JWT token is reused for four minutes, under the five-minute sample.
  }

  return Date.now() + 4 * 60 * 1000;
}

function isAuthFailure(message: string) {
  return /token|autoriz|expir|sesi[oó]n/i.test(message);
}

function readOrderState(value: unknown) {
  if (typeof value === "number" && Number.isInteger(value)) {
    return value;
  }

  if (typeof value === "string" && /^-?\d+$/.test(value)) {
    return Number(value);
  }

  return null;
}

function readTransactionNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }

  return null;
}
