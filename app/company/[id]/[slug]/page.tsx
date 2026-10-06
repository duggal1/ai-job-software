import { getJobDetailData } from "@/lib/actions/get-job-detail-data";
import { JobPostDetail } from "@/components/job-post-detail";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string; slug: string }>;
}) {
  const { id } = await params;
  const data = await getJobDetailData(id);

  return (
    <div className="mx-auto max-w-xl px-6 py-16">
      <JobPostDetail data={data} />
    </div>
  );
}
