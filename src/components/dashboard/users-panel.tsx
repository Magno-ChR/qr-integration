"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";

import { Badge } from "@/components/ui/badge";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  createCollector,
  resetUserPassword,
  type FormState,
} from "@/modules/dashboard/actions";
import { roleLabels, type DashboardRole } from "@/modules/dashboard/roles";

const initialState: FormState = { error: null, success: null };

type DashboardUserRow = {
  id: string;
  username: string;
  role: DashboardRole;
  mustChangePassword: boolean;
  createdAtLabel: string;
};

export function UsersPanel({ users }: { users: DashboardUserRow[] }) {
  const router = useRouter();
  const [createState, createAction, createPending] = useActionState(
    createCollector,
    initialState,
  );

  useEffect(() => {
    if (createState.success) {
      router.refresh();
    }
  }, [createState.success, router]);

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Nuevo cobrador</CardTitle>
          <CardDescription>
            El cobrador consulta notificaciones y genera cobros QR. Al entrar
            por primera vez debe cambiar la contraseña.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            key={createState.success ?? "create"}
            action={createAction}
            className="grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
          >
            <div className="flex flex-col gap-2">
              <Label htmlFor="username">Usuario</Label>
              <Input id="username" name="username" autoComplete="off" required />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="password">Contraseña temporal</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                minLength={8}
                required
              />
            </div>
            <Button type="submit" disabled={createPending}>
              {createPending ? "Creando..." : "Crear"}
            </Button>
            {createState.error ? (
              <p className="text-sm text-destructive sm:col-span-3" role="alert">
                {createState.error}
              </p>
            ) : null}
            {createState.success ? (
              <p className="text-sm text-muted-foreground sm:col-span-3" role="status">
                {createState.success}
              </p>
            ) : null}
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Cuentas</CardTitle>
          <CardDescription>
            Restablecer asigna una contraseña temporal y obliga a cambiarla en
            el siguiente ingreso.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuario</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Creado</TableHead>
                <TableHead>Restablecer</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.username}</TableCell>
                  <TableCell>
                    <Badge variant={user.role === "admin" ? "default" : "secondary"}>
                      {roleLabels[user.role]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {user.mustChangePassword
                      ? "Debe cambiar contraseña"
                      : "Activa"}
                  </TableCell>
                  <TableCell>{user.createdAtLabel}</TableCell>
                  <TableCell>
                    <ResetPasswordForm userId={user.id} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function ResetPasswordForm({ userId }: { userId: string }) {
  const router = useRouter();
  const [state, action, pending] = useActionState(
    resetUserPassword,
    initialState,
  );

  useEffect(() => {
    if (state.success) {
      router.refresh();
    }
  }, [state.success, router]);

  return (
    <form action={action} className="flex min-w-56 flex-col gap-2">
      <input type="hidden" name="userId" value={userId} />
      <Input
        name="password"
        type="password"
        aria-label="Contraseña temporal"
        autoComplete="new-password"
        minLength={8}
        required
      />
      <Button type="submit" size="sm" variant="outline" disabled={pending}>
        {pending ? "Guardando..." : "Restablecer"}
      </Button>
      {state.error ? (
        <p className="text-xs text-destructive" role="alert">
          {state.error}
        </p>
      ) : null}
      {state.success ? (
        <p className="text-xs text-muted-foreground" role="status">
          {state.success}
        </p>
      ) : null}
    </form>
  );
}
