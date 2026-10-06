"use client";

import { useTransition } from "react";
import { authClient } from "@/lib/auth-client";

/**
 * Optimistic sign-out:
 *  1. Call the server endpoint — it revokes the session row AND clears the
 *     signed session cookies (`session_token`, `session_data`).
 *  2. On success, hard-navigate. A full reload is required because the cookie
 *     state lives in the HTTP request headers that the server already read
 *     for this render; `router.push` alone would keep the stale session in
 *     any server component that already rendered.
 */
export function SignOutButton() {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          await authClient.signOut({
            fetchOptions: {
              onSuccess: () => {
                // Force a fresh render so every server component re-reads
                // headers (now without the session cookie).
                window.location.href = "/";
              },
            },
          });
        })
      }
      className="cursor-pointer rounded-lg bg-stone-900 px-6 py-1.5 text-[14px] font-normal text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.15),inset_0_-1px_0_rgba(0,0,0,0.12)] transition-all hover:bg-stone-950 disabled:opacity-60"
    >
      {isPending ? "Signing out…" : "Sign out"}
    </button>
  );
}