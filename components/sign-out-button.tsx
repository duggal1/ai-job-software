"use client";

import { useTransition } from "react";
import { authClient } from "@/lib/auth-client";

export function SignOutButton() {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          await authClient.signOut();
          window.location.href = "/";
        })
      }
      className="cursor-pointer rounded-lg bg-stone-900 px-6 py-1.5 text-[14px] font-normal text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.15),inset_0_-1px_0_rgba(0,0,0,0.12)] transition-all hover:bg-stone-950 disabled:opacity-60"
    >
      {isPending ? "Signing out…" : "Sign out"}
    </button>
  );
}
