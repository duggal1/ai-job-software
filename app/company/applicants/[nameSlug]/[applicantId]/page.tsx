import { Suspense } from "react";
import { headers } from "next/headers";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { getApplicant } from "@/lib/actions/get-applicant";
import {
  ApplicantDetail,
  ApplicantDetailSkeleton,
} from "@/components/applicant-detail";

export default function ApplicantPage({
  params,
}: {
  params: Promise<{ nameSlug: string; applicantId: string }>;
}) {
  return (
    <main className="mx-auto w-full max-w-xl px-6 py-16">
      <Link href="/company/applicants" aria-label="All applicants" className="inline-flex cursor-pointer items-center gap-2 text-[13px] text-stone-500 underline-offset-4 hover:text-stone-800 hover:underline hover:decoration-dotted">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M15 6C15 6 9.00001 10.4189 9 12C8.99999 13.5812 15 18 15 18" />
        </svg>
        All applicants
      </Link>

      <Suspense fallback={<ApplicantDetailSkeleton />}>
        <ApplicantContent params={params} />
      </Suspense>
    </main>
  );
}

async function ApplicantContent({
  params,
}: {
  params: Promise<{ nameSlug: string; applicantId: string }>;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/sign-in");

  const { applicantId } = await params;
  const data = await getApplicant(applicantId);
  if (!data || data.companyId !== session.user.id) notFound();

  return (
    <ApplicantDetail
      applicantId={applicantId}
      initialData={{
        jobTitle: data.jobTitle,
        companyName: data.companyName,
        companyId: data.companyId,
        applicant: {
          ...data.applicant,
          createdAt: data.applicant.createdAt.getTime(),
          resumeUrl: data.applicant.resumeUrl ?? undefined,
        },
      }}
    />
  );
}
