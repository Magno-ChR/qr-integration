import { z } from "zod";

const configSchema = z.object({
  BG_QR_USERNAME: z.string().trim().min(1).max(64),
  BG_QR_PASSWORD: z.string().min(1).max(200),
  BG_QR_API_KEY: z.string().trim().min(1).max(300),
  BG_QR_ACCOUNT_REFERENCE: z.string().trim().min(1).max(64),
  BG_QR_BASE_URL: z.string().trim().url(),
});

export type BgQrConfig = {
  username: string;
  password: string;
  apiKey: string;
  accountReference: string;
  accessUrl: string;
  generateUrl: string;
  statusUrl: string;
};

const requiredKeys = [
  "BG_QR_USERNAME",
  "BG_QR_PASSWORD",
  "BG_QR_API_KEY",
  "BG_QR_ACCOUNT_REFERENCE",
  "BG_QR_BASE_URL",
] as const;

export function readBgQrConfig():
  | { ok: true; value: BgQrConfig }
  | { ok: false; missing: string[] } {
  const parsed = configSchema.safeParse({
    BG_QR_USERNAME: blankToUndefined(process.env.BG_QR_USERNAME),
    BG_QR_PASSWORD: emptyToUndefined(process.env.BG_QR_PASSWORD),
    BG_QR_API_KEY: blankToUndefined(process.env.BG_QR_API_KEY),
    BG_QR_ACCOUNT_REFERENCE: blankToUndefined(
      process.env.BG_QR_ACCOUNT_REFERENCE,
    ),
    BG_QR_BASE_URL: blankToUndefined(process.env.BG_QR_BASE_URL),
  });

  if (!parsed.success) {
    const missing = new Set<string>();

    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "");

      if (key) {
        missing.add(key);
      }
    }

    if (missing.size === 0) {
      for (const key of requiredKeys) {
        missing.add(key);
      }
    }

    return { ok: false, missing: [...missing] };
  }

  let baseUrl: URL;

  try {
    baseUrl = new URL(parsed.data.BG_QR_BASE_URL);
  } catch {
    return { ok: false, missing: ["BG_QR_BASE_URL"] };
  }

  if (baseUrl.protocol !== "https:" || baseUrl.username || baseUrl.password) {
    return { ok: false, missing: ["BG_QR_BASE_URL"] };
  }

  const root = `${baseUrl.origin}${baseUrl.pathname.replace(/\/$/, "")}/`;

  return {
    ok: true,
    value: {
      username: parsed.data.BG_QR_USERNAME,
      password: parsed.data.BG_QR_PASSWORD,
      apiKey: parsed.data.BG_QR_API_KEY,
      accountReference: parsed.data.BG_QR_ACCOUNT_REFERENCE,
      accessUrl: new URL("access", root).toString(),
      generateUrl: new URL("collections", root).toString(),
      statusUrl: new URL("status", root).toString(),
    },
  };
}

function blankToUndefined(value: string | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function emptyToUndefined(value: string | undefined) {
  if (!value || !value.trim()) {
    return undefined;
  }

  return value;
}
