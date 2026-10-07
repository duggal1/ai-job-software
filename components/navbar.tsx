"use client";

import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import { authClient } from "@/lib/auth-client";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  // `isPending` matters: on first load the session cookie hasn't been read
  // yet, so we render a skeleton pill instead of flashing logged-out UI.
  const { data: session, isPending } = authClient.useSession();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const goToDashboard = useCallback(() => {
    window.location.href = "/dashboard";
  }, []);

  return (
    <nav
      className={`sticky top-0 z-50 flex items-center gap-2 px-6 py-3 text-[13px] font-medium text-stone-900 transition-all ${
        scrolled ? "bg-stone-50/70 backdrop-blur-lg" : ""
      }`}
    >
      <Link href="/" className="flex items-center gap-2">
        <img src="/logo.svg" alt="" className="size-5" />
        <span className="text-[17px] font-medium tracking-tighter antialiased">Fly AI</span>
      </Link>

      <Link href="/jobs" className="ml-4 text-[13px] font-normal text-stone-600 hover:text-stone-900">
        Jobs
      </Link>

      <div className="ml-auto flex items-center gap-2">
        <Link
          href="/job-post/new"
          className="cursor-pointer rounded-lg bg-stone-900 px-3 py-1 text-[13px] font-normal text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.15),inset_0_-1px_0_rgba(0,0,0,0.12)] transition-all hover:bg-stone-950"
        >
          Post Job
        </Link>
        {isPending ? (
          <span className="flex items-center gap-2" aria-label="Checking sign-in status">
            <span className="h-7 w-20 animate-pulse rounded-lg bg-stone-200/70" />
            <span className="h-7 w-24 animate-pulse rounded-lg bg-stone-100" />
          </span>
        ) : session ? (
          <>
            <Link href="/company/applicants" className="cursor-pointer px-2 py-1 text-[13px] font-normal text-stone-600 hover:text-stone-900">
              Applicants
            </Link>
            <button
              onClick={goToDashboard}
              className="cursor-pointer rounded-lg bg-neutral-100 px-3 py-1 text-[13px] font-normal text-neutral-900 transition-colors hover:bg-neutral-200/70"
            >
              Dashboard
            </button>
          </>
        ) : (
          <Link
            href="/sign-in"
            className="cursor-pointer rounded-lg bg-neutral-100 px-3 py-1 text-[13px] font-normal text-neutral-900 transition-colors hover:bg-neutral-200/70"
          >
            Sign in
          </Link>
        )}
      </div>
    </nav>
  );
}
