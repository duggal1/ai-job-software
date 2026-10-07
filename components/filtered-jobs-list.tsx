"use client";

import { useFilteredJobs, type JobFilterParams } from "@/lib/queries/jobs";
import { JobCard, type JobCardData } from "@/components/job-card";
import { JobsListSkeleton } from "@/components/jobs-list-skeleton";

interface FilteredJobsListProps {
  filters: JobFilterParams;
  initialData: JobCardData[];
}

/**
 * `/jobs` list — query key includes every filter so each combination caches
 * independently and refetches the moment a filter changes.
 */
export function FilteredJobsList({ filters, initialData }: FilteredJobsListProps) {
  const { data: jobs, isPending, isFetching, isError, refetch } = useFilteredJobs(
    filters,
    initialData,
  );

  if (isPending) return <JobsListSkeleton count={6} />;

  if (isError) {
    return (
      <div className="mt-10 rounded-lg border border-stone-100 bg-stone-50 px-6 py-8 text-center">
        <p className="text-[13px] text-stone-500">Couldn&apos;t load jobs.</p>
        <button
          type="button"
          onClick={() => refetch()}
          className="mt-2 cursor-pointer text-[13px] text-stone-800 underline underline-offset-4"
        >
          Try again
        </button>
      </div>
    );
  }

  const list = jobs ?? [];

  return (
    <div className="mt-10 flex flex-col gap-3">
      <div
        aria-hidden
        className={`h-0.5 overflow-hidden rounded-full transition-opacity ${
          isFetching ? "opacity-100" : "opacity-0"
        }`}
      >
        <div className="h-full w-1/3 animate-pulse rounded-full bg-stone-300" />
      </div>
      {list.map((job) => (
        <JobCard key={job.id} job={job} />
      ))}
      {list.length === 0 && (
        <p className="py-12 text-center text-[13px] text-stone-400">
          No job posts match these filters.
        </p>
      )}
    </div>
  );
}
