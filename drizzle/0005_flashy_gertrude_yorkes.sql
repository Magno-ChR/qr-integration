ALTER TABLE "payment_notifications" ALTER COLUMN "pay_hour" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "payment_notifications" ALTER COLUMN "origin_account" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "payment_notifications" ALTER COLUMN "origin_bank" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "payment_notifications" ALTER COLUMN "amount" DROP NOT NULL;