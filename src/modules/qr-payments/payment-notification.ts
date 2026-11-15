import { z } from "zod";

const payDate = z
  .string()
  .regex(/^\d{8}$/, "payDate debe tener formato DDMMYYYY")
  .refine(isRealPayDate, "payDate no es una fecha válida");

const payHour = z
  .string()
  .regex(/^\d{2}:\d{2}$/, "payHour debe tener formato HH:mm")
  .refine(isRealPayHour, "payHour no es una hora válida");

export const paymentNotificationSchema = z.object({
  qrId: z.string().trim().min(1, "qrId es obligatorio"),
  transactionId: z.string().trim().min(1, "transactionId es obligatorio"),
  payDate,
  payHour,
  originAccount: z.string().trim().min(1, "originAccount es obligatorio"),
  originBank: z.string().trim().min(1, "originBank es obligatorio"),
  amount: z
    .string()
    .regex(/^\d+(\.\d+)?$/, "amount debe ser un número positivo")
    .refine((value) => Number(value) > 0, "amount debe ser mayor a 0"),
});

export type PaymentNotificationInput = z.infer<
  typeof paymentNotificationSchema
>;

function isRealPayDate(value: string) {
  const day = Number(value.slice(0, 2));
  const month = Number(value.slice(2, 4));
  const year = Number(value.slice(4, 8));
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

function isRealPayHour(value: string) {
  const [hour, minute] = value.split(":").map(Number);
  return hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59;
}

export function formatValidationMessage(
  error: z.ZodError<PaymentNotificationInput>,
) {
  return error.issues
    .map((issue) => {
      const field = issue.path.join(".") || "solicitud";
      return `${field}: ${issue.message}`;
    })
    .join(" ");
}
