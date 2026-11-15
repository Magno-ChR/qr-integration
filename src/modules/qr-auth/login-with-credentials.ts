import { z } from "zod";

import { issueAccessToken } from "@/modules/qr-auth/jwt-token-service";
import { getEnv } from "@/shared/config/env";
import { ApiError } from "@/shared/http/api-error";
import { safeEqual } from "@/shared/security/safe-equal";

const loginSchema = z.object({
  userName: z.string().min(1),
  password: z.string().min(1),
});

export async function loginWithCredentials(body: unknown) {
  const parsed = loginSchema.safeParse(body);

  if (!parsed.success) {
    throw new ApiError(
      "COD003",
      "La solicitud debe incluir userName y password.",
      400,
    );
  }

  const env = getEnv();
  const userMatches = safeEqual(parsed.data.userName, env.QR_API_USERNAME);
  const passwordMatches = safeEqual(parsed.data.password, env.QR_API_PASSWORD);

  if (!userMatches || !passwordMatches) {
    throw new ApiError("COD001", "Credenciales inválidas.", 401);
  }

  const token = await issueAccessToken();

  return {
    result: "COD000" as const,
    message: "Token generado exitosamente",
    token,
  };
}
