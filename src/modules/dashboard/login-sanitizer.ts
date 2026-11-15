import { normalizeUsername } from "@/modules/dashboard/password";

const usernamePattern = /^[a-z0-9]{1,32}$/;
const passwordPattern = /^[A-Za-z0-9]{1,128}$/;

export function sanitizeDashboardLogin(rawUsername: string, rawPassword: string) {
  const username = cleanUsername(rawUsername);
  const password = cleanPassword(rawPassword);

  if (!username || !password) {
    return {
      ok: false as const,
      message: "El usuario o la contraseña contienen caracteres no permitidos.",
    };
  }

  return {
    ok: true as const,
    value: { username, password },
  };
}

function cleanUsername(value: string) {
  if (hasForbiddenCharacter(value)) {
    return null;
  }

  const candidate = normalizeUsername(value.normalize("NFKC"));

  if (!usernamePattern.test(candidate)) {
    return null;
  }

  return candidate;
}

function cleanPassword(value: string) {
  if (hasForbiddenCharacter(value) || value.normalize("NFKC") !== value) {
    return null;
  }

  if (!passwordPattern.test(value)) {
    return null;
  }

  return value;
}

function hasForbiddenCharacter(value: string) {
  if (value.includes("\0")) {
    return true;
  }

  for (const character of value) {
    const code = character.charCodeAt(0);

    if (code <= 31 || code === 127) {
      return true;
    }
  }

  return false;
}
