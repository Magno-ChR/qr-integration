import { redirect } from "next/navigation";
import { Suspense } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LoginForm } from "@/components/dashboard/login-form";
import { getDashboardSession } from "@/modules/dashboard/session";

export default function LoginPage() {
  return (
    <Suspense>
      <LoginGate />
    </Suspense>
  );
}

async function LoginGate() {
  const session = await getDashboardSession();

  if (session?.mustChangePassword) {
    redirect("/cuenta/contrasena");
  }

  if (session) {
    redirect("/");
  }

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-16">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Panel de notificaciones</CardTitle>
          <CardDescription>
            Entra con tu usuario. La contraseña se comprueba contra el hash
            guardado y no se puede recuperar.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm />
        </CardContent>
      </Card>
    </main>
  );
}
