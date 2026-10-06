import { getFilteredJobs } from "@/lib/actions/get-filtered-jobs";
import { JobCard } from "@/components/job-card";
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

  const jobs = await getFilteredJobs({ q, country, experience, skill });

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-16">
      <h1 className="text-2xl font-normal tracking-tight text-stone-900">Every single job post</h1>
      <p className="mt-1 text-[14px] text-stone-500">
        {jobs.length} role{jobs.length === 1 ? "" : "s"}, newest first.
      </p>

      <JobFilters q={q} country={country} experience={experience} skill={skill} />

      <div className="mt-10 flex flex-col gap-3">
        {jobs.map((job) => (
          <JobCard key={job.id} job={job} />
        ))}
        {jobs.length === 0 && (
          <p className="py-12 text-center text-[13px] text-stone-400">No job posts match these filters.</p>
        )}
      </div>
    </main>
  );
}
