"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

/**
 * Landing search. Rebuilt from scratch:
 * - zero horizontal padding on the button's label (the height/padding lives on
 *   the container, the text sits flush)
 * - a pixel loader animates in the button prefix while `/jobs` navigates
 */
export function SearchForm() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [isPending, startTransition] = useTransition();

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = query.trim();
    startTransition(() => {
      router.push(trimmed ? `/jobs?q=${encodeURIComponent(trimmed)}` : "/jobs");
    });
  };

  return (
    <form onSubmit={submit} action="/jobs" method="get" className="mt-10 flex items-center gap-2">
      <div className="relative w-full">
        <input
          name="q"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search any role, skill, or company…"
          className="h-10 w-full rounded-lg border border-stone-200/70 bg-stone-50/80 px-4 pr-9 text-[14px] text-stone-800 outline-none placeholder:text-stone-400 focus:ring-1 focus:ring-stone-300 [&::-webkit-search-cancel-button]:hidden"
        />
        {query && !isPending && (
          <button
            type="button"
            aria-label="Clear search"
            onClick={() => setQuery("")}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 cursor-pointer rounded-full p-1 text-neutral-900/70 transition-colors hover:bg-stone-200/60 hover:text-neutral-900"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        )}
      </div>

      <button
        type="submit"
        disabled={isPending}
        aria-busy={isPending}
        className="flex h-10 shrink-0 cursor-pointer items-center gap-2 rounded-lg bg-stone-900 px-3 text-[13px] font-normal text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.15),inset_0_-1px_0_rgba(0,0,0,0.12)] transition-colors hover:bg-stone-950 disabled:cursor-wait disabled:opacity-80"
      >
        {isPending && <PixelLoader />}
        <span className="leading-none">Search</span>
      </button>
    </form>
  );
}

/** 2×2 pixel grid, staggered — reads as a tiny pixel loader. */
function PixelLoader() {
  return (
    <span aria-hidden className="grid grid-cols-2 gap-[2px]">
      {[0, 1, 2, 3].map((i) => (
        <span
          key={i}
          className="size-[3px] animate-pulse rounded-[1px] bg-white"
          style={{ animationDelay: `${i * 120}ms`, animationDuration: "700ms" }}
        />
      ))}
    </span>
  );
}
