CREATE INDEX "applicants_created_at_idx" ON "applicants" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "applicants_job_post_created_idx" ON "applicants" USING btree ("job_post_id","created_at");--> statement-breakpoint
CREATE INDEX "job_posts_company_created_idx" ON "job_posts" USING btree ("company_id","created_at");