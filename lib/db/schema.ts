import { pgTable, text, boolean, timestamp, index, uniqueIndex } from "drizzle-orm/pg-core";
import type { ApplyMode, EmploymentType, JobCategory, WorkMode } from "@/lib/types";

export const companies = pgTable(
  "companies",
  {
    id: text("id").primaryKey(),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    domain: text("domain").notNull(),
    logoUrl: text("logo_url"),
    createdAt: timestamp("created_at").notNull(),
  },
  (t) => [uniqueIndex("companies_slug_unique").on(t.slug)],
);

export const jobPosts = pgTable(
  "job_posts",
  {
    id: text("id").primaryKey(),
    companyId: text("company_id")
      .notNull()
      .references(() => companies.id),
    companyName: text("company_name").notNull(),
    companySlug: text("company_slug").notNull(),
    companyDomain: text("company_domain").notNull(),
    jobTitle: text("job_title").notNull(),
    descriptionMarkdown: text("description_markdown").notNull(),
    estimatedSalary: text("estimated_salary").notNull().default(""),
    employmentType: text("employment_type").$type<EmploymentType>().notNull(),
    workMode: text("work_mode").$type<WorkMode>().notNull(),
    location: text("location").notNull(),
    yearsOfExperience: text("years_of_experience"),
    category: text("category").$type<JobCategory>(),
    skills: text("skills").notNull().default(""),
    visaSponsorship: boolean("visa_sponsorship").notNull().default(false),
    aiBudget: text("ai_budget").notNull().default(""),
    applyMode: text("apply_mode").$type<ApplyMode>().notNull().default("platform"),
    applyUrl: text("apply_url"),
    createdAt: timestamp("created_at").notNull(),
  },
  (t) => [
    index("job_posts_company_id_idx").on(t.companyId),
    index("job_posts_created_at_idx").on(t.createdAt),
  ],
);

export const applicants = pgTable(
  "applicants",
  {
    id: text("id").primaryKey(),
    jobPostId: text("job_post_id")
      .notNull()
      .references(() => jobPosts.id),
    fullName: text("full_name").notNull(),
    email: text("email").notNull(),
    phone: text("phone").notNull().default(""),
    currentLocation: text("current_location").notNull().default(""),
    portfolioUrl: text("portfolio_url").notNull().default(""),
    recentProjectUrls: text("recent_project_urls").notNull().default(""),
    linkedinUrl: text("linkedin_url").notNull().default(""),
    githubUrl: text("github_url").notNull().default(""),
    workAuthorized: boolean("work_authorized").notNull().default(true),
    needsSponsorship: boolean("needs_sponsorship").notNull().default(false),
    noteToFounder: text("note_to_founder").notNull().default(""),
    resumeFileName: text("resume_file_name").notNull().default(""),
    resumeUrl: text("resume_url"),
    createdAt: timestamp("created_at").notNull(),
  },
  (t) => [index("applicants_job_post_id_idx").on(t.jobPostId)],
);
