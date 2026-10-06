CREATE TABLE "applicants" (
	"id" text PRIMARY KEY,
	"job_post_id" text NOT NULL,
	"full_name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text DEFAULT '' NOT NULL,
	"current_location" text DEFAULT '' NOT NULL,
	"portfolio_url" text DEFAULT '' NOT NULL,
	"recent_project_urls" text DEFAULT '' NOT NULL,
	"linkedin_url" text DEFAULT '' NOT NULL,
	"github_url" text DEFAULT '' NOT NULL,
	"work_authorized" boolean DEFAULT true NOT NULL,
	"needs_sponsorship" boolean DEFAULT false NOT NULL,
	"note_to_founder" text DEFAULT '' NOT NULL,
	"resume_file_name" text DEFAULT '' NOT NULL,
	"created_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "companies" (
	"id" text PRIMARY KEY,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"domain" text NOT NULL,
	"logo_url" text,
	"created_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "job_posts" (
	"id" text PRIMARY KEY,
	"company_id" text NOT NULL,
	"company_name" text NOT NULL,
	"company_slug" text NOT NULL,
	"company_domain" text NOT NULL,
	"job_title" text NOT NULL,
	"description_markdown" text NOT NULL,
	"estimated_salary" text DEFAULT '' NOT NULL,
	"employment_type" text NOT NULL,
	"work_mode" text NOT NULL,
	"location" text NOT NULL,
	"years_of_experience" text,
	"created_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE INDEX "applicants_job_post_id_idx" ON "applicants" ("job_post_id");--> statement-breakpoint
CREATE INDEX "companies_slug_idx" ON "companies" ("slug");--> statement-breakpoint
CREATE INDEX "job_posts_company_id_idx" ON "job_posts" ("company_id");--> statement-breakpoint
ALTER TABLE "applicants" ADD CONSTRAINT "applicants_job_post_id_job_posts_id_fkey" FOREIGN KEY ("job_post_id") REFERENCES "job_posts"("id");--> statement-breakpoint
ALTER TABLE "job_posts" ADD CONSTRAINT "job_posts_company_id_companies_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id");