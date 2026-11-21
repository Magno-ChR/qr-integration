CREATE TABLE "generated_qr_codes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"qr_id" text NOT NULL,
	"amount" text NOT NULL,
	"currency" text NOT NULL,
	"gloss" text NOT NULL,
	"reference" text NOT NULL,
	"expiration_date" text NOT NULL,
	"single_use" text NOT NULL,
	"qr_image" text NOT NULL,
	"order_state" integer,
	"status_message" text,
	"pay_date" text,
	"pay_hour" text,
	"transaction_number" text,
	"created_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"status_checked_at" timestamp with time zone
);
--> statement-breakpoint
CREATE UNIQUE INDEX "generated_qr_codes_qr_id_idx" ON "generated_qr_codes" USING btree ("qr_id");--> statement-breakpoint
CREATE INDEX "generated_qr_codes_created_at_idx" ON "generated_qr_codes" USING btree ("created_at");