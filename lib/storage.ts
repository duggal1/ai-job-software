import { getDb } from "@/lib/db";
import { getPreparedQueries } from "@/lib/db/queries";
import { companies, jobPosts, applicants } from "@/lib/db/schema";
import { z } from "zod";
import { APPLY_MODES, EMPLOYMENT_TYPES, JOB_CATEGORIES, WORK_MODES, type Applicant, type Company, type JobPost } from "@/lib/types";

export async function getCompanies(): Promise<Company[]> {
  const rows = await getPreparedQueries().companies.execute();
  return rows.map(mapCompany);
}

export async function getCompany(id: string): Promise<Company | undefined> {
  const rows = await getPreparedQueries().companyById.execute({ id });
  const row = rows[0];
  return row ? mapCompany(row) : undefined;
}

export async function saveCompany(company: Company) {
  await getDb().insert(companies).values({
    id: company.id,
    slug: company.slug,
    name: company.name,
    domain: company.domain,
    logoUrl: company.logoUrl ?? null,
    createdAt: new Date(company.createdAt),
  });
}

export async function getJobPosts(): Promise<JobPost[]> {
  const rows = await getPreparedQueries().jobPosts.execute();
  return rows.map(mapJobPost);
}

export async function getJobPost(id: string): Promise<JobPost | undefined> {
  const rows = await getPreparedQueries().jobPostById.execute({ id });
  const row = rows[0];
  return row ? mapJobPost(row) : undefined;
}

export async function saveJobPost(post: JobPost) {
  await getDb().insert(jobPosts).values({
    id: post.id,
    companyId: post.companyId,
    companyName: post.companyName,
    companySlug: post.companySlug,
    companyDomain: post.companyDomain,
    jobTitle: post.jobTitle,
    descriptionMarkdown: post.descriptionMarkdown,
    estimatedSalary: post.estimatedSalary,
    employmentType: post.employmentType,
    workMode: post.workMode,
    location: post.location,
    yearsOfExperience: post.yearsOfExperience ?? null,
    category: post.category ?? null,
    skills: post.skills.join(","),
    visaSponsorship: post.visaSponsorship,
    aiBudget: post.aiBudget,
    applyMode: post.applyMode,
    applyUrl: post.applyUrl ?? null,
    createdAt: new Date(post.createdAt),
  });
}

export async function getApplicants(jobPostId: string): Promise<Applicant[]> {
  const rows = await getPreparedQueries().applicantsByJob.execute({ jobPostId });
  return rows.map(mapApplicant);
}

export async function saveApplicant(applicant: Applicant) {
  await getDb().insert(applicants).values({
    id: applicant.id,
    jobPostId: applicant.jobPostId,
    fullName: applicant.fullName,
    email: applicant.email,
    phone: applicant.phone,
    currentLocation: applicant.currentLocation,
    portfolioUrl: applicant.portfolioUrl,
    recentProjectUrls: applicant.recentProjectUrls,
    linkedinUrl: applicant.linkedinUrl,
    githubUrl: applicant.githubUrl,
    workAuthorized: applicant.workAuthorized,
    needsSponsorship: applicant.needsSponsorship,
    noteToFounder: applicant.noteToFounder,
    resumeFileName: applicant.resumeFileName,
    resumeUrl: applicant.resumeUrl ?? null,
    createdAt: new Date(applicant.createdAt),
  });
}

type CompanyRow = typeof companies.$inferSelect;
type JobPostRow = typeof jobPosts.$inferSelect;
type ApplicantRow = typeof applicants.$inferSelect;

function mapCompany(row: CompanyRow): Company {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    domain: row.domain,
    ...(row.logoUrl ? { logoUrl: row.logoUrl } : {}),
    createdAt: row.createdAt.getTime(),
  };
}

function mapJobPost(row: JobPostRow): JobPost {
  return {
    id: row.id,
    companyId: row.companyId,
    companyName: row.companyName,
    companySlug: row.companySlug,
    companyDomain: row.companyDomain,
    jobTitle: row.jobTitle,
    descriptionMarkdown: row.descriptionMarkdown,
    estimatedSalary: row.estimatedSalary,
    employmentType: z.enum(EMPLOYMENT_TYPES).parse(row.employmentType),
    workMode: z.enum(WORK_MODES).parse(row.workMode),
    location: row.location,
    ...(row.yearsOfExperience ? { yearsOfExperience: row.yearsOfExperience } : {}),
    ...(row.category ? { category: z.enum(JOB_CATEGORIES).parse(row.category) } : {}),
    skills: row.skills ? row.skills.split(",").map((s) => s.trim()).filter(Boolean) : [],
    visaSponsorship: row.visaSponsorship,
    aiBudget: row.aiBudget,
    applyMode: z.enum(APPLY_MODES).parse(row.applyMode),
    ...(row.applyUrl ? { applyUrl: row.applyUrl } : {}),
    createdAt: row.createdAt.getTime(),
  };
}

function mapApplicant(row: ApplicantRow): Applicant {
  return {
    id: row.id,
    jobPostId: row.jobPostId,
    fullName: row.fullName,
    email: row.email,
    phone: row.phone,
    currentLocation: row.currentLocation,
    portfolioUrl: row.portfolioUrl,
    recentProjectUrls: row.recentProjectUrls,
    linkedinUrl: row.linkedinUrl,
    githubUrl: row.githubUrl,
    workAuthorized: row.workAuthorized,
    needsSponsorship: row.needsSponsorship,
    noteToFounder: row.noteToFounder,
    resumeFileName: row.resumeFileName,
    resumeUrl: row.resumeUrl ?? undefined,
    createdAt: row.createdAt.getTime(),
  };
}
