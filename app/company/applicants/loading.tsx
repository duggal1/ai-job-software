export default function Loading() {
  return (
    <main className="mx-auto w-full max-w-3xl animate-pulse px-6 py-16" aria-hidden>
      <div className="h-8 w-40 rounded bg-stone-100" />
      <div className="mt-2 h-4 w-96 max-w-full rounded bg-stone-100" />
      <div className="mt-10 h-24 rounded-lg bg-stone-100/80" />
      <div className="mt-3 h-56 rounded-lg bg-stone-100/80" />
      <div className="mt-10 flex flex-col gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 rounded-lg bg-stone-100/70" />
        ))}
      </div>
    </main>
  );
}
