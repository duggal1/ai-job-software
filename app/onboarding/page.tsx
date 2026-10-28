import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getMyCompany } from "@/lib/actions/company";
import { OnboardingWizard } from "@/components/onboarding-wizard";

export const dynamic = "force-dynamic";
export const metadata = { title: "Set up your company" };

export default async function OnboardingPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/sign-in");

  const company = await getMyCompany(session);
  // Already onboarded: onboarding is a one-time flow.
  if (company?.onboardedAt) redirect("/job-post/new");

  const talentNeeds = (company?.talentNeeds ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  return (
    <main className="mx-auto w-full max-w-lg px-6 py-16">
      <h1 className="text-2xl font-normal tracking-tight text-stone-900">
        Welcome to Fly AI
      </h1>
      <p className="mt-1 text-[14px] leading-relaxed text-stone-500">
        Three quick steps so every job post and candidate match starts from the
        right context. You can autofill the whole thing from your domain.
      </p>

      <OnboardingWizard
        initial={{
          name: company?.name ?? "",
          domain: company?.domain ?? "",
          employeeCount: company?.employeeCount ?? "",
          industry: company?.industry ?? "",
          talentNeeds,
        }}
      />
    </main>
  );
}
