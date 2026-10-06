import { sql, eq, desc } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { applicants, companies, jobPosts } from "@/lib/db/schema";

function createPreparedQueries() {
  const db = getDb();

  return {
    companies: db.select().from(companies).orderBy(companies.createdAt).prepare("companies_list"),
    companyById: db.select().from(companies)
      .where(eq(companies.id, sql.placeholder("id")))
      .limit(1)
      .prepare("company_by_id"),
    jobPosts: db.select().from(jobPosts).orderBy(jobPosts.createdAt).prepare("job_posts_list"),
    jobPostById: db.select().from(jobPosts)
      .where(eq(jobPosts.id, sql.placeholder("id")))
      .limit(1)
      .prepare("job_post_by_id"),
    jobPostsByCompany: db.select().from(jobPosts)
      .where(eq(jobPosts.companyId, sql.placeholder("companyId")))
      .orderBy(jobPosts.createdAt)
      .prepare("job_posts_by_company"),
    jobPostsForCareerPage: db.select({
      id: jobPosts.id,
      companyId: jobPosts.companyId,
      companyName: jobPosts.companyName,
      companySlug: jobPosts.companySlug,
      jobTitle: jobPosts.jobTitle,
      estimatedSalary: jobPosts.estimatedSalary,
      workMode: jobPosts.workMode,
      location: jobPosts.location,
      category: jobPosts.category,
      createdAt: jobPosts.createdAt,
    }).from(jobPosts)
      .where(eq(jobPosts.companyId, sql.placeholder("companyId")))
      .orderBy(desc(jobPosts.createdAt))
      .prepare("job_posts_for_career_page"),
    companyForCareerPage: db.select({
      id: companies.id,
      name: companies.name,
      slug: companies.slug,
      logoUrl: companies.logoUrl,
    }).from(companies)
      .where(eq(companies.id, sql.placeholder("companyId")))
      .limit(1)
      .prepare("company_for_career_page"),
    jobDetailByPostId: db.select({
      post: {
        id: jobPosts.id,
        companyId: jobPosts.companyId,
        companyName: jobPosts.companyName,
        companySlug: jobPosts.companySlug,
        companyDomain: jobPosts.companyDomain,
        jobTitle: jobPosts.jobTitle,
        descriptionMarkdown: jobPosts.descriptionMarkdown,
        estimatedSalary: jobPosts.estimatedSalary,
        employmentType: jobPosts.employmentType,
        workMode: jobPosts.workMode,
        location: jobPosts.location,
        yearsOfExperience: jobPosts.yearsOfExperience,
        category: jobPosts.category,
        skills: jobPosts.skills,
        visaSponsorship: jobPosts.visaSponsorship,
        aiBudget: jobPosts.aiBudget,
        applyMode: jobPosts.applyMode,
        applyUrl: jobPosts.applyUrl,
        createdAt: jobPosts.createdAt,
      },
      company: {
        id: companies.id,
        name: companies.name,
        slug: companies.slug,
        logoUrl: companies.logoUrl,
      },
    }).from(jobPosts)
      .leftJoin(companies, eq(jobPosts.companyId, companies.id))
      .where(eq(jobPosts.id, sql.placeholder("postId")))
      .limit(1)
      .prepare("job_detail_by_post_id"),
    applicantsByJob: db.select().from(applicants)
      .where(eq(applicants.jobPostId, sql.placeholder("jobPostId")))
      .orderBy(applicants.createdAt)
      .prepare("applicants_by_job"),
    anyJob: db.select({ id: jobPosts.id, companySlug: jobPosts.companySlug })
      .from(jobPosts)
      .orderBy(desc(jobPosts.createdAt))
      .limit(1)
      .prepare("any_job"),
    latestJobs: db.select({
      id: jobPosts.id,
      companyId: jobPosts.companyId,
      companyName: jobPosts.companyName,
      companySlug: jobPosts.companySlug,
      jobTitle: jobPosts.jobTitle,
      descriptionMarkdown: jobPosts.descriptionMarkdown,
      estimatedSalary: jobPosts.estimatedSalary,
      workMode: jobPosts.workMode,
      employmentType: jobPosts.employmentType,
      location: jobPosts.location,
      yearsOfExperience: jobPosts.yearsOfExperience,
      category: jobPosts.category,
      skills: jobPosts.skills,
      createdAt: jobPosts.createdAt,
      logoUrl: companies.logoUrl,
    }).from(jobPosts)
      .leftJoin(companies, eq(jobPosts.companyId, companies.id))
      .orderBy(desc(jobPosts.createdAt))
      .limit(20)
      .prepare("latest_jobs"),
    filteredJobs: db.select({
      id: jobPosts.id,
      companyId: jobPosts.companyId,
      companyName: jobPosts.companyName,
      companySlug: jobPosts.companySlug,
      jobTitle: jobPosts.jobTitle,
      descriptionMarkdown: jobPosts.descriptionMarkdown,
      estimatedSalary: jobPosts.estimatedSalary,
      workMode: jobPosts.workMode,
      employmentType: jobPosts.employmentType,
      location: jobPosts.location,
      yearsOfExperience: jobPosts.yearsOfExperience,
      category: jobPosts.category,
      skills: jobPosts.skills,
      visaSponsorship: jobPosts.visaSponsorship,
      aiBudget: jobPosts.aiBudget,
      applyMode: jobPosts.applyMode,
      createdAt: jobPosts.createdAt,
      logoUrl: companies.logoUrl,
    }).from(jobPosts)
      .leftJoin(companies, eq(jobPosts.companyId, companies.id))
      .where(sql`(${sql.placeholder("q")} = '' OR ${jobPosts.jobTitle} ILIKE '%' || ${sql.placeholder("q")} || '%' OR ${jobPosts.companyName} ILIKE '%' || ${sql.placeholder("q")} || '%')
        AND (${sql.placeholder("country")} = '' OR ${jobPosts.location} ILIKE '%, ' || ${sql.placeholder("country")})
        AND (${sql.placeholder("experience")} = '' OR ${jobPosts.yearsOfExperience} = ${sql.placeholder("experience")})
        AND (${sql.placeholder("skill")} = '' OR ${jobPosts.skills} ILIKE '%' || ${sql.placeholder("skill")} || '%')`)
      .orderBy(desc(jobPosts.createdAt))
      .limit(100)
      .prepare("filtered_jobs"),
    applicantDetail: db.select({
      applicant: applicants,
      jobTitle: jobPosts.jobTitle,
      companyName: jobPosts.companyName,
      companyId: jobPosts.companyId,
    }).from(applicants)
      .innerJoin(jobPosts, eq(applicants.jobPostId, jobPosts.id))
      .where(eq(applicants.id, sql.placeholder("applicantId")))
      .limit(1)
      .prepare("applicant_detail"),
    applicantsByCompany: db.select({
      applicant: applicants,
      jobTitle: jobPosts.jobTitle,
      companySlug: jobPosts.companySlug,
    }).from(applicants)
      .innerJoin(jobPosts, eq(applicants.jobPostId, jobPosts.id))
      .where(eq(jobPosts.companyId, sql.placeholder("companyId")))
      .orderBy(desc(applicants.createdAt))
      .prepare("applicants_by_company"),
  };
}

type PreparedQueries = ReturnType<typeof createPreparedQueries>;

const globalRef = globalThis as unknown as { __prepared?: PreparedQueries };

export function getPreparedQueries(): PreparedQueries {
  globalRef.__prepared ??= createPreparedQueries();
  return globalRef.__prepared;
}
