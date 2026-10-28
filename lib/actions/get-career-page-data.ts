import { desc, eq } from "drizzle-orm";
import { getHttpDb } from "@/lib/db";
import { getPreparedQueries } from "@/lib/db/queries";
import { companies, jobPosts } from "@/lib/db/schema";
import { memo } from "@/lib/db/memo";

export interface CareerPageData {
  post: {
    id: string;
    companyId: string;
    companyName: string;
    companySlug: string;
    jobTitle: string;
    estimatedSalary: string;
    workMode: string;
    location: string;
    category: string | null;
    createdAt: Date;
  };
  company: {
    id: string;
    name: string;
    slug: string;
    logoUrl: string | null;
  } | null;
  allPosts: Array<{
    id: string;
    companyId: string;
    companyName: string;
    companySlug: string;
    jobTitle: string;
    estimatedSalary: string;
    workMode: string;
    location: string;
    category: string | null;
    createdAt: Date;
  }>;
}

export async function getCareerPageData(postId: string): Promise<CareerPageData | null> {
  return memo(`career:${postId}`, 5000, async () => {
    const [post] = await getPreparedQueries().jobPostById.execute({ id: postId });

    if (!post) return null;

    // Company + sibling roles in ONE Neon batch (one round trip).
    const db = getHttpDb();
    const [companyRows, allPosts] = await db.batch([
      db
        .select({
          id: companies.id,
          name: companies.name,
          slug: companies.slug,
          logoUrl: companies.logoUrl,
        })
        .from(companies)
        .where(eq(companies.id, post.companyId))
        .limit(1),
      db
        .select({
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
        })
        .from(jobPosts)
        .where(eq(jobPosts.companyId, post.companyId))
        .orderBy(desc(jobPosts.createdAt)),
    ]);

    return {
      post,
      company: companyRows[0] ?? null,
      allPosts,
    };
  });
}
