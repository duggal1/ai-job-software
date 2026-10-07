import { NextResponse } from "next/server";
import { getLatestJobs } from "@/lib/actions/get-latest-jobs";
import { getFilteredJobs } from "@/lib/actions/get-filtered-jobs";

export const dynamic = "force-dynamic";

/**
 * JSON feed for TanStack Query `queryFn`s.
 * - `/api/jobs?limit=20` → latest, newest first (for `/`)
 * - `/api/jobs?q=&country=&experience=&skill=` → filtered (for `/jobs`)
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? "";
  const country = searchParams.get("country") ?? "";
  const experience = searchParams.get("experience") ?? "";
  const skill = searchParams.get("skill") ?? "";
  const limitRaw = searchParams.get("limit");

  const hasFilter = q !== "" || country !== "" || experience !== "" || skill !== "";

  const jobs = hasFilter
    ? await getFilteredJobs({ q, country, experience, skill })
    : await getLatestJobs();

  const limit = limitRaw ? Number.parseInt(limitRaw, 10) : undefined;
  const sliced =
    Number.isFinite(limit) && (limit as number) > 0
      ? jobs.slice(0, limit as number)
      : jobs;

  return NextResponse.json(sliced, {
    headers: { "Cache-Control": "no-store" },
  });
}
