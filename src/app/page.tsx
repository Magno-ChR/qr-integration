import { redirect } from "next/navigation";
import { Suspense } from "react";

import { NotificationsView } from "@/components/payments/notifications-view";
import { getDashboardSession } from "@/modules/dashboard/session";
import { listPaymentNotifications } from "@/modules/qr-payments/payment-notification-repository";

export default function HomePage() {
  return (
    <Suspense fallback={<NotificationsFallback />}>
      <NotificationsPage />
    </Suspense>
  );
}

async function NotificationsPage() {
  const session = await getDashboardSession();

  if (!session) {
    redirect("/login");
  }

  if (session.mustChangePassword) {
    redirect("/cuenta/contrasena");
  }

  const { rows, total } = await listPaymentNotifications();

  return (
    <NotificationsView
      rows={rows}
      total={total}
      username={session.username}
      role={session.role}
    />
  );
}

function NotificationsFallback() {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-4 py-8 sm:px-6">
      <div className="h-8 w-64 animate-pulse rounded-lg bg-muted" />
      <div className="h-40 animate-pulse rounded-xl bg-muted" />
    </div>
  );
}
