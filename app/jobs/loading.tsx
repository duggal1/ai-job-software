import { JobsListSkeleton } from "@/components/jobs-list-skeleton";

export default function Loading() {
  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-16">
      <div className="h-8 w-64 animate-pulse rounded bg-stone-100" />
      <div className="mt-2 h-4 w-80 animate-pulse rounded bg-stone-100" />
      <div className="mt-10">
        <JobsListSkeleton count={6} />
      </div>
    </main>
  );
}
