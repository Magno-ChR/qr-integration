import { desc, eq } from "drizzle-orm";

import { getDb } from "@/shared/db/client";
import { generatedQrCodes } from "@/shared/db/schema";

export async function listGeneratedQrCodes(limit = 50) {
  return getDb()
    .select()
    .from(generatedQrCodes)
    .orderBy(desc(generatedQrCodes.createdAt))
    .limit(limit);
}

export async function findGeneratedQr(qrId: string) {
  const [row] = await getDb()
    .select()
    .from(generatedQrCodes)
    .where(eq(generatedQrCodes.qrId, qrId))
    .limit(1);

  return row;
}

export async function insertGeneratedQr(values: {
  qrId: string;
  amount: string;
  currency: string;
  gloss: string;
  reference: string;
  expirationDate: string;
  singleUse: string;
  qrImage: string;
  createdBy: string;
}) {
  const [row] = await getDb()
    .insert(generatedQrCodes)
    .values(values)
    .returning({ id: generatedQrCodes.id });

  return row;
}

export async function saveQrStatus(
  qrId: string,
  status: {
    orderState: number | null;
    statusMessage: string;
    payDate: string | null;
    payHour: string | null;
    transactionNumber: string | null;
  },
) {
  await getDb()
    .update(generatedQrCodes)
    .set({
      orderState: status.orderState,
      statusMessage: status.statusMessage,
      payDate: status.payDate,
      payHour: status.payHour,
      transactionNumber: status.transactionNumber,
      statusCheckedAt: new Date(),
    })
    .where(eq(generatedQrCodes.qrId, qrId));
}
