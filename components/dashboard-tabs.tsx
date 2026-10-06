"use client";

import { useState, type ReactNode } from "react";

const TABS = ["Account", "Company", "Sessions"] as const;
type Tab = (typeof TABS)[number];

export function DashboardTabs({
  account,
  company,
  sessions,
}: {
  account: ReactNode;
  company: ReactNode;
  sessions: ReactNode;
}) {
  const [tab, setTab] = useState<Tab>("Account");

  return (
    <div className="mt-8">
      <div role="tablist" aria-label="Dashboard" className="flex items-center gap-2">
        {TABS.map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
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
        {tab === "Sessions" && sessions}
      </div>
    </div>
  );
}
