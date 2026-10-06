"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export function RevokeOtherSessionsButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  function handleRevoke() {
    setError("");
    startTransition(async () => {
      try {
        await authClient.revokeSessions();
        router.refresh();
      } catch {
        setError("Could not sign out other devices. Please try again.");
      }
    });
  }

  return (
    <div className="flex shrink-0 flex-col items-end gap-1">
      <button
        type="button"
        disabled={isPending}
        onClick={handleRevoke}
        className="cursor-pointer text-[12px] text-stone-500 underline decoration-dotted underline-offset-4 hover:text-stone-800 disabled:opacity-60"
      >
        {isPending ? "Signing out…" : "Sign out others"}
      </button>
      {error && <p className="text-[11px] text-orange-600">{error}</p>}
    </div>
  );
}
