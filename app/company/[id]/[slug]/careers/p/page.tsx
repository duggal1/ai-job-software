import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { getCareerPageData } from "@/lib/actions/get-career-page-data";
import { CareersClient } from "@/components/careers-client";

export default async function PrivateCareersPage({
  params,
}: {
  params: Promise<{ id: string; slug: string }>;
}) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/sign-in");
  }

  const { id } = await params;
  const data = await getCareerPageData(id);

  if (!data || data.post.companyId !== session.user.id) {
    return <p className="py-24 text-center text-[13px] text-stone-400">Page not found.</p>;
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <div className="mb-10 flex items-center justify-between">
        <h1 className="text-xl font-normal tracking-tight text-stone-900">Company dashboard</h1>
        <div className="flex items-center gap-4 text-[13px] text-stone-500">
          <Link href="/company/applicants" className="cursor-pointer hover:text-stone-900 hover:underline hover:decoration-dotted hover:underline-offset-4">
            Applicants
          </Link>
        </div>
      </div>
      <CareersClient data={data} showPostButton />
    </div>
  );
}
