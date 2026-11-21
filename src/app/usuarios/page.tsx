import { redirect } from "next/navigation";
import { Suspense } from "react";

import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { UsersPanel } from "@/components/dashboard/users-panel";
import { getDashboardSession } from "@/modules/dashboard/session";
import { listDashboardUsers } from "@/modules/dashboard/user-repository";

export default function UsersPage() {
  return (
    <Suspense fallback={<UsersFallback />}>
      <UsersGate />
    </Suspense>
  );
}

async function UsersGate() {
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

  const users = await listDashboardUsers();
  const createdAtFormatter = new Intl.DateTimeFormat("es-BO", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/La_Paz",
  });

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6">
      <DashboardHeader
        title="Usuarios"
        description="El administrador crea cobradores y restablece contraseñas. El cobrador consulta notificaciones y genera cobros QR."
        username={session.username}
        role={session.role}
      />
      <UsersPanel
        users={users.map((user) => ({
          id: user.id,
          username: user.username,
          role: user.role,
          mustChangePassword: user.mustChangePassword,
          createdAtLabel: createdAtFormatter.format(user.createdAt),
        }))}
      />
    </div>
  );
}

function UsersFallback() {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-4 py-8 sm:px-6">
      <div className="h-8 w-48 animate-pulse rounded-lg bg-muted" />
      <div className="h-40 animate-pulse rounded-xl bg-muted" />
    </div>
  );
}
