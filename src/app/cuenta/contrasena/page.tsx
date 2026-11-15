import { redirect } from "next/navigation";
import { Suspense } from "react";

import { ChangePasswordForm } from "@/components/dashboard/change-password-form";
import { LogoutButton } from "@/components/dashboard/logout-button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getDashboardSession } from "@/modules/dashboard/session";

export default function ChangePasswordPage() {
  return (
    <Suspense>
      <ChangePasswordGate />
    </Suspense>
  );
}

async function ChangePasswordGate() {
  const session = await getDashboardSession();

  if (!session) {
    redirect("/login");
  }

  if (!session.mustChangePassword) {
    redirect("/");
  }

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-16">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Actualiza tu contraseña</CardTitle>
          <CardDescription>
            {session.username} debe elegir una contraseña nueva antes de
            continuar. Mínimo 8 caracteres, letras y números, con al menos un
            número.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <ChangePasswordForm />
          <LogoutButton />
        </CardContent>
      </Card>
    </main>
  );
}
