"use client";

import { useState, type ReactNode } from "react";

const TABS = ["Account", "Company", "Posts", "Sessions"] as const;
export type DashboardTab = (typeof TABS)[number];

export function DashboardTabs({
  account,
  company,
  posts,
  sessions,
  initialTab = "Account",
}: {
  account: ReactNode;
  company: ReactNode;
  posts: ReactNode;
  sessions: ReactNode;
  initialTab?: DashboardTab;
}) {
  const [tab, setTab] = useState<DashboardTab>(initialTab);

  function select(next: DashboardTab) {
    setTab(next);
    // Keep the tab in the URL without a server round trip, so a refresh or a
    // link from the post editor lands back on Posts.
    const url =
      next === "Account" ? "/dashboard" : `/dashboard?tab=${next.toLowerCase()}`;
    window.history.replaceState(null, "", url);
  }

  return (
    <div className="mt-8">
      <div role="tablist" aria-label="Dashboard" className="flex items-center gap-2">
        {TABS.map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            onClick={() => select(t)}
            className={`cursor-pointer rounded-lg px-4 py-1.5 text-[13px] transition-colors ${
              tab === t
                ? "bg-stone-300/60 text-stone-900"
                : "bg-stone-100/80 text-stone-600 hover:bg-stone-200/65"
            }`}
          >
            {t}
          </button>
        ))}
      </div>
      <div className="mt-6">
        {tab === "Account" && account}
        {tab === "Company" && company}
        {tab === "Posts" && posts}
        {tab === "Sessions" && sessions}
      </div>
    </div>
  );
}
