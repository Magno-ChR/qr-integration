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
  showUsersLink,
}: {
  title: string;
  description: string;
  username: string;
  role: DashboardRole;
  showUsersLink?: boolean;
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
        {showUsersLink ? (
          <Link
            href="/usuarios"
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            Usuarios
          </Link>
        ) : null}
        {role === "admin" && !showUsersLink ? (
          <Link href="/" className={cn(buttonVariants({ variant: "outline" }))}>
            Notificaciones
          </Link>
        ) : null}
        <LogoutButton />
      </div>
    </header>
  );
}
