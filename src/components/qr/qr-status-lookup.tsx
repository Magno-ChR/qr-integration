"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
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
  lookupQrStatus,
  type QrLookupState,
} from "@/modules/bg-qr/actions";

const initialState: QrLookupState = {
  error: null,
  nonce: 0,
  qrId: null,
  message: null,
  orderState: null,
  payDate: null,
  payHour: null,
  transactionNumber: null,
};

export function QrStatusLookup() {
  const [state, action, pending] = useActionState(lookupQrStatus, initialState);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Consulta por identificador</CardTitle>
        <CardDescription>
          Escribe el qrId y el banco responde si la orden sigue pendiente o ya fue pagada.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={action} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="qrId">Identificador QR</Label>
            <Input
              id="qrId"
              name="qrId"
              inputMode="numeric"
              autoComplete="off"
              placeholder="26112101018000036360"
              maxLength={32}
              required
            />
          </div>
          <div>
            <Button type="submit" disabled={pending}>
              {pending ? "Consultando..." : "Consultar estado"}
            </Button>
          </div>
          {state.error ? (
            <p className="text-sm text-destructive" role="alert">
              {state.error}
            </p>
          ) : null}
          {state.qrId ? (
            <div className="grid gap-2 rounded-lg border p-4 text-sm" role="status">
              <p className="font-mono">{state.qrId}</p>
              <p>{state.message || "Sin mensaje del banco."}</p>
              <p className="text-muted-foreground">
                Estado {state.orderState ?? "sin valor"}
                {state.payDate ? ` · ${formatBankDate(state.payDate)}` : ""}
                {state.payHour ? ` ${state.payHour}` : ""}
                {state.transactionNumber
                  ? ` · Transacción ${state.transactionNumber}`
                  : ""}
              </p>
            </div>
          ) : null}
        </form>
      </CardContent>
    </Card>
  );
}

function formatBankDate(value: string) {
  if (!/^\d{8}$/.test(value)) {
    return value;
  }

  return `${value.slice(0, 2)}/${value.slice(2, 4)}/${value.slice(4)}`;
}
