ALTER TABLE "invitations" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "team_members" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "teams" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "invitations" CASCADE;--> statement-breakpoint
DROP TABLE "team_members" CASCADE;--> statement-breakpoint
DROP TABLE "teams" CASCADE;--> statement-breakpoint
ALTER TABLE "activity_logs" DROP CONSTRAINT "activity_logs_team_id_teams_id_fk";
--> statement-breakpoint
ALTER TABLE "activity_logs" ALTER COLUMN "user_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'aluno';--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "stripe_customer_id" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "stripe_subscription_id" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "stripe_product_id" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "mercadopago_customer_id" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "mercadopago_subscription_id" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "mercadopago_preapproval_plan_id" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "plan_name" varchar(50);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "subscription_status" varchar(20);--> statement-breakpoint
ALTER TABLE "activity_logs" DROP COLUMN "team_id";--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_stripe_customer_id_unique" UNIQUE("stripe_customer_id");--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_stripe_subscription_id_unique" UNIQUE("stripe_subscription_id");--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_mercadopago_customer_id_unique" UNIQUE("mercadopago_customer_id");--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_mercadopago_subscription_id_unique" UNIQUE("mercadopago_subscription_id");