export function JobsListSkeleton() {
  return (
    <div className="mt-5 flex flex-col gap-3" aria-busy="true" aria-label="Loading recent job posts">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="flex flex-col gap-2.5 rounded-lg border border-stone-100 bg-stone-50 px-6 py-4"
        >
          <div className="flex items-center gap-2.5">
            <div className="size-5 animate-pulse rounded-md bg-stone-200/70" />
            <div className="h-3 w-20 animate-pulse rounded bg-stone-200/70" />
            <div className="ml-auto h-3 w-10 animate-pulse rounded bg-stone-200/70" />
          </div>
          <div className="flex items-center justify-between gap-4">
            <div className="h-4 w-48 animate-pulse rounded bg-stone-200/70" />
            <div className="h-3 w-14 animate-pulse rounded bg-stone-200/70" />
          </div>
          <div className="h-3 w-full animate-pulse rounded bg-stone-200/60" />
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <div className="h-4 w-20 animate-pulse rounded-sm bg-stone-100" />
            <div className="h-4 w-20 animate-pulse rounded-sm bg-stone-100" />
            <div className="h-4 w-16 animate-pulse rounded-sm bg-stone-100" />
          </div>
        </div>
      ))}
    </div>
  );
}
