import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getApplicantsByCompany } from "@/lib/actions/get-applicants-by-company";

export const dynamic = "force-dynamic";

/** Live applicant feed for the signed-in company (TanStack Query `queryFn`). */
export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = await getApplicantsByCompany(session.user.id);
  return NextResponse.json(rows, { headers: { "Cache-Control": "no-store" } });
}
