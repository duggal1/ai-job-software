import { Suspense } from "react";
import { getCareerPageData } from "@/lib/actions/get-career-page-data";
import { CareersClient } from "@/components/careers-client";
import { CareersSkeleton } from "@/components/careers-skeleton";

export default function PublicCareersPage({
  params,
}: {
  params: Promise<{ id: string; slug: string }>;
}) {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <Suspense fallback={<CareersSkeleton />}>
        <CareersContent params={params} />
      </Suspense>
    </div>
  );
}

async function CareersContent({
  params,
}: {
  params: Promise<{ id: string; slug: string }>;
}) {
  const { id } = await params;
  const data = await getCareerPageData(id);

  if (!data) {
    return <p className="py-24 text-center text-[13px] text-stone-400">Page not found.</p>;
  }

  return <CareersClient data={data} showPostButton={false} />;
}
