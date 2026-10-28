import { Suspense } from "react";
import { TalentForm } from "@/components/talent-form";
import { getJobPost } from "@/lib/actions/get-job-post";
import { getCompany } from "@/lib/actions/get-company";

export default function TalentPage({
  params,
}: {
  params: Promise<{ id: string; slug: string; talentSlug: string }>;
}) {
  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <Suspense fallback={<ApplySkeleton />}>
        <ApplyContent params={params} />
      </Suspense>
    </div>
  );
}

async function ApplyContent({
  params,
}: {
  params: Promise<{ id: string; slug: string; talentSlug: string }>;
}) {
  const { id } = await params;
  // Fetch job + company on the server in parallel — no client waterfall.
  const jobPost = await getJobPost(id);
  const company = jobPost ? await getCompany(jobPost.companyId) : undefined;

  return <TalentForm jobPost={jobPost ?? null} companyLogoUrl={company?.logoUrl ?? null} />;
}

function ApplySkeleton() {
  return (
    <div className="mx-auto w-full max-w-xl animate-pulse" aria-hidden>
      <div className="h-6 w-24 rounded bg-stone-100" />
      <div className="mt-2 h-4 w-64 rounded bg-stone-100" />
      <div className="mt-8 h-24 rounded-lg bg-stone-100/80" />
      <div className="mt-8 flex flex-col gap-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-2">
            <div className="h-3.5 w-24 rounded bg-stone-100" />
            <div className="h-9 rounded-lg bg-stone-100/80" />
          </div>
        ))}
      </div>
    </div>
  );
}
