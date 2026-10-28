import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getApplicantsByCompany } from "@/lib/actions/get-applicants-by-company";
import { ApplicantsBoard } from "@/components/applicants-board";
import type { ApplicantListRow } from "@/lib/queries/applicants";

export const dynamic = "force-dynamic";

export default async function ApplicantsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/sign-in");

  const rows = await getApplicantsByCompany(session.user.id);
  const initialRows: ApplicantListRow[] = rows.map((row) => ({
    jobTitle: row.jobTitle,
    companySlug: row.companySlug,
    applicant: {
      ...row.applicant,
      createdAt: row.applicant.createdAt.getTime(),
      resumeUrl: row.applicant.resumeUrl ?? undefined,
    },
  }));

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-16">
      <ApplicantsBoard companyId={session.user.id} initialRows={initialRows} />
    </main>
  );
}
