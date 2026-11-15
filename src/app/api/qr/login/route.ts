import { loginWithCredentials } from "@/modules/qr-auth/login-with-credentials";
import { ApiError, apiJson, toErrorResponse } from "@/shared/http/api-error";
import { readJsonBody } from "@/shared/http/read-json-body";
import { clientAddress, consumeRateLimit } from "@/shared/security/rate-limit";

export async function POST(request: Request) {
  try {
    await enforceApiRateLimit(request, "qr-login");
    const body = await readJsonBody(request);
    const result = await loginWithCredentials(body);
    return apiJson(result);
  } catch (error) {
    return toErrorResponse(error);
  }
}

async function enforceApiRateLimit(
  request: Request,
  scope: "qr-login" | "qr-payments",
) {
  const limit = await consumeRateLimit(scope, clientAddress(request.headers));

  if (!limit.allowed) {
    throw new ApiError(
      "COD429",
      "Demasiadas solicitudes. Intenta de nuevo en un minuto.",
      429,
      { "Retry-After": String(limit.retryAfterSeconds) },
    );
  }
}
