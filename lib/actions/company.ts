"use server";

import { headers } from "next/headers";
import { and, count, eq, inArray } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { getDb, getHttpDb } from "@/lib/db";
import { bust } from "@/lib/db/memo";
import { publishRealtime } from "@/lib/realtime/bus";
import { applicants, companies, jobPosts } from "@/lib/db/schema";
import { slugify } from "@/lib/slug";

export async function getMyCompany(session: NonNullable<
  Awaited<ReturnType<typeof auth.api.getSession>>
>) {
  const batchDb = getHttpDb();
  // One Neon HTTP batch = one transaction, one round trip.
  const [companyRows, countRows] = await batchDb.batch([
    batchDb
      .select()
      .from(companies)
      .where(eq(companies.id, session.user.id))
      .limit(1),
    batchDb
      .select({ value: count() })
      .from(jobPosts)
      .where(
        and(
          eq(jobPosts.companyId, session.user.id),
          eq(jobPosts.archived, false),
        ),
      ),
  ]);
  const company = companyRows[0];
  if (!company) return null;
  const countRow = countRows[0];
  return {
    id: company.id,
    slug: company.slug,
    name: company.name,
    domain: company.domain,
    logoUrl: company.logoUrl,
    employeeCount: company.employeeCount,
    industry: company.industry,
    talentNeeds: company.talentNeeds,
    onboardedAt: company.onboardedAt,
    createdAt: company.createdAt,
    openPosts: countRow?.value ?? 0,
  };
}

export async function updateCompany({
  name,
  domain,
  logoUrl,
  slug,
}: {
  name?: string;
  domain?: string;
  logoUrl?: string | null;
  slug?: string;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Unauthorized");
  const db = getDb();
  const patch: Partial<typeof companies.$inferInsert> = {};
  if (typeof name === "string" && name.trim()) patch.name = name.trim();
  if (typeof domain === "string") patch.domain = domain.trim();
  if (logoUrl !== undefined) patch.logoUrl = logoUrl;
  if (typeof slug === "string" && slug.trim()) {
    const next = slugify(slug);
    if (!next) throw new Error("Enter a valid slug");
    const [taken] = await db
      .select({ id: companies.id })
      .from(companies)
      .where(eq(companies.slug, next))
      .limit(1);
    if (taken && taken.id !== session.user.id) throw new Error("That URL is taken");
    patch.slug = next;
  }
  if (Object.keys(patch).length === 0) return;

  await db.transaction(async (tx) => {
    await tx.update(companies).set(patch).where(eq(companies.id, session.user.id));
    const postPatch: Partial<typeof jobPosts.$inferInsert> = {};
    if (patch.name) postPatch.companyName = patch.name;
    if (patch.domain) postPatch.companyDomain = patch.domain;
    if (patch.slug) postPatch.companySlug = patch.slug;
    if (Object.keys(postPatch).length > 0) {
      await tx.update(jobPosts).set(postPatch).where(eq(jobPosts.companyId, session.user.id));
    }
  });
  bust("latestJobs");
  bust("jobs:");
  bust("career:");
  bust("job:");
  publishRealtime({ type: "jobs" });
}

export async function createCompany({ name, domain }: { name: string; domain: string }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Unauthorized");
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Enter a company name");
  const db = getDb();
  const base = slugify(trimmed) || "company";
  let slug = base;
  for (let i = 1; ; i++) {
    const [taken] = await db
      .select({ id: companies.id })
      .from(companies)
      .where(eq(companies.slug, slug))
      .limit(1);
    if (!taken || taken.id === session.user.id) break;
    slug = `${base}-${i + 1}`;
  }
  await db
    .insert(companies)
    .values({
      id: session.user.id,
      slug,
      name: trimmed,
      domain: domain.trim(),
      logoUrl: null,
      createdAt: new Date(),
    })
    .onConflictDoNothing({ target: companies.id });
  bust("latestJobs");
  bust("jobs:");
  bust("career:");
  bust("job:");
  publishRealtime({ type: "jobs" });
  const [row] = await db
    .select()
    .from(companies)
    .where(eq(companies.id, session.user.id))
    .limit(1);
  if (!row) throw new Error("Could not create the company");
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    domain: row.domain,
    logoUrl: row.logoUrl,
    employeeCount: row.employeeCount,
    industry: row.industry,
    talentNeeds: row.talentNeeds,
    onboardedAt: row.onboardedAt,
    createdAt: row.createdAt,
    openPosts: 0,
  };
}

export async function deleteCompany() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Unauthorized");
  const db = getDb();
  const posts = await db
    .select({ id: jobPosts.id })
    .from(jobPosts)
    .where(eq(jobPosts.companyId, session.user.id));
  const postIds = posts.map((p) => p.id);
  await db.transaction(async (tx) => {
    if (postIds.length > 0) {
      await tx.delete(applicants).where(inArray(applicants.jobPostId, postIds));
      await tx.delete(jobPosts).where(inArray(jobPosts.id, postIds));
    }
    await tx.delete(companies).where(eq(companies.id, session.user.id));
  });
  bust("latestJobs");
  bust("jobs:");
  bust("career:");
  bust("job:");
  publishRealtime({ type: "jobs" });
}
