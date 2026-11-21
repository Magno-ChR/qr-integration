import { redirect } from "next/navigation";
import { Suspense } from "react";

import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { QrChargesPanel } from "@/components/qr/qr-charges-panel";
import { readBgQrConfig } from "@/modules/bg-qr/config";
import { defaultChargeFields, defaultExpirationIso } from "@/modules/bg-qr/charge-input";
import { presentQrCharge } from "@/modules/bg-qr/present-qr";
import { listGeneratedQrCodes } from "@/modules/bg-qr/repository";
import { getDashboardSession } from "@/modules/dashboard/session";

export default function QrChargesPage() {
  return (
    <Suspense fallback={<QrChargesFallback />}>
      <QrChargesGate />
    </Suspense>
  );
}

async function QrChargesGate() {
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

  const rows = await listGeneratedQrCodes();
  const config = readBgQrConfig();
  const createdAtFormatter = new Intl.DateTimeFormat("es-BO", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/La_Paz",
  });
  const defaults = defaultChargeFields();

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6">
      <DashboardHeader
        title="Cobros QR"
        description="Genera un código de Banco Ganadero y consulta si la orden ya fue pagada."
        username={session.username}
        role={session.role}
      />
      <QrChargesPanel
        rows={rows.map((row) =>
          presentQrCharge(row, createdAtFormatter.format(row.createdAt)),
        )}
        accountReference={config.ok ? config.value.accountReference : null}
        configError={
          config.ok
            ? null
            : `Faltan variables de entorno: ${config.missing.join(", ")}.`
        }
        defaultExpiration={defaultExpirationIso()}
        defaultAmount={defaults.amount}
        defaultReference={defaults.reference}
        defaultGloss={defaults.gloss}
      />
    </div>
  );
}

function QrChargesFallback() {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-4 py-8 sm:px-6">
      <div className="h-8 w-48 animate-pulse rounded-lg bg-muted" />
      <div className="h-40 animate-pulse rounded-xl bg-muted" />
    </div>
  );
}
