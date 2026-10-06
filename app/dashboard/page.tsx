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
import { DashboardTabs } from "@/components/dashboard-tabs";
import { CompanySettings } from "@/components/company-settings";
import { getMyCompany } from "@/lib/actions/company";
import { timeAgo } from "@/lib/time-ago";

export const metadata = { title: "Dashboard" };

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

async function readSessions(session: NonNullable<
  Awaited<ReturnType<typeof auth.api.getSession>>
>): Promise<{ sessions: SessionEntry[]; failed: boolean }> {
  try {
    const [listRes, live] = await Promise.all([
      auth.api.listSessions({ headers: await headers() }).catch(() => null),
      (async () => {
        try {
          return getClientInfo(await headers());
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

export default async function DashboardPage() {
  const hdrs = await headers();
  const session = await auth.api.getSession({ headers: hdrs });
  if (!session?.user) redirect("/sign-in");
  const user = session.user;

  const [{ sessions, failed }, company] = await Promise.all([
    readSessions(session),
    getMyCompany(session),
  ]);

  const activity: ActivityEntry[] = sessions.map((s) => ({
    id: s.id,
    label: "Signed in",
    detail: `${s.title}${s.ip ? ` · ${s.ip}` : ""}`,
    at: s.seenAt ?? "—",
  }));

  return (
    <main className="mx-auto w-full max-w-xl px-6 py-16">
      <h1 className="text-xl font-normal tracking-tight text-stone-900">Dashboard</h1>
      <p className="mt-1 text-[14px] text-stone-500">
        Manage your account, sessions, and security.
      </p>

      <DashboardTabs
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
        company={<CompanySettings initial={company} />}
        sessions={
          <>
            <SessionsTable sessions={sessions} failed={failed} />
            <ActivityTable entries={activity} />
          </>
        }
      />
    </main>
  );
}
