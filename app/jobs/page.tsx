import { getFilteredJobs } from "@/lib/actions/get-filtered-jobs";
import { FilteredJobsList } from "@/components/filtered-jobs-list";
import { JobFilters } from "@/components/job-filters";

export const metadata = { title: "All jobs" };

export default async function JobsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q : "";
  const country = typeof params.country === "string" ? params.country : "";
  const experience = typeof params.experience === "string" ? params.experience : "";
  const skill = typeof params.skill === "string" ? params.skill : "";
  const filters = { q, country, experience, skill };

  const initialJobs = await getFilteredJobs(filters);

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-16">
      <h1 className="text-2xl font-normal tracking-tight text-stone-900">Every single job post</h1>
      <p className="mt-1 text-[14px] text-stone-500">
        Newest first — updates the moment a job is posted.
      </p>

      <JobFilters q={q} country={country} experience={experience} skill={skill} />

      <FilteredJobsList filters={filters} initialData={initialJobs} />
    </main>
  );
}
