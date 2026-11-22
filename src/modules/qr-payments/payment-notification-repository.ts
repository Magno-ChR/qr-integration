import { count, desc } from "drizzle-orm";

import { getDb } from "@/shared/db/client";
import {
  paymentNotifications,
  type PaymentNotificationRecord,
} from "@/shared/db/schema";

import type { PaymentNotificationInput } from "./payment-notification";

const listLimit = 200;

export async function savePaymentNotification(
  input: PaymentNotificationInput,
  payload: Record<string, unknown>,
) {
  await getDb().insert(paymentNotifications).values({
    qrId: input.qrId,
    transactionId: input.transactionId,
    payDate: input.payDate,
    payHour: input.payHour ?? null,
    originAccount: input.originAccount ?? null,
    originBank: input.originBank ?? null,
    amount: input.amount ?? null,
    payload: JSON.stringify(payload),
  });
}

export async function listPaymentNotifications(): Promise<{
  rows: PaymentNotificationRecord[];
  total: number;
}> {
  const database = getDb();
  const [rows, totals] = await Promise.all([
    database
      .select()
      .from(paymentNotifications)
      .orderBy(desc(paymentNotifications.receivedAt))
      .limit(listLimit),
    database.select({ value: count() }).from(paymentNotifications),
  ]);

  return {
    rows,
    total: Number(totals[0]?.value ?? 0),
  };
}
