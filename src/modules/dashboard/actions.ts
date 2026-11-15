"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { sanitizeDashboardLogin } from "@/modules/dashboard/login-sanitizer";
import { clientAddress, consumeRateLimit } from "@/shared/security/rate-limit";

import {
  hashPassword,
  normalizeUsername,
  passwordPolicyError,
  usernamePolicyError,
  verifyPassword,
  type PasswordDigest,
} from "@/modules/dashboard/password";
import { isDashboardRole } from "@/modules/dashboard/roles";
import {
  clearDashboardSession,
  createDashboardSession,
  getDashboardSession,
} from "@/modules/dashboard/session";
import {
  ensureAdminUser,
  findUserById,
  findUserByUsername,
  insertDashboardUser,
  updateUserPassword,
} from "@/modules/dashboard/user-repository";

export type FormState = {
  error: string | null;
  success: string | null;
};

let standInDigest: PasswordDigest | undefined;

async function rejectUnknownPassword(password: string) {
  standInDigest ??= await hashPassword("stand-in-password");
  await verifyPassword(password, standInDigest.salt, standInDigest.hash);
}

export async function loginDashboard(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  const headerStore = await headers();
  const limit = await consumeRateLimit(
    "dashboard-login",
    clientAddress(headerStore),
  );

  if (!limit.allowed) {
    return {
      error: "Demasiados intentos. Espera 30 minutos antes de volver a entrar.",
      success: null,
    };
  }

  const rawUsername = String(formData.get("username") ?? "");
  const rawPassword = String(formData.get("password") ?? "");

  if (!rawUsername.trim() || !rawPassword) {
    return { error: "Ingresa usuario y contraseña.", success: null };
  }

  const sanitized = sanitizeDashboardLogin(rawUsername, rawPassword);

  if (!sanitized.ok) {
    return { error: sanitized.message, success: null };
  }

  const { username, password } = sanitized.value;

  await ensureAdminUser();
  const user = await findUserByUsername(username);

  if (!user || !isDashboardRole(user.role)) {
    await rejectUnknownPassword(password);
    return { error: "Usuario o contraseña incorrectos.", success: null };
  }

  const passwordMatches = await verifyPassword(
    password,
    user.passwordSalt,
    user.passwordHash,
  );

  if (!passwordMatches) {
    return { error: "Usuario o contraseña incorrectos.", success: null };
  }

  await createDashboardSession({
    userId: user.id,
    username: user.username,
    role: user.role,
  });

  if (user.mustChangePassword) {
    redirect("/cuenta/contrasena");
  }

  redirect("/");
}

export async function logoutDashboard() {
  await clearDashboardSession();
  redirect("/login");
}

export async function changePassword(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  const session = await getDashboardSession();

  if (!session) {
    redirect("/login");
  }

  const currentPassword = String(formData.get("currentPassword") ?? "");
  const newPassword = String(formData.get("newPassword") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");
  const user = await findUserById(session.userId);

  if (!user) {
    redirect("/login");
  }

  const currentMatches = await verifyPassword(
    currentPassword,
    user.passwordSalt,
    user.passwordHash,
  );

  if (!currentMatches) {
    return { error: "La contraseña actual no coincide.", success: null };
  }

  const policyError = passwordPolicyError(newPassword);

  if (policyError) {
    return { error: policyError, success: null };
  }

  if (newPassword !== confirmPassword) {
    return { error: "La confirmación no coincide.", success: null };
  }

  const sameAsCurrent = await verifyPassword(
    newPassword,
    user.passwordSalt,
    user.passwordHash,
  );

  if (sameAsCurrent) {
    return {
      error: "La nueva contraseña debe ser distinta a la actual.",
      success: null,
    };
  }

  const digest = await hashPassword(newPassword);
  await updateUserPassword(user.id, digest, false);
  await createDashboardSession({
    userId: user.id,
    username: user.username,
    role: session.role,
  });
  redirect("/");
}

export async function createCollector(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  const username = normalizeUsername(String(formData.get("username") ?? ""));
  const password = String(formData.get("password") ?? "");
  const usernameError = usernamePolicyError(username);

  if (usernameError) {
    return { error: usernameError, success: null };
  }

  if (username === "admin") {
    return { error: "Ese usuario está reservado.", success: null };
  }

  const policyError = passwordPolicyError(password);

  if (policyError) {
    return { error: policyError, success: null };
  }

  const existing = await findUserByUsername(username);

  if (existing) {
    return { error: "Ya existe un usuario con ese nombre.", success: null };
  }

  await insertDashboardUser({
    username,
    role: "cobrador",
    digest: await hashPassword(password),
  });

  return {
    error: null,
    success: `Usuario ${username} creado. Debe cambiar la contraseña al entrar.`,
  };
}

export async function resetUserPassword(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  const userId = String(formData.get("userId") ?? "");
  const password = String(formData.get("password") ?? "");
  const user = await findUserById(userId);

  if (!user) {
    return { error: "No se encontró el usuario.", success: null };
  }

  const policyError = passwordPolicyError(password);

  if (policyError) {
    return { error: policyError, success: null };
  }

  await updateUserPassword(user.id, await hashPassword(password), true);

  return {
    error: null,
    success: `${user.username} deberá elegir una contraseña nueva al entrar.`,
  };
}

async function requireAdmin() {
  const session = await getDashboardSession();

  if (!session) {
    redirect("/login");
  }

  if (session.mustChangePassword) {
    redirect("/cuenta/contrasena");
  }

  if (session.role !== "admin") {
    redirect("/");
  }

  return session;
}
