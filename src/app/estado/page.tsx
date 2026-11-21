import { redirect } from "next/navigation";
import { Suspense } from "react";

import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { QrStatusLookup } from "@/components/qr/qr-status-lookup";
import { getDashboardSession } from "@/modules/dashboard/session";

export default function QrStatusPage() {
  return (
    <Suspense fallback={<StatusFallback />}>
      <StatusGate />
    </Suspense>
  );
}

async function StatusGate() {
  const session = await getDashboardSession();

  if (!session) {
    redirect("/login");
  }

  if (session.mustChangePassword) {
    redirect("/cuenta/contrasena");
  }

  if (session.role !== "admin" && session.role !== "cobrador") {
    redirect("/");
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8 sm:px-6">
      <DashboardHeader
        title="Consultar estado"
        description="Pregunta al banco por un qrId, aunque el cobro no esté en el listado."
        username={session.username}
        role={session.role}
      />
      <QrStatusLookup />
    </div>
  );
}

function StatusFallback() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-3 px-4 py-8 sm:px-6">
      <div className="h-8 w-48 animate-pulse rounded-lg bg-muted" />
      <div className="h-40 animate-pulse rounded-xl bg-muted" />
    </div>
  );
}
