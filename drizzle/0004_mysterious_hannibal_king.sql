DROP INDEX "companies_slug_idx";--> statement-breakpoint
ALTER TABLE "applicants" ADD COLUMN "resume_url" text;--> statement-breakpoint
CREATE UNIQUE INDEX "companies_slug_unique" ON "companies" USING btree ("slug");