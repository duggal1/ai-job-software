"use client";

import { useState } from "react";
import Link from "next/link";
import { Link01Icon, Bookmark01Icon } from "hugeicons-react";
import { MarkdownRenderer } from "@/components/markdown-renderer";
import { parseLocation, COUNTRIES } from "@/lib/location";
import { EXPERIENCE_LEVELS } from "@/lib/experience";
import { timeAgo } from "@/lib/time-ago";
import type { JobDetailData } from "@/lib/actions/get-job-detail-data";

export function JobPostDetail({ data }: { data: JobDetailData }) {
  const { post, company } = data;
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);

  if (!post) {
    return <p className="py-24 text-center text-[13px] text-stone-400">Job post not found.</p>;
  }

  const locationParts = parseLocation(post.location);
  const country = locationParts
    ? COUNTRIES.find((c) => c.code === locationParts.countryCode)
    : null;
  const experienceLabel = post.yearsOfExperience
    ? EXPERIENCE_LEVELS.find((l) => l.value === post.yearsOfExperience)?.label
    : null;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const badgeClass = (type: "stone" | "orange" | "violet" | "green" | "blue") =>
    type === "orange"
      ? "rounded-sm bg-orange-100/70 px-2 py-0.5 text-orange-700"
      : type === "violet"
        ? "rounded-sm bg-violet-100/70 px-2 py-0.5 text-violet-700"
        : type === "green"
          ? "rounded-sm bg-green-100/70 px-2 py-0.5 text-green-700"
          : type === "blue"
            ? "rounded-sm bg-blue-100/70 px-2 py-0.5 text-blue-700"
            : "rounded-sm bg-stone-100/70 px-2 py-0.5 text-stone-500";

  return (
    <div className="flex flex-col gap-10">
      <div className="flex items-center gap-3">
        {company?.logoUrl && (
          <img
            src={company.logoUrl}
            alt={`${post.companyName} logo`}
            className="size-10 shrink-0 rounded-lg object-cover"
            width={40}
            height={40}
          />
        )}
        <span className="text-[22px] font-normal antialiased text-stone-900">{post.companyName}</span>
        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            aria-label="Copy job post link"
            onClick={handleCopyLink}
            className="flex cursor-pointer items-center gap-1 rounded-md px-2 py-1 text-[12px] text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-700"
          >
            <Link01Icon className="size-3.5" />
            {copied ? "Copied!" : "Copy link"}
          </button>
          <button
            type="button"
            aria-label="Save job post"
            onClick={handleSave}
            className={`flex cursor-pointer items-center gap-1 rounded-md px-2 py-1 text-[12px] transition-colors hover:bg-stone-100 ${
              saved ? "text-orange-600" : "text-stone-500 hover:text-stone-700"
            }`}
          >
            <Bookmark01Icon className="size-3.5" />
            {saved ? "Saved!" : "Save"}
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <h1 className="text-xl font-normal tracking-tight text-stone-900">
          {post.jobTitle}
        </h1>

        <p className="text-[13px] text-stone-500">
          {locationParts?.city ?? post.location}
          {country && <span>, {country.flag} {country.name}</span>}
        </p>

        <div className="flex flex-wrap items-center gap-2 text-[12px]">
          {post.estimatedSalary && (
            <span className={badgeClass("stone")}>{post.estimatedSalary}</span>
          )}
          <span className={badgeClass("orange")}>
            {post.employmentType.charAt(0).toUpperCase() + post.employmentType.slice(1)}
          </span>
          <span className={badgeClass("blue")}>
            {post.workMode.charAt(0).toUpperCase() + post.workMode.slice(1)}
          </span>
          {experienceLabel && (
            <span className={badgeClass("violet")}>{experienceLabel}</span>
          )}
          {post.visaSponsorship && (
            <span className={badgeClass("green")}>Visa sponsorship</span>
          )}
          {post.aiBudget && (
            <span className={badgeClass("stone")}>AI budget: {post.aiBudget}</span>
          )}
          <span className={badgeClass("stone")} suppressHydrationWarning>Posted {timeAgo(post.createdAt)}</span>
        </div>

        {post.skills && (
          <div className="flex flex-wrap gap-1.5 text-[12px] text-stone-600">
            {post.skills.split(",").map((s) => s.trim()).filter(Boolean).map((skill) => (
              <span key={skill} className="rounded-sm bg-stone-100/70 px-2 py-0.5">
                {skill}
              </span>
            ))}
          </div>
        )}
      </div>

      <MarkdownRenderer content={post.descriptionMarkdown} />

      {post.applyMode === "external" && post.applyUrl ? (
        <a
          href={post.applyUrl}
          target="_blank"
          rel="noreferrer"
          className="w-fit cursor-pointer rounded-lg bg-stone-900 px-6 py-1.5 text-[14px] font-normal text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.15),inset_0_-1px_0_rgba(0,0,0,0.12)] hover:bg-stone-950"
        >
          Apply on {company?.name ?? "company site"} →
        </a>
      ) : (
        <Link
          href={`/company/${post.id}/${post.companySlug}/talent/default`}
          className="w-fit cursor-pointer rounded-lg bg-stone-900 px-6 py-1.5 text-[14px] font-normal text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.15),inset_0_-1px_0_rgba(0,0,0,0.12)] hover:bg-stone-950"
        >
          Apply to this job
        </Link>
      )}
    </div>
  );
}
