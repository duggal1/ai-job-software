export function CareersSkeleton() {
  return (
    <div className="flex animate-pulse flex-col gap-8" aria-hidden>
      <div className="flex flex-col gap-3">
        <div className="size-12 rounded-lg bg-stone-100" />
        <div className="h-6 w-48 rounded bg-stone-100" />
        <div className="h-3.5 w-24 rounded bg-stone-100" />
      </div>
      <div className="flex gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-8 w-20 rounded-lg bg-stone-100" />
        ))}
      </div>
      <div className="flex flex-col gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-[74px] rounded-lg border border-stone-100 bg-stone-50/60" />
        ))}
      </div>
    </div>
  );
}
