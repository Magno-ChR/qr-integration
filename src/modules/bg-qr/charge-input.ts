const glossPattern = /^[\p{L}\p{N} .,:/_-]{1,80}$/u;
const referencePattern = /^[\p{L}\p{N} .,:/_-]{1,60}$/u;
const amountPattern = /^(?:0|[1-9]\d{0,8})(?:\.\d{1,2})?$/;
const minimumCents = 10;

export type QrChargeInput = {
  amount: string;
  amountValue: number;
  gloss: string;
  reference: string;
  expirationDate: string;
  singleUse: "0" | "1";
};

export function parseQrChargeInput(
  formData: FormData,
): { ok: true; value: QrChargeInput } | { ok: false; message: string } {
  const amount = normalizeAmount(String(formData.get("amount") ?? ""));
  const defaults = defaultChargeFields();
  const gloss = String(formData.get("gloss") ?? "").trim() || defaults.gloss;
  const reference =
    String(formData.get("reference") ?? "").trim() || defaults.reference;
  const expiration = String(formData.get("expirationDate") ?? "").trim();
  const singleUse = String(formData.get("singleUse") ?? "").trim();

  if (!amount.ok) {
    return amount;
  }

  if (!glossPattern.test(gloss)) {
    return {
      ok: false,
      message: "La glosa admite letras, números y los signos . , : / _ - (máximo 80).",
    };
  }

  if (!referencePattern.test(reference)) {
    return {
      ok: false,
      message: "La referencia admite letras, números y los signos . , : / _ - (máximo 60).",
    };
  }

  const expirationDate = toBankDate(expiration);

  if (!expirationDate) {
    return { ok: false, message: "La fecha de vencimiento no es válida." };
  }

  if (expiration < todayInLaPaz()) {
    return { ok: false, message: "La fecha de vencimiento debe ser hoy o posterior." };
  }

  if (singleUse !== "0" && singleUse !== "1") {
    return { ok: false, message: "Elige si el QR es de un solo uso." };
  }

  return {
    ok: true,
    value: {
      amount: amount.amount,
      amountValue: amount.amountValue,
      gloss,
      reference,
      expirationDate,
      singleUse,
    },
  };
}

export function toBankDate(isoDate: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate);

  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const utc = new Date(Date.UTC(year, month - 1, day));

  if (
    utc.getUTCFullYear() !== year ||
    utc.getUTCMonth() !== month - 1 ||
    utc.getUTCDate() !== day
  ) {
    return null;
  }

  return `${match[3]}${match[2]}${match[1]}`;
}

export function todayInLaPaz() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/La_Paz",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export function defaultChargeFields(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "America/La_Paz",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const read = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";
  const day = read("day");
  const month = read("month");
  const hour = read("hour");
  const minute = read("minute");

  return {
    amount: "0.10",
    reference: `pago qr ${day}${month} ${hour}${minute}`,
    gloss: `servicio de prueba ${day}${month} ${hour}${minute}`,
  };
}

function normalizeAmount(
  value: string,
):
  | { ok: true; amount: string; amountValue: number }
  | { ok: false; message: string } {
  const raw = value.trim() || "0.10";

  if (!amountPattern.test(raw)) {
    return {
      ok: false,
      message: "El monto mínimo es 0.10, con hasta 2 decimales.",
    };
  }

  const cents = Math.round(Number(raw) * 100);

  if (cents < minimumCents) {
    return { ok: false, message: "El monto mínimo es 0.10." };
  }

  return { ok: true, amount: (cents / 100).toFixed(2), amountValue: cents / 100 };
}

export function defaultExpirationIso() {
  const [year, month, day] = todayInLaPaz().split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + 30);
  return date.toISOString().slice(0, 10);
}
