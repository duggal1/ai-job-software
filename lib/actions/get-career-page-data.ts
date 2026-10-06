import { getPreparedQueries } from "@/lib/db/queries";
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
  return memo(`career:${postId}`, 30000, async () => {
  const queries = getPreparedQueries();
  const [post] = await queries.jobPostById.execute({ id: postId });

  if (!post) return null;

  const [companies, allPosts] = await Promise.all([
    queries.companyForCareerPage.execute({ companyId: post.companyId }),
    queries.jobPostsForCareerPage.execute({ companyId: post.companyId }),
  ]);

  return {
    post,
    company: companies[0] ?? null,
    allPosts,
  };
  });
}
