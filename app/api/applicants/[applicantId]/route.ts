import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getApplicant } from "@/lib/actions/get-applicant";

export const dynamic = "force-dynamic";

/** One applicant, scoped to the owning company. */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ applicantId: string }> },
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { applicantId } = await params;
  const data = await getApplicant(applicantId);
  if (!data || data.companyId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(data, { headers: { "Cache-Control": "no-store" } });
}
