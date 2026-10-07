import Link from "next/link";
import Image from "next/image";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { parseLocation } from "@/lib/location";
import { timeAgo } from "@/lib/time-ago";
import { COUNTRIES } from "@/lib/location";

export interface JobCardData {
  id: string;
  companySlug: string;
  companyName: string;
  jobTitle: string;
  descriptionMarkdown: string;
  estimatedSalary: string;
  workMode: string;
  employmentType?: string;
  location: string;
  yearsOfExperience?: string | null;
  skills?: string;
  createdAt: Date | string;
  logoUrl?: string | null;
}

function excerpt(markdown: string, max = 140): string {
  const text = markdown
    .replace(/[#*`>\-\[\]()]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return text.length > max ? `${text.slice(0, max).trimEnd()}…` : text;
}

export function JobCard({ job }: { job: JobCardData }) {
  const parsed = parseLocation(job.location);
  const country = parsed ? COUNTRIES.find((c) => c.code === parsed.countryCode) : null;

  return (
    <Link
      href={`/company/${job.id}/${job.companySlug}`}
      className="group flex flex-col gap-2 rounded-lg border border-stone-100 bg-stone-50 px-6 py-4 transition-all hover:border-stone-200"
    >
      <div className="flex items-center gap-2.5">
        {job.logoUrl ? (
          <Image src={job.logoUrl} alt="" width={20} height={20} className="size-5 rounded-md object-cover" />
        ) : (
          <span className="flex size-5 items-center justify-center rounded-md bg-stone-200/70 text-[10px] text-stone-500">
            {job.companyName.charAt(0)}
          </span>
        )}
        <span className="text-[13px] text-stone-500">{job.companyName}</span>
        {country && <span className="text-[13px]">{country.flag}</span>}
        <span className="ml-auto text-[12px] text-stone-400" suppressHydrationWarning>{timeAgo(job.createdAt instanceof Date ? job.createdAt : new Date(job.createdAt))}</span>
      </div>
      <div className="flex items-center justify-between gap-4">
        <h3 className="text-[15px] font-normal text-stone-900">{job.jobTitle}</h3>
        <span className="flex items-center gap-1 text-[13px] text-stone-500 transition-all group-hover:text-stone-700">
          Preview
          <HugeiconsIcon icon={ArrowRight01Icon} className="size-3.5" />
        </span>
      </div>
      <p className="text-[13px] leading-relaxed text-stone-500">{excerpt(job.descriptionMarkdown)}</p>
      <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[12px] text-stone-500">
        {job.estimatedSalary && <span className="rounded-sm bg-stone-100/70 px-2 py-0.5">{job.estimatedSalary}</span>}
        {job.employmentType && (
          <span className="rounded-sm bg-orange-100/70 px-2 py-0.5 text-orange-700">
            {job.employmentType.replace("-", " ")}
          </span>
        )}
        <span
          className={`rounded-sm px-2 py-0.5 ${
            job.workMode === "remote" ? "bg-purple-100/70 text-purple-700" : "bg-stone-100/70 text-stone-600"
          }`}
        >
          {job.workMode}
        </span>
        {(job.skills ?? "")
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
          .slice(0, 4)
          .map((skill) => (
            <span key={skill} className="rounded-sm bg-stone-100/70 px-2 py-0.5 text-stone-600">
              {skill}
            </span>
          ))}
        {job.yearsOfExperience && (
          <span className="rounded-sm bg-violet-100/70 px-2 py-0.5 text-violet-700">{job.yearsOfExperience}</span>
        )}
      </div>
    </Link>
  );
}
