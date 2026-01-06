ALTER TABLE "teams" ADD COLUMN "mercadopago_customer_id" text;--> statement-breakpoint
ALTER TABLE "teams" ADD COLUMN "mercadopago_subscription_id" text;--> statement-breakpoint
ALTER TABLE "teams" ADD COLUMN "mercadopago_preapproval_plan_id" text;--> statement-breakpoint
ALTER TABLE "teams" ADD CONSTRAINT "teams_mercadopago_customer_id_unique" UNIQUE("mercadopago_customer_id");--> statement-breakpoint
ALTER TABLE "teams" ADD CONSTRAINT "teams_mercadopago_subscription_id_unique" UNIQUE("mercadopago_subscription_id");