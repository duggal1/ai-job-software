"use server";

import { getDb, getHttpDb } from "@/lib/db";
import { bust } from "@/lib/db/memo";
import { publishRealtime } from "@/lib/realtime/bus";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { companies, jobPosts } from "@/lib/db/schema";
import type { Company, JobPost } from "@/lib/types";
import { embedText } from "@/lib/embeddings";
import { upsertJobVector, buildJobText } from "@/lib/pinecone";

export async function saveJob({ company, jobPost }: { company: Company; jobPost: JobPost }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Unauthorized");

  const db = getDb();
  const [existing] = await db.select({ id: companies.id }).from(companies).where(eq(companies.slug, company.slug)).limit(1);
  const companyId = existing?.id ?? session.user.id;
  const jobPostId = jobPost.id;
  jobPost = { ...jobPost, companyId };

  // Neon's HTTP `batch` runs every statement in one transaction on one round
  // trip — the company row and its first job post commit together.
  const batchDb = getHttpDb();
  await batchDb.batch([
    batchDb.insert(companies).values({
      id: companyId,
      slug: company.slug,
      name: company.name,
      domain: company.domain,
      logoUrl: company.logoUrl ?? null,
      createdAt: new Date(company.createdAt),
    }).onConflictDoNothing({ target: companies.id }),
    batchDb.insert(jobPosts).values({
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
    }),
  ]);
  bust("latestJobs");
  bust("jobs:");
  bust("career:");
  bust("job:");
  // Push the fresh row to every RSC payload NOW — without this, `/` keeps
  // serving the stale prerender until the 30s memo TTL lapses (the exact
  // "only shows after visiting /jobs" bug).
  revalidatePath("/", "page");
  revalidatePath("/jobs", "page");
  // Wake every open tab: TanStack Query refetches the feeds instantly.
  publishRealtime({ type: "jobs", jobPostId });

  // Index the new job post in Pinecone for semantic search. Runs after the
  // response is sent so saving stays fast; failures are logged, not thrown.
  after(async () => {
    try {
      const vector = await embedText(buildJobText(jobPost));
      await upsertJobVector(jobPostId, vector, {
        jobTitle: jobPost.jobTitle,
        companyName: jobPost.companyName,
        companySlug: jobPost.companySlug,
        location: jobPost.location,
      });
    } catch (error) {
      console.error("[pinecone] failed to index job", jobPostId, error);
    }
  });

  return { id: jobPostId, slug: jobPost.companySlug };
}
