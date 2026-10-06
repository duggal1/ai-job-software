import { getPreparedQueries } from "@/lib/db/queries";
import { memo } from "@/lib/db/memo";

export interface JobDetailData {
  post: {
    id: string;
    companyId: string;
    companyName: string;
    companySlug: string;
    companyDomain: string;
    jobTitle: string;
    descriptionMarkdown: string;
    estimatedSalary: string;
    employmentType: string;
    workMode: string;
    location: string;
    yearsOfExperience: string | null;
    category: string | null;
    skills: string;
    visaSponsorship: boolean;
    aiBudget: string;
    applyMode: string;
    applyUrl: string | null;
    createdAt: Date;
  } | null;
  company: {
    id: string;
    name: string;
    slug: string;
    logoUrl: string | null;
  } | null;
}

export async function getJobDetailData(postId: string): Promise<JobDetailData> {
  return memo(`job:${postId}`, 30000, async () => {
  const [result] = await getPreparedQueries().jobDetailByPostId.execute({ postId });
  const post = result?.post ?? null;

  if (!result || !post) {
    return { post: null, company: null };
  }

  return {
    post: {
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
      yearsOfExperience: post.yearsOfExperience,
      category: post.category,
      skills: post.skills,
      visaSponsorship: post.visaSponsorship,
      aiBudget: post.aiBudget,
      applyMode: post.applyMode,
      applyUrl: post.applyUrl,
      createdAt: post.createdAt,
    },
    company: result.company
      ? { id: result.company.id, name: result.company.name, slug: result.company.slug, logoUrl: result.company.logoUrl }
      : null,
  };
  });
}
