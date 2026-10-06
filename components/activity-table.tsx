export interface ActivityEntry {
  id: string;
  label: string;
  detail: string;
  at: string;
}

export function ActivityTable({ entries }: { entries: ActivityEntry[] }) {
  if (entries.length === 0) return null;

  return (
    <section aria-label="Recent activity" className="mt-3 rounded-lg border border-stone-100 bg-stone-50 px-6 py-5">
      <h2 className="text-[15px] font-normal text-stone-900">Recent activity</h2>
      <p className="mt-1 text-[13px] text-stone-400">
        Sign-ins recorded on your account, newest first.
      </p>
      <ul className="mt-4 flex flex-col">
        {entries.map((e) => (
          <li
            key={e.id}
            className="flex items-baseline justify-between gap-4 border-t border-stone-200/50 py-3 first:border-t-0 first:pt-1 last:pb-0"
          >
            <div className="min-w-0">
              <p className="text-[14px] font-normal text-stone-800">{e.label}</p>
              <p className="mt-0.5 truncate text-[12px] text-stone-400">{e.detail}</p>
            </div>
            <span className="shrink-0 text-[12px] text-stone-400">{e.at}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
