"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { JOB_CATEGORIES } from "@/lib/validation";
import { parseLocation } from "@/lib/location";
import { timeAgo } from "@/lib/time-ago";
import type { CareerPageData } from "@/lib/actions/get-career-page-data";

const TABS = [
  { label: "All roles", value: null },
  ...JOB_CATEGORIES.map((c) => ({
    label: c.charAt(0).toUpperCase() + c.slice(1),
    value: c,
  })),
];

function CountryFlag({ countryCode }: { countryCode: string }) {
  if (countryCode === "US") {
    return (
      <Image src="/usa.svg" alt="" width={18} height={13} className="inline-block align-text-bottom" />
    );
  }
  const codePoints = countryCode
    .toUpperCase()
    .split("")
    .map((c) => 0x1f1e6 + c.charCodeAt(0) - 65);
  return <span className="text-[15px] leading-none">{String.fromCodePoint(...codePoints)}</span>;
}

export function CareersClient({ data, showPostButton }: { data: CareerPageData; showPostButton?: boolean }) {
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const { post, company, allPosts } = data;

  const filtered = activeTab
    ? allPosts.filter((p) => p.category === activeTab)
    : allPosts;

  return (
    <>
      <div className="mb-12">
        {company?.logoUrl && (
          <Image
            src={company.logoUrl}
            alt=""
            width={48}
            height={48}
            className="mb-4 rounded-lg object-contain"
          />
        )}
        <h1 className="text-2xl font-normal tracking-tight text-stone-900">
          {company?.name ?? post.companyName}
        </h1>
        <p className="mt-1 text-[14px] text-stone-500">Careers</p>
      </div>

      <div className="mb-10 flex items-center justify-between">
        <h2 className="text-[15px] font-normal text-stone-800">Open roles</h2>
        {showPostButton && (
          <Link
            href="/job-post/new"
            className="cursor-pointer rounded-lg bg-stone-900 px-6 py-1.5 text-[15px] font-normal text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.15),inset_0_-1px_0_rgba(0,0,0,0.12)] transition-all hover:underline hover:underline-offset-2"
          >
            Post a job opening
          </Link>
        )}
      </div>

      <div className="mb-8 flex flex-wrap gap-2">
        {TABS.map((tab) => (
          <button
            key={tab.label}
            onClick={() => setActiveTab(tab.value)}
            className={`cursor-pointer rounded-lg px-4 py-1.5 text-[13px] transition-all ${
              activeTab === tab.value
                ? "bg-stone-300/60 text-stone-900 cursor-pointer"
                : "bg-stone-100/80 text-stone-600 hover:bg-stone-200/65 cursor-pointer"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-3">
        {filtered.map((p) => {
          const parsed = parseLocation(p.location);
          return (
            <Link
              key={p.id}
              href={`/company/${p.id}/${p.companySlug}`}
              className="group rounded-lg border border-stone-100 bg-stone-50 px-6 py-4 transition-all hover:border-stone-200"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-[15px] font-normal text-stone-900">{p.jobTitle}</h3>
                <span className="flex items-center gap-1 text-[13px] font-normal text-stone-500 transition-all group-hover:text-stone-700">
                  Preview
                  <HugeiconsIcon icon={ArrowRight01Icon} className="size-3.5" />
                </span>
              </div>
              <div className="mt-1.5 flex items-center gap-2 text-[13px] text-stone-500">
                {parsed && <CountryFlag countryCode={parsed.countryCode} />}
                <span>{p.location}</span>
                <span className="text-stone-300">&middot;</span>
                <span>{p.estimatedSalary}</span>
                <span className="text-stone-300">&middot;</span>
                <span
                  className={`shrink-0 rounded px-1.5 py-0.5 text-[11px] font-medium ${
                    p.workMode === "remote"
                      ? "bg-purple-100 text-purple-700"
                      : "bg-stone-100 text-stone-600"
                  }`}
                >
                  {p.workMode === "remote" ? "Remote" : p.workMode === "hybrid" ? "Hybrid" : "On-site"}
                </span>
                <span className="ml-auto text-stone-400" suppressHydrationWarning>{timeAgo(p.createdAt)}</span>
              </div>
            </Link>
          );
        })}
        {filtered.length === 0 && (
          <p className="py-8 text-center text-[13px] text-stone-400">No open roles in this category.</p>
        )}
      </div>
    </>
  );
}
