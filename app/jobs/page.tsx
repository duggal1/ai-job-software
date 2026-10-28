import { Suspense } from "react";
import { getFilteredJobs, type JobFilters } from "@/lib/actions/get-filtered-jobs";
import { FilteredJobsList } from "@/components/filtered-jobs-list";
import { JobFilters as JobFiltersBar } from "@/components/job-filters";
import { JobsListSkeleton } from "@/components/jobs-list-skeleton";

export const metadata = { title: "All jobs" };

type RawSearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

export default async function JobsPage({
  searchParams,
}: {
  searchParams: RawSearchParams;
}) {
  // Only `searchParams` is awaited in the shell — no DB call blocks the paint.
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q : "";
  const country = typeof params.country === "string" ? params.country : "";
  const experience = typeof params.experience === "string" ? params.experience : "";
  const skill = typeof params.skill === "string" ? params.skill : "";
  const filters = { q, country, experience, skill };

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-16">
      <h1 className="text-2xl font-normal tracking-tight text-stone-900">Every single job post</h1>
      <p className="mt-1 text-[14px] text-stone-500">
        Newest first — updates the moment a job is posted.
      </p>

      <JobFiltersBar q={q} country={country} experience={experience} skill={skill} />

      <Suspense
        key={`${q}|${country}|${experience}|${skill}`}
        fallback={<div className="mt-10"><JobsListSkeleton count={6} /></div>}
      >
        <FilteredJobsFeed filters={filters} />
      </Suspense>
    </main>
  );
}

async function FilteredJobsFeed({ filters }: { filters: JobFilters }) {
  const initialJobs = await getFilteredJobs(filters);
  return <FilteredJobsList filters={filters} initialData={initialJobs} />;
}
