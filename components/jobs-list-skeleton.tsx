import { cn } from "@/lib/utils";

function JobCardSkeleton({ index }: { index: number }) {
  return (
    <div
      className="flex flex-col gap-2 rounded-lg border border-stone-100 bg-stone-50 px-6 py-4"
      aria-hidden={index > 0}
    >
      {/* logo + company + flag + timestamp row */}
      <div className="flex items-center gap-2.5">
        <div className="size-5 animate-pulse rounded-md bg-stone-200/80" />
        <div className="h-3 w-24 animate-pulse rounded bg-stone-200/70" />
        <div className="h-3 w-5 animate-pulse rounded bg-stone-100" />
        <div className="ml-auto h-3 w-12 animate-pulse rounded bg-stone-200/60" />
      </div>
      {/* title + preview row */}
      <div className="flex items-center justify-between gap-4">
        <div
          className={cn(
            "h-4 animate-pulse rounded bg-stone-200/80",
            index % 3 === 0 ? "w-56" : index % 3 === 1 ? "w-44" : "w-64",
          )}
        />
        <div className="h-3 w-14 shrink-0 animate-pulse rounded bg-stone-200/50" />
      </div>
      {/* excerpt lines */}
      <div className="flex flex-col gap-1.5">
        <div className="h-3 w-full animate-pulse rounded bg-stone-200/50" />
        <div className="h-3 w-2/3 animate-pulse rounded bg-stone-200/40" />
      </div>
      {/* pills */}
      <div className="mt-1 flex flex-wrap items-center gap-1.5">
        <div className="h-[22px] w-[72px] animate-pulse rounded-sm bg-stone-200/60" />
        <div className="h-[22px] w-[64px] animate-pulse rounded-sm bg-orange-100/80" />
        <div className="h-[22px] w-[58px] animate-pulse rounded-sm bg-purple-100/70" />
        <div className="h-[22px] w-[80px] animate-pulse rounded-sm bg-stone-200/50" />
      </div>
    </div>
  );
}

export function JobsListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div
      className="mt-5 flex flex-col gap-3"
      role="status"
      aria-busy="true"
      aria-label="Loading job posts"
    >
      <span className="sr-only">Loading job posts…</span>
      {Array.from({ length: count }).map((_, i) => (
        <JobCardSkeleton key={i} index={i} />
      ))}
    </div>
  );
}
