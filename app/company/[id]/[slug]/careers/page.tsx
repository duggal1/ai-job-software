import { getCareerPageData } from "@/lib/actions/get-career-page-data";
import { CareersClient } from "@/components/careers-client";

export default async function PublicCareersPage({
  params,
}: {
  params: Promise<{ id: string; slug: string }>;
}) {
  const { id } = await params;
  const data = await getCareerPageData(id);

  if (!data) {
    return <p className="py-24 text-center text-[13px] text-stone-400">Page not found.</p>;
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <CareersClient data={data} showPostButton={false} />
    </div>
  );
}
