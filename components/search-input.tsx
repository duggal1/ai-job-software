"use client";

import { useState } from "react";

export function SearchInput({
  name = "q",
  placeholder,
  defaultValue = "",
  onClear,
}: {
  name?: string;
  placeholder: string;
  defaultValue?: string;
  onClear?: () => void;
}) {
  const [value, setValue] = useState(defaultValue);

  return (
    <div className="relative w-full">
      <input
        name={name}
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className="h-10 w-full rounded-lg border border-stone-200/70 bg-stone-50/80 px-4 pr-9 text-[14px] text-stone-800 outline-none placeholder:text-stone-400 focus:ring-1 focus:ring-stone-300 [&::-webkit-search-cancel-button]:hidden"
      />
      {value && (
        <button
          type="button"
          aria-label="Clear search"
          onClick={() => {
            setValue("");
            onClear?.();
          }}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 cursor-pointer rounded-full p-1 text-neutral-900/70 transition-colors hover:bg-stone-200/60 hover:text-neutral-900"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}
