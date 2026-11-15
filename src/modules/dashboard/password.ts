import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";

const keyLength = 64;
const scryptOptions = {
  N: 16_384,
  r: 8,
  p: 1,
  maxmem: 64 * 1024 * 1024,
};

export type PasswordDigest = {
  salt: string;
  hash: string;
};

export function passwordPolicyError(password: string) {
  if (password.length < 8) {
    return "La contraseña debe tener al menos 8 caracteres.";
  }

  if (!/^[A-Za-z0-9]+$/.test(password)) {
    return "La contraseña solo puede contener letras y números.";
  }

  if (!/[A-Za-z]/.test(password)) {
    return "La contraseña debe incluir al menos una letra.";
  }

  if (!/\d/.test(password)) {
    return "La contraseña debe incluir al menos un número.";
  }

  return null;
}

export function normalizeUsername(value: string) {
  return value.trim().toLowerCase();
}

export function usernamePolicyError(username: string) {
  if (!/^[a-z0-9]{3,32}$/.test(username)) {
    return "El usuario debe tener entre 3 y 32 caracteres, solo letras y números.";
  }

  return null;
}

export async function hashPassword(password: string): Promise<PasswordDigest> {
  const salt = randomBytes(16).toString("base64url");
  const derived = await deriveKey(password, salt);

  return { salt, hash: derived.toString("base64url") };
}

export async function verifyPassword(
  password: string,
  salt: string,
  hash: string,
) {
  const derived = await deriveKey(password, salt);
  const stored = Buffer.from(hash, "base64url");

  if (derived.length !== stored.length) {
    return false;
  }

  return timingSafeEqual(derived, stored);
}

function deriveKey(password: string, salt: string) {
  return new Promise<Buffer>((resolve, reject) => {
    scrypt(password, salt, keyLength, scryptOptions, (error, derived) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(derived);
    });
  });
}
