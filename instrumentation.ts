export async function register() {
  if (process.env.NEXT_RUNTIME === "edge") return;
  try {
      const [{ getDb }, { sql }, { getLatestJobs }, { getFilteredJobs }] = await Promise.all([
        import("@/lib/db"),
        import("drizzle-orm"),
        import("@/lib/actions/get-latest-jobs"),
        import("@/lib/actions/get-filtered-jobs"),
      ]);
      await getDb().execute(sql`select 1`);
      await Promise.all([
        getLatestJobs().catch(() => undefined),
        getFilteredJobs({}).catch(() => undefined),
      ]);
    } catch (e) {
      console.warn("[instrumentation] warm-up failed:", e);
    }
}
