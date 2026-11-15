import {
  boolean,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const paymentNotifications = pgTable(
  "payment_notifications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    qrId: text("qr_id").notNull(),
    transactionId: text("transaction_id").notNull(),
    payDate: text("pay_date").notNull(),
    payHour: text("pay_hour").notNull(),
    originAccount: text("origin_account").notNull(),
    originBank: text("origin_bank").notNull(),
    amount: text("amount").notNull(),
    payload: text("payload").notNull(),
    receivedAt: timestamp("received_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("payment_notifications_received_at_idx").on(table.receivedAt),
    index("payment_notifications_transaction_id_idx").on(table.transactionId),
  ],
);

export type PaymentNotificationRecord =
  typeof paymentNotifications.$inferSelect;

export const dashboardUsers = pgTable(
  "dashboard_users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    username: text("username").notNull(),
    passwordHash: text("password_hash").notNull(),
    passwordSalt: text("password_salt").notNull(),
    role: text("role").notNull(),
    mustChangePassword: boolean("must_change_password").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [uniqueIndex("dashboard_users_username_idx").on(table.username)],
);

export type DashboardUserRecord = typeof dashboardUsers.$inferSelect;

export const rateLimitBuckets = pgTable(
  "rate_limit_buckets",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    scope: text("scope").notNull(),
    clientKey: text("client_key").notNull(),
    windowStart: timestamp("window_start", { withTimezone: true }).notNull(),
    requestCount: integer("request_count").notNull().default(1),
  },
  (table) => [
    uniqueIndex("rate_limit_buckets_scope_client_window_idx").on(
      table.scope,
      table.clientKey,
      table.windowStart,
    ),
  ],
);
