import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { PayloadDialog } from "@/components/payments/payload-dialog";
import { RefreshButton } from "@/components/payments/refresh-button";
import type { DashboardRole } from "@/modules/dashboard/roles";
import type { PaymentNotificationRecord } from "@/shared/db/schema";

const receivedAtFormatter = new Intl.DateTimeFormat("es-BO", {
  dateStyle: "short",
  timeStyle: "medium",
  timeZone: "America/La_Paz",
});

const amountFormatter = new Intl.NumberFormat("es-BO", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function NotificationsView({
  rows,
  total,
  username,
  role,
}: {
  rows: PaymentNotificationRecord[];
  total: number;
  username: string;
  role: DashboardRole;
}) {
  const shownAmount = rows.reduce(
    (sum, row) => sum + Number(row.amount ?? 0),
    0,
  );

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6">
      <DashboardHeader
        title="Notificaciones de pago"
        description="Cada aviso aceptado en POST /api/qr/payments queda guardado con el JSON original."
        username={username}
        role={role}
      />
      <div className="flex justify-end">
        <RefreshButton />
      </div>

      <section className="grid gap-3 sm:grid-cols-3">
        <Card size="sm">
          <CardHeader>
            <CardDescription>Recibidas</CardDescription>
            <CardTitle className="text-2xl">{total}</CardTitle>
          </CardHeader>
        </Card>
        <Card size="sm">
          <CardHeader>
            <CardDescription>En esta vista</CardDescription>
            <CardTitle className="text-2xl">{rows.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card size="sm">
          <CardHeader>
            <CardDescription>Monto de la vista</CardDescription>
            <CardTitle className="text-2xl">
              {amountFormatter.format(shownAmount)}
            </CardTitle>
          </CardHeader>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Historial</CardTitle>
          <CardDescription>
            {total > rows.length
              ? `Mostrando las ${rows.length} más recientes de ${total}.`
              : "Ordenadas de la más reciente a la más antigua."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {rows.length === 0 ? (
            <div className="rounded-lg border border-dashed px-4 py-10 text-center text-sm text-muted-foreground">
              Todavía no hay notificaciones. Cuando el banco llame a{" "}
              <span className="font-mono">/api/qr/payments</span> con un token
              de <span className="font-mono">/api/qr/login</span>, aparecerán
              aquí.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Recibida</TableHead>
                  <TableHead>QR</TableHead>
                  <TableHead>Transacción</TableHead>
                  <TableHead>Pago</TableHead>
                  <TableHead>Cuenta origen</TableHead>
                  <TableHead>Banco</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                  <TableHead>JSON</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>
                      {receivedAtFormatter.format(row.receivedAt)}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {row.qrId}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {row.transactionId}
                    </TableCell>
                    <TableCell>
                      {formatPayDate(row.payDate)}
                      {row.payHour ? ` ${row.payHour}` : ""}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {row.originAccount ?? "—"}
                    </TableCell>
                    <TableCell>
                      {row.originBank ? (
                        <Badge variant="secondary">{row.originBank}</Badge>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {row.amount ?? "—"}
                    </TableCell>
                    <TableCell>
                      <PayloadDialog
                        title={`Transacción ${row.transactionId}`}
                        payload={parsePayload(row.payload)}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function formatPayDate(value: string) {
  if (!/^\d{8}$/.test(value)) {
    return value;
  }

  return `${value.slice(0, 2)}/${value.slice(2, 4)}/${value.slice(4)}`;
}

function parsePayload(value: string): Record<string, unknown> {
  try {
    const parsed: unknown = JSON.parse(value);

    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
  } catch {
    return { raw: value };
  }

  return { raw: value };
}
