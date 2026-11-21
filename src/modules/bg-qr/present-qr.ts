import type { GeneratedQrCodeRecord } from "@/shared/db/schema";

const amountFormatter = new Intl.NumberFormat("es-BO", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export type QrChargeView = {
  id: string;
  qrId: string;
  amountLabel: string;
  gloss: string;
  reference: string;
  expirationLabel: string;
  singleUseLabel: string;
  imageSrc: string | null;
  statusLabel: string;
  statusVariant: "default" | "secondary" | "outline";
  payDetail: string | null;
  createdAtLabel: string;
  createdBy: string;
};

export function presentQrCharge(
  row: GeneratedQrCodeRecord,
  createdAtLabel: string,
): QrChargeView {
  const status = statusPresentation(row.orderState, row.statusMessage);
  const payParts = [
    row.payDate ? formatBankDate(row.payDate) : null,
    row.payHour,
    row.transactionNumber ? `Transacción ${row.transactionNumber}` : null,
  ].filter((part): part is string => Boolean(part));

  return {
    id: row.id,
    qrId: row.qrId,
    amountLabel: `${amountFormatter.format(Number(row.amount))} ${row.currency}`,
    gloss: row.gloss,
    reference: row.reference,
    expirationLabel: formatBankDate(row.expirationDate),
    singleUseLabel: row.singleUse === "1" ? "Uso único" : "Varios usos",
    imageSrc: toQrImageSrc(row.qrImage),
    statusLabel: status.statusLabel,
    statusVariant: status.statusVariant,
    payDetail: payParts.length > 0 ? payParts.join(" · ") : null,
    createdAtLabel,
    createdBy: row.createdBy,
  };
}

export function formatBankDate(value: string) {
  if (!/^\d{8}$/.test(value)) {
    return value;
  }

  return `${value.slice(0, 2)}/${value.slice(2, 4)}/${value.slice(4)}`;
}

export function toQrImageSrc(value: string) {
  const compact = value.replace(/\s/g, "");

  if (compact.startsWith("data:image/")) {
    const match =
      /^data:image\/(png|jpeg|jpg|gif|webp);base64,([A-Za-z0-9+/=]+)$/.exec(
        compact,
      );

    if (!match || match[2].length < 32) {
      return null;
    }

    const mime = match[1] === "jpg" ? "jpeg" : match[1];
    return `data:image/${mime};base64,${match[2]}`;
  }

  if (!/^[A-Za-z0-9+/=]+$/.test(compact) || compact.length < 32) {
    return null;
  }

  return `data:image/png;base64,${compact}`;
}

function statusPresentation(orderState: number | null, message: string | null) {
  const text = message?.trim() ?? "";
  const paid = orderState === 2 || /pagad/i.test(text);

  if (paid) {
    return {
      statusLabel: text || "Pagada",
      statusVariant: "default" as const,
    };
  }

  if (!text && orderState === null) {
    return {
      statusLabel: "Sin consultar",
      statusVariant: "outline" as const,
    };
  }

  return {
    statusLabel: text || `Estado ${orderState}`,
    statusVariant: "secondary" as const,
  };
}
