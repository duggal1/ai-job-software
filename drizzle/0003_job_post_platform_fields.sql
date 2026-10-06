ALTER TABLE "job_posts" ADD COLUMN IF NOT EXISTS "skills" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "job_posts" ADD COLUMN IF NOT EXISTS "visa_sponsorship" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "job_posts" ADD COLUMN IF NOT EXISTS "ai_budget" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "job_posts" ADD COLUMN IF NOT EXISTS "apply_mode" text DEFAULT 'platform' NOT NULL;--> statement-breakpoint
ALTER TABLE "job_posts" ADD COLUMN IF NOT EXISTS "apply_url" text;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "job_posts_created_at_idx" ON "job_posts" USING btree ("created_at");
