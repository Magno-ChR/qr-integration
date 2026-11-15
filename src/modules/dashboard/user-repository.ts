import { asc, eq } from "drizzle-orm";

import {
  hashPassword,
  type PasswordDigest,
} from "@/modules/dashboard/password";
import { isDashboardRole, type DashboardRole } from "@/modules/dashboard/roles";
import { getEnv } from "@/shared/config/env";
import { getDb } from "@/shared/db/client";
import { dashboardUsers, type DashboardUserRecord } from "@/shared/db/schema";

const adminUsername = "admin";

export type DashboardUserView = {
  id: string;
  username: string;
  role: DashboardRole;
  mustChangePassword: boolean;
  createdAt: Date;
};

export async function ensureAdminUser() {
  const existing = await findUserByUsername(adminUsername);

  if (existing) {
    return existing;
  }

  const digest = await hashPassword(getEnv().DASHBOARD_PASSWORD);

  try {
    await getDb().insert(dashboardUsers).values({
      username: adminUsername,
      passwordHash: digest.hash,
      passwordSalt: digest.salt,
      role: "admin",
      mustChangePassword: true,
    });
  } catch (error) {
    if (!isUniqueViolation(error)) {
      throw error;
    }
  }

  return findUserByUsername(adminUsername);
}

export async function findUserByUsername(username: string) {
  const rows = await getDb()
    .select()
    .from(dashboardUsers)
    .where(eq(dashboardUsers.username, username))
    .limit(1);

  return rows[0] ?? null;
}

export async function findUserById(id: string) {
  const rows = await getDb()
    .select()
    .from(dashboardUsers)
    .where(eq(dashboardUsers.id, id))
    .limit(1);
  const user = rows[0];

  if (!user || !isDashboardRole(user.role)) {
    return null;
  }

  return user;
}

export async function listDashboardUsers(): Promise<DashboardUserView[]> {
  const rows = await getDb()
    .select({
      id: dashboardUsers.id,
      username: dashboardUsers.username,
      role: dashboardUsers.role,
      mustChangePassword: dashboardUsers.mustChangePassword,
      createdAt: dashboardUsers.createdAt,
    })
    .from(dashboardUsers)
    .orderBy(asc(dashboardUsers.createdAt));

  return rows.flatMap((row) => {
    if (!isDashboardRole(row.role)) {
      return [];
    }

    return [
      {
        id: row.id,
        username: row.username,
        role: row.role,
        mustChangePassword: row.mustChangePassword,
        createdAt: row.createdAt,
      },
    ];
  });
}

export async function insertDashboardUser(input: {
  username: string;
  role: DashboardRole;
  digest: PasswordDigest;
}) {
  await getDb().insert(dashboardUsers).values({
    username: input.username,
    passwordHash: input.digest.hash,
    passwordSalt: input.digest.salt,
    role: input.role,
    mustChangePassword: true,
  });
}

export async function updateUserPassword(
  id: string,
  digest: PasswordDigest,
  mustChangePassword: boolean,
) {
  await getDb()
    .update(dashboardUsers)
    .set({
      passwordHash: digest.hash,
      passwordSalt: digest.salt,
      mustChangePassword,
      updatedAt: new Date(),
    })
    .where(eq(dashboardUsers.id, id));
}

export function toSessionUser(user: DashboardUserRecord) {
  if (!isDashboardRole(user.role)) {
    return null;
  }

  return {
    userId: user.id,
    username: user.username,
    role: user.role,
    mustChangePassword: user.mustChangePassword,
  };
}

function isUniqueViolation(error: unknown) {
  if (!error || typeof error !== "object") {
    return false;
  }

  const candidate = error as { code?: string; message?: string };
  return (
    candidate.code === "23505" ||
    candidate.message?.includes("dashboard_users_username_idx") === true ||
    candidate.message?.includes("duplicate key") === true
  );
}
