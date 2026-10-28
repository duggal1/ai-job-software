ALTER TABLE "companies" ADD COLUMN "employee_count" text;--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN "industry" text;--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN "talent_needs" text;--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN "onboarded_at" timestamp;--> statement-breakpoint
ALTER TABLE "job_posts" ADD COLUMN "archived" boolean DEFAULT false NOT NULL;--> statement-breakpoint
CREATE INDEX "job_posts_archived_created_idx" ON "job_posts" USING btree ("archived","created_at");