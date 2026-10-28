import { JobDetailSkeleton } from "@/components/job-detail-skeleton";

export default function Loading() {
  return (
    <div className="mx-auto max-w-xl px-6 py-16">
      <JobDetailSkeleton />
    </div>
  );
}
