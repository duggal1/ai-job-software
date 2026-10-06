import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getApplicantsByCompany } from "@/lib/actions/get-applicants-by-company";
import { timeAgo } from "@/lib/time-ago";
import { ApplicantsChart } from "@/components/applicants-chart";
import { buildApplicantDays } from "@/lib/applicants-stats";
import { slugify } from "@/lib/slug";
import Link from "next/link";

export default async function ApplicantsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/sign-in");

  const rows = await getApplicantsByCompany(session.user.id);

  const days = buildApplicantDays(rows.map((r) => r.applicant));
  const total = rows.length;
  const last7 = days.slice(-7).reduce((s, d) => s + d.count, 0);
  const peak = Math.max(0, ...days.map((d) => d.count));
  const sponsorship = rows.filter((r) => r.applicant.needsSponsorship).length;
  const workAuthorized = rows.filter((r) => r.applicant.workAuthorized).length;
  const byJob = new Map<string, number>();
  for (const r of rows) byJob.set(r.jobTitle, (byJob.get(r.jobTitle) ?? 0) + 1);
  const topJobs = [...byJob.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3);

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-16">
      <h1 className="text-2xl font-normal tracking-tight text-stone-900">Applicants</h1>
      <p className="mt-1 text-[14px] text-stone-500">
        Everyone who applied through Fly AI, newest first. Reach out directly — email or LinkedIn.
      </p>

      <section className="mt-10 rounded-lg border border-stone-100 bg-stone-50 px-6 py-5">
        <div className="flex flex-wrap gap-x-12 gap-y-4">
          <div>
            <p className="text-[12px] text-stone-400">Total</p>
            <p className="text-[22px] tabular-nums tracking-tight text-stone-900">{total}</p>
          </div>
          <div>
            <p className="text-[12px] text-stone-400">Last 7 days</p>
            <p className="text-[22px] tabular-nums tracking-tight text-stone-900">{last7}</p>
          </div>
          <div>
            <p className="text-[12px] text-stone-400">Peak day</p>
            <p className="text-[22px] tabular-nums tracking-tight text-stone-900">{peak}</p>
          </div>
          <div>
            <p className="text-[12px] text-stone-400">Visa sponsorship</p>
            <p className="text-[22px] tabular-nums tracking-tight text-stone-900">{sponsorship}</p>
          </div>
          <div>
            <p className="text-[12px] text-stone-400">Work authorized</p>
            <p className="text-[22px] tabular-nums tracking-tight text-stone-900">{workAuthorized}</p>
          </div>
        </div>
      </section>

      <section className="mt-3 rounded-lg border border-stone-100 bg-stone-50 px-6 py-5">
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="text-[15px] font-normal text-stone-900">Applications</h2>
          <p className="text-[12px] text-stone-400">Daily · last 14 days</p>
        </div>
        {topJobs.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {topJobs.map(([title, count]) => (
              <span key={title} className="rounded-sm bg-stone-100/70 px-2 py-0.5 text-[12px] text-stone-600">
                {title} · {count}
              </span>
            ))}
          </div>
        )}
        <div className="mt-4">
          <ApplicantsChart days={days} />
        </div>
      </section>

      <div className="mt-10 flex flex-col gap-3">
        {rows.map(({ applicant, jobTitle }) => (
          <div
            key={applicant.id}
            className="flex flex-col gap-1.5 rounded-lg border border-stone-100 bg-stone-50 px-6 py-5 transition-all hover:border-stone-200"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-[15px] font-normal text-stone-900">{applicant.fullName}</h3>
              <span className="text-[12px] text-stone-400" suppressHydrationWarning>{timeAgo(applicant.createdAt)}</span>
            </div>
            <Link
              href={`/company/applicants/${slugify(applicant.fullName)}/${applicant.id}`}
              className="w-fit cursor-pointer text-[12px] text-stone-500 underline-offset-4 hover:text-stone-800 hover:underline hover:decoration-dotted"
            >
              Read all
            </Link>
            <p className="text-[13px] text-stone-500">
              {jobTitle} · {applicant.currentLocation || "Location unknown"}
            </p>
            <div className="mt-1 flex flex-wrap gap-4 text-[13px]">
              <a href={`mailto:${applicant.email}`} className="cursor-pointer text-stone-700 underline decoration-dotted underline-offset-2 hover:text-stone-900">
                {applicant.email}
              </a>
              {applicant.linkedinUrl && (
                <a href={applicant.linkedinUrl.startsWith("http") ? applicant.linkedinUrl : `https://${applicant.linkedinUrl}`} target="_blank" rel="noreferrer" className="cursor-pointer text-stone-700 underline decoration-dotted underline-offset-2 hover:text-stone-900">
                  LinkedIn
                </a>
              )}
              {applicant.githubUrl && (
                <a href={applicant.githubUrl.startsWith("http") ? applicant.githubUrl : `https://${applicant.githubUrl}`} target="_blank" rel="noreferrer" className="cursor-pointer text-stone-700 underline decoration-dotted underline-offset-2 hover:text-stone-900">
                  GitHub
                </a>
              )}
              {applicant.portfolioUrl && (
                <a href={applicant.portfolioUrl.startsWith("http") ? applicant.portfolioUrl : `https://${applicant.portfolioUrl}`} target="_blank" rel="noreferrer" className="cursor-pointer text-stone-700 underline decoration-dotted underline-offset-2 hover:text-stone-900">
                  Portfolio
                </a>
              )}
            </div>
            {applicant.noteToFounder && (
              <p className="mt-1 text-[13px] leading-relaxed text-stone-500">“{applicant.noteToFounder}”</p>
            )}
          </div>
        ))}
        {rows.length === 0 && (
          <p className="py-12 text-center text-[13px] text-stone-400">No applicants yet.</p>
        )}
      </div>
    </main>
  );
}
