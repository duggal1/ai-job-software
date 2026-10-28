export default function Loading() {
  return (
    <main className="mx-auto w-full max-w-xl animate-pulse px-6 py-16" aria-hidden>
      <div className="h-6 w-32 rounded bg-stone-100" />
      <div className="mt-2 h-4 w-72 rounded bg-stone-100" />
      <div className="mt-8 flex gap-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-8 w-20 rounded-lg bg-stone-100" />
        ))}
      </div>
      <div className="mt-6 h-48 rounded-lg bg-stone-100/80" />
    </main>
  );
}
