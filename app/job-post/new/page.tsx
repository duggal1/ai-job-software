import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { JobPostForm } from "@/components/job-post-form";

export default async function JobPostNewPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/sign-in");
  }

  return (
    <div className="mx-auto max-w-xl px-6 py-16">
      <JobPostForm companyId={session.user.id} />
    </div>
  );
}