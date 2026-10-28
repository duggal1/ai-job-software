import { Suspense } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import * as z from "zod";
import { auth } from "@/lib/auth";
import { getClientInfo, redactIp } from "@/lib/actions/security/client";
import { describeSession } from "@/lib/settings/devices";
import { ProfileNameForm } from "@/components/profile-name-form";
import { SessionsTable, type SessionEntry } from "@/components/sessions-table";
import { ActivityTable, type ActivityEntry } from "@/components/activity-table";
import { SignOutButton } from "@/components/sign-out-button";
import { DeleteAccount } from "@/components/delete-account";
import { DashboardTabs, type DashboardTab } from "@/components/dashboard-tabs";
import { PostsCrm } from "@/components/posts-crm";
import { CompanySettings } from "@/components/company-settings";
import { getMyCompany } from "@/lib/actions/company";
import { getJobPostsByCompany } from "@/lib/actions/get-company-job-posts";
import { timeAgo } from "@/lib/time-ago";

export const metadata = { title: "Dashboard" };

type Session = NonNullable<Awaited<ReturnType<typeof auth.api.getSession>>>;

/** Live session rows, validated — unknown shapes never reach the UI. */
const SessionRowSchema = z
  .object({
    id: z.string(),
    ipAddress: z.string().nullish(),
    userAgent: z.string().nullish(),
    createdAt: z.union([z.string(), z.date()]).nullish(),
    updatedAt: z.union([z.string(), z.date()]).nullish(),
  })
  .passthrough();

async function readSessions(session: Session): Promise<{ sessions: SessionEntry[]; failed: boolean }> {
  try {
    const hdrs = await headers();
    const [listRes, live] = await Promise.all([
      auth.api.listSessions({ headers: hdrs }).catch(() => null),
      (async () => {
        try {
          return getClientInfo(hdrs);
        } catch {
          return null;
        }
      })(),
    ]);

    const current = session.session;
    const currentId = typeof current?.id === "string" ? current.id : null;

    const rows: unknown[] = Array.isArray(listRes) ? (listRes as unknown[]) : [];

    const sessions: SessionEntry[] = [];
    let renderedCurrent = false;

    // This device, from the live request — same headers, same device, exact.
    // It can never come back empty, so the current row always shows real data.
    if (currentId != null && live != null) {
      const device = describeSession({
        os: live.os,
        osVersion: live.osVersion,
        browser: live.browser,
        browserVersion: live.browserVersion,
        deviceType: live.deviceType,
      });
      sessions.push({
        id: currentId,
        current: true,
        title: device.title,
        sub: device.sub,
        icon: device.icon,
        mobile: device.mobile,
        ip: redactIp(live.ip),
        seenAt: "now",
      });
      renderedCurrent = true;
    }

    // Every other device, straight from the session table.
    for (const row of rows) {
      const parsed = SessionRowSchema.safeParse(row);
      if (!parsed.success) continue;
      const isCurrent = currentId != null && parsed.data.id === currentId;
      if (isCurrent && renderedCurrent) continue;
      const info = parsed.data.userAgent
        ? getClientInfo(new Headers({ "user-agent": parsed.data.userAgent }))
        : null;
      const device = describeSession({
        os: info?.os ?? null,
        osVersion: info?.osVersion ?? null,
        browser: info?.browser ?? null,
        browserVersion: info?.browserVersion ?? null,
        deviceType: info?.deviceType ?? null,
      });
      const updated =
        parsed.data.updatedAt instanceof Date
          ? parsed.data.updatedAt
          : parsed.data.updatedAt
            ? new Date(parsed.data.updatedAt)
            : null;
      sessions.push({
        id: parsed.data.id,
        current: isCurrent,
        title: device.title,
        sub: device.sub,
        icon: device.icon,
        mobile: device.mobile,
        ip: parsed.data.ipAddress ? redactIp(parsed.data.ipAddress) : null,
        seenAt: updated && !Number.isNaN(updated.getTime()) ? timeAgo(updated) : null,
      });
    }
    return { sessions, failed: false };
  } catch {
    return { sessions: [], failed: true };
  }
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string | string[] }>;
}) {
  // Auth is the only thing that gates the shell. Sessions and company data
  // stream in behind Suspense below, so the page paints immediately.
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/sign-in");
  const user = session.user;

  // Onboarding is mandatory before the dashboard is useful.
  const company = await getMyCompany(session);
  if (!company?.onboardedAt) redirect("/onboarding");

  const params = await searchParams;
  const tabParam =
    typeof params.tab === "string" ? params.tab.toLowerCase() : "";
  const initialTab: DashboardTab =
    tabParam === "company"
      ? "Company"
      : tabParam === "posts"
        ? "Posts"
        : tabParam === "sessions"
          ? "Sessions"
          : "Account";

  return (
    <main className="mx-auto w-full max-w-xl px-6 py-16">
      <h1 className="text-xl font-normal tracking-tight text-stone-900">Dashboard</h1>
      <p className="mt-1 text-[14px] text-stone-500">
        Manage your account, sessions, and security.
      </p>

      <DashboardTabs
        initialTab={initialTab}
        account={
          <>
            <section aria-label="Profile" className="rounded-lg border border-stone-100 bg-stone-50 px-6 py-5">
              <h2 className="text-[15px] font-normal text-stone-900">Profile</h2>
              <div className="mt-4">
                <ProfileNameForm initialName={user.name} email={user.email} />
              </div>
            </section>

            <section aria-label="Security and privacy" className="mt-3 rounded-lg border border-stone-100 bg-stone-50 px-6 py-5">
              <h2 className="text-[15px] font-normal text-stone-900">Security and privacy</h2>
              <ul className="mt-4 flex flex-col">
                {[
                  "One-time email codes are required before a sign-in session is created.",
                  "Device and network data is read from sign-in headers to prevent abuse.",
                  "IP addresses are partially hidden in this dashboard. Full addresses are never sent to your browser.",
                  "Verification codes are stored as hashes. Session data lives in your own database.",
                ].map((line) => (
                  <li
                    key={line}
                    className="border-t border-stone-200/50 py-3 text-[13px] leading-5 text-stone-500 first:border-t-0 first:pt-1 last:pb-0"
                  >
                    {line}
                  </li>
                ))}
              </ul>
            </section>

            <section aria-label="Sign out" className="mt-3 rounded-lg border border-stone-100 bg-stone-50 px-6 py-5">
              <h2 className="text-[15px] font-normal text-stone-900">Sign out</h2>
              <p className="mt-1 text-[13px] text-stone-400">
                Sign out on this device. Your posts and applicants will remain.
              </p>
              <div className="mt-4">
                <SignOutButton />
              </div>
            </section>

            <DeleteAccount />
          </>
        }
        company={
          <CompanyTab company={company} />
        }
        posts={
          <Suspense fallback={<PanelSkeleton rows={4} />}>
            <PostsTab session={session} />
          </Suspense>
        }
        sessions={
          <Suspense fallback={<PanelSkeleton rows={4} />}>
            <SessionsTab session={session} />
          </Suspense>
        }
      />
    </main>
  );
}

async function CompanyTab({
  company,
}: {
  company: Awaited<ReturnType<typeof getMyCompany>>;
}) {
  return <CompanySettings initial={company} />;
}

async function PostsTab({ session }: { session: Session }) {
  const rows = await getJobPostsByCompany(session.user.id);
  return (
    <PostsCrm
      initialRows={rows.map((row) => ({
        id: row.id,
        jobTitle: row.jobTitle,
        companySlug: row.companySlug,
        archived: row.archived,
        location: row.location,
        workMode: row.workMode,
        estimatedSalary: row.estimatedSalary,
        createdAt: row.createdAt,
      }))}
    />
  );
}

async function SessionsTab({ session }: { session: Session }) {
  const { sessions, failed } = await readSessions(session);

  const activity: ActivityEntry[] = sessions.map((s) => ({
    id: s.id,
    label: "Signed in",
    detail: `${s.title}${s.ip ? ` · ${s.ip}` : ""}`,
    at: s.seenAt ?? "—",
  }));

  return (
    <>
      <SessionsTable sessions={sessions} failed={failed} />
      <ActivityTable entries={activity} />
    </>
  );
}

function PanelSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="mt-3 animate-pulse rounded-lg border border-stone-100 bg-stone-50 px-6 py-5" aria-hidden>
      <div className="h-4 w-32 rounded bg-stone-100" />
      <div className="mt-4 flex flex-col gap-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="h-8 rounded bg-stone-100/80" />
        ))}
      </div>
    </div>
  );
}
