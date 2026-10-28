import { cn } from "@/lib/utils";

function Shimmer({ className }: { className?: string }) {
  return <div className={cn("animate-shimmer rounded", className)} aria-hidden />;
}

function JobCardSkeleton({ index }: { index: number }) {
  return (
    <div
      className="flex flex-col gap-2.5 rounded-xl border border-stone-100/80 bg-white/60 px-6 py-4 shadow-[0_1px_2px_rgba(0,0,0,0.03)]"
      style={{ animationDelay: `${index * 60}ms` }}
      aria-hidden={index > 0}
    >
      {/* logo + company + flag + timestamp row */}
      <div className="flex items-center gap-2.5">
        <Shimmer className="size-5 rounded-md" />
        <Shimmer className="h-3 w-24" />
        <Shimmer className="h-3 w-5" />
        <Shimmer className="ml-auto h-3 w-12" />
      </div>
      {/* title + preview row */}
      <div className="flex items-center justify-between gap-4">
        <Shimmer
          className={cn(
            "h-4",
            index % 3 === 0 ? "w-56" : index % 3 === 1 ? "w-44" : "w-64",
          )}
        />
        <Shimmer className="h-3 w-14 shrink-0" />
      </div>
      {/* excerpt lines */}
      <div className="flex flex-col gap-1.5">
        <Shimmer className="h-3 w-full" />
        <Shimmer className="h-3 w-2/3" />
      </div>
      {/* pills */}
      <div className="mt-1 flex flex-wrap items-center gap-1.5">
        <Shimmer className="h-[22px] w-[72px] rounded-sm" />
        <Shimmer className="h-[22px] w-[64px] rounded-sm" />
        <Shimmer className="h-[22px] w-[58px] rounded-sm" />
        <Shimmer className="h-[22px] w-[80px] rounded-sm" />
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