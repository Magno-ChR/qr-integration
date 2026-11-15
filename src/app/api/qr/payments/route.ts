import { readAccessToken } from "@/modules/qr-auth/read-access-token";
import { receivePaymentNotification } from "@/modules/qr-payments/receive-payment-notification";
import { ApiError, apiJson, toErrorResponse } from "@/shared/http/api-error";
import { readJsonBody } from "@/shared/http/read-json-body";
import { clientAddress, consumeRateLimit } from "@/shared/security/rate-limit";

export async function POST(request: Request) {
  try {
    await enforceApiRateLimit(request);
    const token = readAccessToken(request);

    if (!token) {
      throw new ApiError("COD002", "Token no proporcionado.", 401);
    }

    const body = await readJsonBody(request);
    const result = await receivePaymentNotification({ token, body });
    return apiJson(result);
  } catch (error) {
    return toErrorResponse(error);
  }
}

async function enforceApiRateLimit(request: Request) {
  const limit = await consumeRateLimit(
    "qr-payments",
    clientAddress(request.headers),
  );

  if (!limit.allowed) {
    throw new ApiError(
      "COD429",
      "Demasiadas solicitudes. Intenta de nuevo en un minuto.",
      429,
      { "Retry-After": String(limit.retryAfterSeconds) },
    );
  }
}
