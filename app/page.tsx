import Link from "next/link";
import { Suspense } from "react";
import { getLatestJobs } from "@/lib/actions/get-latest-jobs";
import { LatestJobsList } from "@/components/latest-jobs-list";
import { JobsListSkeleton } from "@/components/jobs-list-skeleton";
import { SearchForm } from "@/components/search-form";

/**
 * NEVER statically prerender this page. A static `/` bakes in whatever the
 * DB held at build time (empty) and serves it forever — the exact "landing
 * shows zero jobs while /jobs works" outage. `force-dynamic` renders per
 * request, and the TanStack list below refetches on mount as a second net.
 */
export const dynamic = "force-dynamic";

type PopularFilter = { label: string; href: string; icon: "flag" | "tag" | "dot"; prefix?: string };

const POPULAR_FILTERS: PopularFilter[] = [
  { label: "Germany", href: "/jobs?country=DE", icon: "flag", prefix: "🇩🇪" },
  { label: "United States", href: "/jobs?country=US", icon: "flag", prefix: "🇺🇸" },
  { label: "LangChain", href: "/jobs?skill=LangChain", icon: "tag" },
  { label: "Docker", href: "/jobs?skill=Docker", icon: "tag" },
  { label: "TypeScript", href: "/jobs?skill=TypeScript", icon: "tag" },
  { label: "PyTorch", href: "/jobs?skill=PyTorch", icon: "tag" },
  { label: "Next.js", href: "/jobs?skill=Next.js", icon: "tag" },
  { label: "Remote", href: "/jobs?q=remote", icon: "dot" },
  { label: "Senior", href: "/jobs?experience=senior", icon: "tag" },
  { label: "Staff", href: "/jobs?experience=staff", icon: "tag" },
];

export default async function Page() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col px-6 pb-24 pt-[10vh]">
      <h1 className="max-w-2xl text-4xl font-normal leading-[1.05] tracking-tighter text-stone-900 antialiased sm:text-5xl">
        Find your next AI engineering job, or the engineers to build it.
      </h1>
      <p className="mt-5 max-w-xl text-base leading-relaxed tracking-tight text-stone-500">
        The agentic AI job platform — infra, evals, and the people who ship them.
      </p>

      <SearchForm />

      <div className="mt-5 flex flex-wrap gap-2">
        {POPULAR_FILTERS.map((f) => (
          <Link
            key={f.label}
            href={f.href}
            className="flex cursor-pointer items-center gap-1.5 rounded-lg bg-stone-100/80 px-4 py-1.5 text-[13px] text-stone-600 transition-all hover:bg-stone-200/65"
          >
            {f.icon === "flag" && <span className="text-[13px] leading-none">{f.prefix}</span>}
            {f.icon === "tag" && <span className="text-[13px] leading-none text-stone-400">#</span>}
            {f.icon === "dot" && <span className="size-1.5 rounded-full bg-purple-500" />}
            {f.label}
          </Link>
        ))}
      </div>

      <div className="mt-16 flex items-center justify-between">
        <h2 className="text-[15px] font-normal text-stone-800">Recent job posts</h2>
        <Link
          href="/jobs"
          className="text-[13px] text-stone-500 underline-offset-4 hover:text-stone-800 hover:underline hover:decoration-dotted"
        >
          View all
        </Link>
      </div>
      <Suspense fallback={<LatestJobsFallback />}>
        <LatestJobsFeed />
      </Suspense>
    </main>
  );
}

/**
 * Streams the DB-backed list behind a Suspense boundary. The hero, search and
 * filter chips paint instantly; jobs arrive as soon as Postgres answers.
 */
async function LatestJobsFeed() {
  const initialJobs = await getLatestJobs();
  return <LatestJobsList initialData={initialJobs} />;
}

function LatestJobsFallback() {
  return (
    <div className="mt-5">
      <JobsListSkeleton />
    </div>
  );
}
