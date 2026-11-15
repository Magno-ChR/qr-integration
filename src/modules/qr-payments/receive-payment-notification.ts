import { verifyAccessToken } from "@/modules/qr-auth/jwt-token-service";
import { ApiError } from "@/shared/http/api-error";

import {
  formatValidationMessage,
  paymentNotificationSchema,
} from "./payment-notification";
import { savePaymentNotification } from "./payment-notification-repository";

export async function receivePaymentNotification(input: {
  token: string | null;
  body: unknown;
}) {
  if (!input.token) {
    throw new ApiError("COD002", "Token no proporcionado.", 401);
  }

  try {
    await verifyAccessToken(input.token);
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    throw new ApiError("COD002", "Token inválido o expirado.", 401);
  }

  const parsed = paymentNotificationSchema.safeParse(input.body);

  if (!parsed.success) {
    throw new ApiError("COD003", formatValidationMessage(parsed.error), 400);
  }

  const payload =
    input.body !== null && typeof input.body === "object"
      ? (input.body as Record<string, unknown>)
      : { ...parsed.data };

  await savePaymentNotification(parsed.data, payload);

  return {
    result: "COD000" as const,
    message: "Notificación de pago recibida.",
  };
}
