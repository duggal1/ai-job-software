import { getPreparedQueries } from "@/lib/db/queries";
import { memo } from "@/lib/db/memo";

export async function getLatestJobs() {
  return memo("latestJobs", 10000, async () => {
    const rows = await getPreparedQueries().latestJobs.execute();
    return rows.map((row) => ({
      ...row,
      descriptionMarkdown: row.descriptionMarkdown.slice(0, 400),
    }));
  });
}
