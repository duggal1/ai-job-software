"use server";

import { getDb } from "@/lib/db";
import { bust } from "@/lib/db/memo";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { companies, jobPosts } from "@/lib/db/schema";
import type { Company, JobPost } from "@/lib/types";

export async function saveJob({ company, jobPost }: { company: Company; jobPost: JobPost }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Unauthorized");

  const db = getDb();
  const [existing] = await db.select({ id: companies.id }).from(companies).where(eq(companies.slug, company.slug)).limit(1);
  const companyId = existing?.id ?? session.user.id;
  const jobPostId = jobPost.id;
  jobPost = { ...jobPost, companyId };

  await db.transaction(async (tx) => {
    await tx.insert(companies).values({
      id: companyId,
      slug: company.slug,
      name: company.name,
      domain: company.domain,
      logoUrl: company.logoUrl ?? null,
      createdAt: new Date(company.createdAt),
    }).onConflictDoNothing({ target: companies.id });
    await tx.insert(jobPosts).values({
      id: jobPostId,
      companyId: jobPost.companyId,
      companyName: jobPost.companyName,
      companySlug: jobPost.companySlug,
      companyDomain: jobPost.companyDomain,
      jobTitle: jobPost.jobTitle,
      descriptionMarkdown: jobPost.descriptionMarkdown,
      estimatedSalary: jobPost.estimatedSalary,
      employmentType: jobPost.employmentType,
      workMode: jobPost.workMode,
      location: jobPost.location,
      yearsOfExperience: jobPost.yearsOfExperience ?? null,
      category: jobPost.category ?? null,
      skills: jobPost.skills.join(","),
      visaSponsorship: jobPost.visaSponsorship,
      aiBudget: jobPost.aiBudget,
      applyMode: jobPost.applyMode,
      applyUrl: jobPost.applyUrl ?? null,
      createdAt: new Date(jobPost.createdAt),
    });
  });
  bust("latestJobs");
  bust("jobs:");
  bust("career:");
  bust("job:");
  // Push the fresh row to every RSC payload NOW — without this, `/` keeps
  // serving the stale prerender until the 30s memo TTL lapses (the exact
  // "only shows after visiting /jobs" bug).
  revalidatePath("/", "page");
  revalidatePath("/jobs", "page");
  return { id: jobPostId, slug: jobPost.companySlug };
}
