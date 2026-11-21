"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  generateQrCharge,
  refreshQrChargeStatus,
  type QrActionState,
} from "@/modules/bg-qr/actions";
import type { QrChargeView } from "@/modules/bg-qr/present-qr";

const initialState: QrActionState = { error: null, success: null, nonce: 0 };

export function QrChargesPanel({
  rows,
  accountReference,
  configError,
  defaultExpiration,
  defaultAmount,
  defaultReference,
  defaultGloss,
}: {
  rows: QrChargeView[];
  accountReference: string | null;
  configError: string | null;
  defaultExpiration: string;
  defaultAmount: string;
  defaultReference: string;
  defaultGloss: string;
}) {
  const router = useRouter();
  const [state, action, pending] = useActionState(generateQrCharge, initialState);
  const [preview, setPreview] = useState<QrChargeView | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const openedFor = useRef(0);

  useEffect(() => {
    if (state.success) {
      router.refresh();
    }
  }, [state.nonce, state.success, router]);

  useEffect(() => {
    if (!state.success || openedFor.current === state.nonce) {
      return;
    }

    const created = rows.find(
      (row) => state.success?.includes(row.qrId) && row.imageSrc,
    );

    if (!created) {
      return;
    }

    openedFor.current = state.nonce;
    setPreview(created);
    setPreviewOpen(true);
  }, [rows, state.nonce, state.success]);

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Nuevo cobro</CardTitle>
          <CardDescription>
            {accountReference
              ? `El abono entra a la cuenta ${accountReference}. Moneda BOB.`
              : "Configura las credenciales del banco para habilitar la generación."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {configError ? (
            <p className="mb-4 text-sm text-destructive" role="alert">
              {configError}
            </p>
          ) : null}
          <form
            key={state.success ?? "new-charge"}
            action={action}
            className="grid gap-4 sm:grid-cols-2"
          >
            <div className="flex flex-col gap-2">
              <Label htmlFor="amount">Monto</Label>
              <Input
                id="amount"
                name="amount"
                type="number"
                inputMode="decimal"
                min="0.10"
                step="0.01"
                defaultValue={defaultAmount}
                placeholder="0.10"
                disabled={Boolean(configError)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="reference">Referencia</Label>
              <Input
                id="reference"
                name="reference"
                defaultValue={defaultReference}
                placeholder={defaultReference}
                maxLength={60}
                disabled={Boolean(configError)}
              />
            </div>
            <div className="flex flex-col gap-2 sm:col-span-2">
              <Label htmlFor="gloss">Glosa</Label>
              <Input
                id="gloss"
                name="gloss"
                defaultValue={defaultGloss}
                placeholder={defaultGloss}
                maxLength={80}
                disabled={Boolean(configError)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="expirationDate">Vencimiento</Label>
              <Input
                id="expirationDate"
                name="expirationDate"
                type="date"
                defaultValue={defaultExpiration}
                required
                disabled={Boolean(configError)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="singleUse">Uso</Label>
              <select
                id="singleUse"
                name="singleUse"
                defaultValue="1"
                disabled={Boolean(configError)}
                className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30"
              >
                <option value="1">Uso único</option>
                <option value="0">Varios usos</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <Button type="submit" disabled={pending || Boolean(configError)}>
                {pending ? "Generando..." : "Generar QR"}
              </Button>
            </div>
            {state.error ? (
              <p className="text-sm text-destructive sm:col-span-2" role="alert">
                {state.error}
              </p>
            ) : null}
            {state.success ? (
              <p
                className="text-sm text-muted-foreground sm:col-span-2"
                role="status"
              >
                {state.success}
              </p>
            ) : null}
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Cobros generados</CardTitle>
          <CardDescription>
            {rows.length === 0
              ? "Todavía no hay cobros QR."
              : "Los más recientes primero. Consultar estado pregunta al banco si la orden ya fue pagada."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {rows.length === 0 ? null : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>QR</TableHead>
                  <TableHead>Cobro</TableHead>
                  <TableHead>Monto</TableHead>
                  <TableHead>Vence</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Creado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>
                      {row.imageSrc ? (
                        <button
                          type="button"
                          className="cursor-pointer rounded-md"
                          onClick={() => {
                            setPreview(row);
                            setPreviewOpen(true);
                          }}
                        >
                          {/* The bank returns the QR as a base64 image, not a remote URL. */}
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={row.imageSrc}
                            alt={`QR ${row.reference}`}
                            width={96}
                            height={96}
                            className="size-24 rounded-md bg-white object-contain"
                          />
                        </button>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          Sin imagen
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{row.reference}</div>
                      <div className="text-muted-foreground">{row.gloss}</div>
                      <div className="font-mono text-xs">{row.qrId}</div>
                      <div className="text-xs text-muted-foreground">
                        {row.singleUseLabel}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono">{row.amountLabel}</TableCell>
                    <TableCell>{row.expirationLabel}</TableCell>
                    <TableCell>
                      <div className="flex flex-col items-start gap-2">
                        <Badge variant={row.statusVariant}>{row.statusLabel}</Badge>
                        {row.payDetail ? (
                          <span className="text-xs text-muted-foreground">
                            {row.payDetail}
                          </span>
                        ) : null}
                        <StatusButton qrId={row.qrId} />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>{row.createdAtLabel}</div>
                      <div className="text-xs text-muted-foreground">
                        {row.createdBy}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      <QrPreview
        charge={preview}
        open={previewOpen}
        onOpenChange={setPreviewOpen}
      />
    </div>
  );
}

function QrPreview({
  charge,
  open,
  onOpenChange,
}: {
  charge: QrChargeView | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{charge?.reference ?? "Código QR"}</DialogTitle>
          <DialogDescription className="font-mono">
            {charge?.qrId}
          </DialogDescription>
        </DialogHeader>
        {charge?.imageSrc ? (
          <div className="flex justify-center rounded-lg bg-white p-6">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={charge.imageSrc}
              alt={`QR ${charge.reference}`}
              width={420}
              height={420}
              className="size-[min(78vw,420px)] object-contain"
            />
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function StatusButton({ qrId }: { qrId: string }) {
  const router = useRouter();
  const [state, action, pending] = useActionState(
    refreshQrChargeStatus,
    initialState,
  );

  useEffect(() => {
    if (state.success) {
      router.refresh();
    }
  }, [state.nonce, state.success, router]);

  return (
    <form action={action} className="flex flex-col items-start gap-1">
      <input type="hidden" name="qrId" value={qrId} />
      <Button type="submit" size="sm" variant="outline" disabled={pending}>
        {pending ? "Consultando..." : "Consultar estado"}
      </Button>
      {state.error ? (
        <span className="text-xs text-destructive" role="alert">
          {state.error}
        </span>
      ) : null}
      {state.success ? (
        <span className="text-xs text-muted-foreground" role="status">
          {state.success}
        </span>
      ) : null}
    </form>
  );
}
