import Link from "next/link";

import { LogoutButton } from "@/components/dashboard/logout-button";
import { buttonVariants } from "@/components/ui/button";
import { roleLabels, type DashboardRole } from "@/modules/dashboard/roles";
import { cn } from "cn";

export function DashboardHeader({
  title,
  description,
  username,
  role,
}: {
  title: string;
  description: string;
  username: string;
  role: DashboardRole;
}) {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex flex-col gap-1">
        <p className="text-sm text-muted-foreground">
          {username} · {roleLabels[role]}
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Link href="/" className={cn(buttonVariants({ variant: "outline" }))}>
          Notificaciones
        </Link>
        <Link
          href="/cobros"
          className={cn(buttonVariants({ variant: "outline" }))}
        >
          Cobros QR
        </Link>
        <Link
          href="/estado"
          className={cn(buttonVariants({ variant: "outline" }))}
        >
          Consultar estado
        </Link>
        {role === "admin" ? (
          <Link
            href="/usuarios"
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            Usuarios
          </Link>
        ) : null}
        <LogoutButton />
      </div>
    </header>
  );
}
