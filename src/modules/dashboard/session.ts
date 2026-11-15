import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

import type { DashboardRole } from "@/modules/dashboard/roles";
import { isDashboardRole } from "@/modules/dashboard/roles";
import { findUserById } from "@/modules/dashboard/user-repository";
import { getEnv } from "@/shared/config/env";

const cookieName = "dashboard_session";
const dashboardAudience = "dashboard";

export type DashboardSession = {
  userId: string;
  username: string;
  role: DashboardRole;
  mustChangePassword: boolean;
};

function secretKey() {
  return new TextEncoder().encode(getEnv().JWT_SECRET);
}

export async function createDashboardSession(user: {
  userId: string;
  username: string;
  role: DashboardRole;
}) {
  const env = getEnv();
  const token = await new SignJWT({
    username: user.username,
    role: user.role,
  })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuer(env.JWT_ISSUER)
    .setAudience(dashboardAudience)
    .setSubject(user.userId)
    .setIssuedAt()
    .setExpirationTime("12h")
    .sign(secretKey());

  const jar = await cookies();
  jar.set(cookieName, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
}

export async function clearDashboardSession() {
  const jar = await cookies();
  jar.delete(cookieName);
}

export async function getDashboardSession(): Promise<DashboardSession | null> {
  const jar = await cookies();
  const token = jar.get(cookieName)?.value;

  if (!token) {
    return null;
  }

  try {
    const env = getEnv();
    const { payload } = await jwtVerify(token, secretKey(), {
      issuer: env.JWT_ISSUER,
      audience: dashboardAudience,
      algorithms: ["HS256"],
    });
    const userId = payload.sub;

    if (!userId) {
      return null;
    }

    const user = await findUserById(userId);

    if (!user || !isDashboardRole(user.role)) {
      return null;
    }

    return {
      userId: user.id,
      username: user.username,
      role: user.role,
      mustChangePassword: user.mustChangePassword,
    };
  } catch {
    return null;
  }
}
