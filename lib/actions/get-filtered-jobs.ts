import { getPreparedQueries } from "@/lib/db/queries";
import { memo } from "@/lib/db/memo";

export interface JobFilters {
  q?: string;
  country?: string;
  experience?: string;
  skill?: string;
}

export async function getFilteredJobs(filters: JobFilters) {
  const key = `jobs:${filters.q ?? ""}|${filters.country ?? ""}|${filters.experience ?? ""}|${filters.skill ?? ""}`;
  return memo(key, 30000, async () => {
    const rows = await getPreparedQueries().filteredJobs.execute({
      q: filters.q ?? "",
      country: filters.country ?? "",
      experience: filters.experience ?? "",
      skill: filters.skill ?? "",
    });
    return rows.map((row) => ({
      ...row,
      descriptionMarkdown: row.descriptionMarkdown.slice(0, 400),
    }));
  });
}
