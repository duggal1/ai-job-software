import { headers } from "next/headers";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { getApplicant } from "@/lib/actions/get-applicant";
import { timeAgo } from "@/lib/time-ago";
import { ResumeViewer } from "@/components/resume-viewer";

function normalizeUrl(url: string): string {
  return url.startsWith("http") ? url : `https://${url}`;
}

export default async function ApplicantPage({
  params,
}: {
  params: Promise<{ nameSlug: string; applicantId: string }>;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/sign-in");

  const { applicantId } = await params;
  const data = await getApplicant(applicantId);
  if (!data || data.companyId !== session.user.id) notFound();

  const { applicant, jobTitle, companyName } = data;

  return (
    <main className="mx-auto w-full max-w-xl px-6 py-16">
      <Link href="/company/applicants" aria-label="All applicants" className="inline-flex cursor-pointer items-center gap-2 text-[13px] text-stone-500 underline-offset-4 hover:text-stone-800 hover:underline hover:decoration-dotted">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M15 6C15 6 9.00001 10.4189 9 12C8.99999 13.5812 15 18 15 18" />
        </svg>
        All applicants
      </Link>

      <div className="mt-8">
        <h1 className="text-2xl font-normal tracking-tight text-stone-900">{applicant.fullName}</h1>
        <p className="mt-1 text-[14px] text-stone-500">
          Applied for {jobTitle} at {companyName} · {timeAgo(applicant.createdAt)}
        </p>
      </div>

      <dl className="mt-10 flex flex-col gap-3 text-[14px]">
        <div className="flex justify-between gap-6">
          <dt className="text-stone-400">Email</dt>
          <dd className="text-stone-800">{applicant.email}</dd>
        </div>
        {applicant.phone && (
          <div className="flex justify-between gap-6">
            <dt className="text-stone-400">Phone</dt>
            <dd className="text-stone-800">{applicant.phone}</dd>
          </div>
        )}
        <div className="flex justify-between gap-6">
          <dt className="text-stone-400">Location</dt>
          <dd className="text-stone-800">{applicant.currentLocation || "—"}</dd>
        </div>
        <div className="flex justify-between gap-6">
          <dt className="text-stone-400">Authorized to work</dt>
          <dd className="text-stone-800">{applicant.workAuthorized ? "Yes" : "No"}</dd>
        </div>
        <div className="flex justify-between gap-6">
          <dt className="text-stone-400">Needs sponsorship</dt>
          <dd className="text-stone-800">{applicant.needsSponsorship ? "Yes" : "No"}</dd>
        </div>
        {applicant.resumeFileName && (
          <div className="flex justify-between gap-6">
            <dt className="text-stone-400">Resume</dt>
            <dd className="text-stone-800">{applicant.resumeFileName}</dd>
          </div>
        )}
      </dl>

      {applicant.portfolioUrl && (
        <p className="mt-6 text-[13px] text-stone-500">
          Portfolio:{" "}
          <a href={normalizeUrl(applicant.portfolioUrl)} target="_blank" rel="noreferrer" className="text-stone-700 underline decoration-dotted underline-offset-2 hover:text-stone-900">
            {applicant.portfolioUrl}
          </a>
        </p>
      )}
      {applicant.recentProjectUrls && (
        <p className="mt-2 text-[13px] text-stone-500">
          Recent projects:{" "}
          <a href={normalizeUrl(applicant.recentProjectUrls.split(",")[0] ?? "")} target="_blank" rel="noreferrer" className="text-stone-700 underline decoration-dotted underline-offset-2 hover:text-stone-900">
            {applicant.recentProjectUrls}
          </a>
        </p>
      )}

      {applicant.noteToFounder && (
        <blockquote className="mt-8 rounded-lg bg-stone-50 px-4 py-3 text-[15px] leading-relaxed text-stone-600">
          “{applicant.noteToFounder}”
        </blockquote>
      )}

      {applicant.resumeUrl && (
        <section className="mt-10">
          <h2 className="mb-3 text-[15px] font-normal text-stone-900">Resume</h2>
          <ResumeViewer url={applicant.resumeUrl} />
        </section>
      )}

      <div className="mt-10 flex flex-wrap items-center gap-3">
        {applicant.linkedinUrl && (
          <a
            href={normalizeUrl(applicant.linkedinUrl)}
            target="_blank"
            rel="noreferrer"
            className="cursor-pointer rounded-lg bg-stone-900 px-6 py-1.5 text-[14px] font-normal text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.15),inset_0_-1px_0_rgba(0,0,0,0.12)] transition-all hover:bg-stone-950"
          >
            Message on LinkedIn
          </a>
        )}
        <a
          href={`mailto:${applicant.email}`}
          className="cursor-pointer rounded-lg border border-stone-200/70 px-6 py-1.5 text-[14px] font-normal text-stone-700 transition-all hover:bg-stone-100/70"
        >
          Email
        </a>
      </div>
    </main>
  );
}
