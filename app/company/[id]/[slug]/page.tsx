import { Suspense } from "react";
import { getJobDetailData } from "@/lib/actions/get-job-detail-data";
import { JobPostDetail } from "@/components/job-post-detail";
import { JobDetailSkeleton } from "@/components/job-detail-skeleton";

export default function Page({
  params,
}: {
  params: Promise<{ id: string; slug: string }>;
}) {
  return (
    <div className="mx-auto max-w-xl px-6 py-16">
      <Suspense fallback={<JobDetailSkeleton />}>
        <JobDetail params={params} />
      </Suspense>
    </div>
  );
}

async function JobDetail({
  params,
}: {
  params: Promise<{ id: string; slug: string }>;
}) {
  const { id } = await params;
  const data = await getJobDetailData(id);
  return <JobPostDetail data={data} />;
}
