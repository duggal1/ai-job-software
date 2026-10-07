"use client";

import { queryOptions, useQuery } from "@tanstack/react-query";
import type { JobCardData } from "@/components/job-card";

export const jobsKeys = {
  all: ["jobs"] as const,
  latest: () => [...jobsKeys.all, "latest"] as const,
  filtered: (filters: JobFilterParams) =>
    [...jobsKeys.all, "filtered", filters] as const,
};

export interface JobFilterParams {
  q?: string;
  country?: string;
  experience?: string;
  skill?: string;
}

type RawJobRow = Omit<JobCardData, "createdAt"> & {
  createdAt: string | Date;
};

function normalizeJobs(rows: RawJobRow[]): JobCardData[] {
  return rows
    .map((row) => ({
      ...row,
      createdAt:
        row.createdAt instanceof Date ? row.createdAt : new Date(row.createdAt),
    }))
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { credentials: "same-origin" });
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return (await res.json()) as T;
}

/** Latest jobs for `/` — newest first, fresh every 10s. */
export function latestJobsOptions(initialData?: JobCardData[]) {
  return queryOptions({
    queryKey: jobsKeys.latest(),
    queryFn: async (): Promise<JobCardData[]> => {
      const rows = await fetchJson<RawJobRow[]>("/api/jobs?limit=20");
      return normalizeJobs(rows);
    },
    staleTime: 10 * 1000,
    gcTime: 5 * 60 * 1000,
    // Always revalidate on mount: even if a CDN or prerender serves stale
    // HTML, the feed corrects itself the instant the page loads.
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    ...(initialData ? { initialData } : {}),
  });
}

/** Filtered jobs for `/jobs` — key includes every variable the fn depends on. */
export function filteredJobsOptions(
  filters: JobFilterParams,
  initialData?: JobCardData[],
) {
  const params = new URLSearchParams();
  if (filters.q) params.set("q", filters.q);
  if (filters.country) params.set("country", filters.country);
  if (filters.experience) params.set("experience", filters.experience);
  if (filters.skill) params.set("skill", filters.skill);
  const qs = params.size ? `?${params}` : "";

  return queryOptions({
    queryKey: jobsKeys.filtered(filters),
    queryFn: async (): Promise<JobCardData[]> => {
      const rows = await fetchJson<RawJobRow[]>(`/api/jobs${qs}`);
      return normalizeJobs(rows);
    },
    staleTime: 10 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    ...(initialData ? { initialData } : {}),
  });
}

export function useLatestJobs(initialData?: JobCardData[]) {
  return useQuery(latestJobsOptions(initialData));
}

export function useFilteredJobs(
  filters: JobFilterParams,
  initialData?: JobCardData[],
) {
  return useQuery(filteredJobsOptions(filters, initialData));
}
