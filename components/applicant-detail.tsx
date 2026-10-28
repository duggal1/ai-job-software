"use client";

import { timeAgo } from "@/lib/time-ago";
import { ResumeViewer } from "@/components/resume-viewer";
import { ContactApplicantDialog } from "@/components/contact-applicant-dialog";
import {
  useApplicant,
  type ApplicantDetailData,
} from "@/lib/queries/applicants";

function normalizeUrl(url: string): string {
  return url.startsWith("http") ? url : `https://${url}`;
}

export function ApplicantDetail({
  applicantId,
  initialData,
}: {
  applicantId: string;
  initialData: ApplicantDetailData;
}) {
  const { data, isFetching } = useApplicant(applicantId, initialData);
  const { applicant, jobTitle, companyName } = data;

  return (
    <>
      <div className="mt-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-normal tracking-tight text-stone-900">
            {applicant.fullName}
            {isFetching && (
              <span aria-hidden className="size-1.5 animate-pulse rounded-full bg-emerald-500" />
            )}
          </h1>
          <p className="mt-1 text-[14px] text-stone-500">
            Applied for {jobTitle} at {companyName} · {timeAgo(applicant.createdAt)}
          </p>
          {applicant.resumeFileName && (
            <p className="mt-2 inline-flex items-center gap-1.5 rounded-[3px] bg-stone-100 px-2 py-0.5 text-[11px] text-stone-500">
              <span className="size-1 rounded-full bg-orange-500" />
              AI-parsed from {applicant.resumeFileName}
            </p>
          )}
        </div>
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
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-[15px] font-normal text-stone-900">Resume</h2>
            <a
              href={applicant.resumeUrl}
              target="_blank"
              rel="noreferrer"
              className="cursor-pointer text-[12px] text-stone-500 underline decoration-dotted underline-offset-2 hover:text-stone-800"
            >
              Open PDF
            </a>
          </div>
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
        <ContactApplicantDialog
          applicantId={applicant.id}
          applicantName={applicant.fullName}
          applicantEmail={applicant.email}
          jobTitle={jobTitle}
          variant="full"
          label="Contact this user"
        />
      </div>
    </>
  );
}

/** Shared by the route's Suspense fallback. */
export function ApplicantDetailSkeleton() {
  return (
    <div className="mt-8 animate-pulse" aria-hidden>
      <div className="h-7 w-52 rounded bg-stone-100" />
      <div className="mt-2 h-4 w-72 rounded bg-stone-100" />
      <div className="mt-10 flex flex-col gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-4 w-full rounded bg-stone-100/80" />
        ))}
      </div>
    </div>
  );
}
