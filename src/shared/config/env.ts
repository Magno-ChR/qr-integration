import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  QR_API_USERNAME: z.string().min(1),
  QR_API_PASSWORD: z.string().min(1),
  JWT_SECRET: z.string().min(32),
  JWT_ISSUER: z.string().min(1),
  JWT_AUDIENCE: z.string().min(1),
  JWT_UNIQUE_NAME: z.string().min(1),
  JWT_ROLE: z.string().min(1),
  JWT_EXPIRES_SECONDS: z.coerce.number().int().positive().max(86_400),
  DASHBOARD_PASSWORD: z.string().min(8),
});

export type AppEnv = z.infer<typeof envSchema>;

let cached: AppEnv | undefined;

export function getEnv(): AppEnv {
  if (cached) {
    return cached;
  }

  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    const fields = parsed.error.issues
      .map((issue) => issue.path.join("."))
      .join(", ");
    throw new Error(`Variables de entorno inválidas: ${fields}`);
  }

  cached = parsed.data;
  return cached;
}
