import { HugeiconsIcon } from "@hugeicons/react";
import {
  AndroidIcon,
  ComputerDeskIcon,
  SmartPhone01Icon,
} from "@hugeicons/core-free-icons";
import { AppleLogo } from "@/components/apple-logo";
import type { DeviceIcon } from "@/lib/settings/devices";
import { RevokeOtherSessionsButton } from "@/components/revoke-other-sessions-button";

export interface SessionEntry {
  id: string;
  current: boolean;
  title: string;
  sub: string;
  icon: DeviceIcon;
  mobile: boolean;
  ip: string | null;
  seenAt: string | null;
}

const ICONS: Record<Exclude<DeviceIcon, "apple">, typeof AndroidIcon> = {
  android: AndroidIcon,
  desktop: ComputerDeskIcon,
  mobile: SmartPhone01Icon,
};

export function SessionsTable({
  sessions,
  failed,
}: {
  sessions: SessionEntry[];
  failed: boolean;
}) {
  return (
    <section aria-label="Active sessions" className="mt-3 rounded-lg border border-stone-100 bg-stone-50 px-6 py-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-[15px] font-normal text-stone-900">Active sessions</h2>
          <p className="mt-1 text-[13px] text-stone-400">
            Devices signed in to your account.
          </p>
        </div>
        {sessions.length > 1 && <RevokeOtherSessionsButton />}
      </div>

      {failed ? (
        <p role="alert" className="mt-4 text-[13px] text-orange-700">
          Sessions could not be loaded. Showing the current device only.
        </p>
      ) : null}

      <ul className="mt-4 flex flex-col">
        {sessions.map((s) => (
          <li
            key={s.id}
            className="flex items-center gap-3 border-t border-stone-200/50 py-3 first:border-t-0 first:pt-1 last:pb-0"
          >
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-stone-100 text-stone-600">
              {s.icon === "apple" ? (
                <AppleLogo className="size-4" />
              ) : (
                <HugeiconsIcon icon={ICONS[s.icon]} className="size-4" />
              )}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[14px] font-normal text-stone-800">
                {s.title}
                {s.current && (
                  <span className="ml-2 inline-flex items-center gap-1.5 rounded-[2px] bg-green-500/16 px-1.5 py-0.5 text-[10px] font-normal tracking-tight text-neutral-900">
                    <span className="size-1.5 rounded-full bg-green-600" />
                    This device
                  </span>
                )}
              </p>
              <p className="mt-0.5 text-[12px] text-stone-400">
                {s.sub}
                {s.ip ? ` · ${s.ip}` : ""}
              </p>
            </div>
            {s.seenAt && (
              <span className="shrink-0 text-[12px] text-stone-400" suppressHydrationWarning>
                {s.seenAt}
              </span>
            )}
          </li>
        ))}
        {sessions.length === 0 && !failed && (
          <li className="py-4 text-center text-[13px] text-stone-400">
            No active sessions.
          </li>
        )}
      </ul>
    </section>
  );
}
