export function JobDetailSkeleton() {
  return (
    <div className="flex animate-pulse flex-col gap-10" aria-hidden>
      <div className="flex items-center gap-3">
        <div className="size-10 rounded-lg bg-stone-100" />
        <div className="h-5 w-40 rounded bg-stone-100" />
      </div>
      <div className="flex flex-col gap-3">
        <div className="h-6 w-2/3 rounded bg-stone-100" />
        <div className="h-4 w-1/3 rounded bg-stone-100" />
        <div className="flex gap-2">
          <div className="h-5 w-20 rounded bg-stone-100" />
          <div className="h-5 w-24 rounded bg-stone-100" />
          <div className="h-5 w-16 rounded bg-stone-100" />
        </div>
      </div>
      <div className="flex flex-col gap-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-3.5 rounded bg-stone-100" style={{ width: `${92 - (i % 4) * 9}%` }} />
        ))}
      </div>
    </div>
  );
}
