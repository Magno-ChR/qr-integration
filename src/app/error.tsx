"use client";

import { Button } from "@/components/ui/button";

export default function DashboardError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-16">
      <div className="flex max-w-md flex-col gap-4 text-center">
        <h1 className="text-xl font-semibold">
          No se pudieron cargar las notificaciones
        </h1>
        <p className="text-sm text-muted-foreground">
          Revisa la conexión con la base de datos y vuelve a intentar.
        </p>
        <Button onClick={reset}>Reintentar</Button>
      </div>
    </main>
  );
}
