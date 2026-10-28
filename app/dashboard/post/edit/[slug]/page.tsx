import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { getMyCompany } from "@/lib/actions/company";
import { getJobPostsByCompany } from "@/lib/actions/get-company-job-posts";
import { PostEditor } from "@/components/post-editor";
import { slugify } from "@/lib/slug";

export const dynamic = "force-dynamic";

/**
 * `/dashboard/post/edit/[slug]` — the slug is derived from the job title, so
 * the URL stays human-readable. If two posts share a title, the newest one
 * wins (it is the one shown first in the CRM).
 */
export default async function EditPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/sign-in");

  const company = await getMyCompany(session);
  if (!company?.onboardedAt) redirect("/onboarding");

  const { slug } = await params;
  const rows = await getJobPostsByCompany(session.user.id);
  const post = rows.find((row) => slugify(row.jobTitle) === slug);
  if (!post) notFound();

  return (
    <main className="mx-auto w-full max-w-xl px-6 py-16">
      <Link
        href="/dashboard?tab=posts"
        className="mb-8 inline-flex cursor-pointer items-center gap-2 text-[13px] text-stone-500 underline-offset-4 hover:text-stone-800 hover:underline hover:decoration-dotted"
      >
        <svg
          aria-hidden
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          width="16"
          height="16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M15 6C15 6 9.00001 10.4189 9 12C8.99999 13.5812 15 18 15 18" />
        </svg>
        All posts
      </Link>

      <PostEditor
        post={{
          id: post.id,
          jobTitle: post.jobTitle,
          descriptionMarkdown: post.descriptionMarkdown,
          estimatedSalary: post.estimatedSalary,
          skills: post.skills,
          aiBudget: post.aiBudget,
          employmentType: post.employmentType,
          workMode: post.workMode,
          location: post.location,
          yearsOfExperience: post.yearsOfExperience ?? "",
          category: post.category ?? "",
          visaSponsorship: post.visaSponsorship,
          applyMode: post.applyMode,
          applyUrl: post.applyUrl ?? "",
          archived: post.archived,
        }}
      />
    </main>
  );
}
