CREATE TABLE "payment_notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"qr_id" text NOT NULL,
	"transaction_id" text NOT NULL,
	"pay_date" text NOT NULL,
	"pay_hour" text NOT NULL,
	"origin_account" text NOT NULL,
	"origin_bank" text NOT NULL,
	"amount" text NOT NULL,
	"payload" jsonb NOT NULL,
	"received_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "payment_notifications_received_at_idx" ON "payment_notifications" USING btree ("received_at");--> statement-breakpoint
CREATE INDEX "payment_notifications_transaction_id_idx" ON "payment_notifications" USING btree ("transaction_id");