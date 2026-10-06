"use client";

import { useState, useTransition } from "react";
import { authClient } from "@/lib/auth-client";

export function DeleteAccount() {
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    setError("");
    startTransition(async () => {
      try {
        await authClient.deleteUser();
        window.location.href = "/";
      } catch {
        setError("Could not delete your account. Please try again.");
      }
    });
  }

  return (
    <section aria-label="Delete account" className="mt-3 rounded-lg border border-stone-100 bg-stone-50 px-6 py-5">
      <h2 className="text-[15px] font-normal text-stone-900">Delete account</h2>
      <p className="mt-1 text-[13px] text-stone-400">
        Permanently delete your account, company, job posts, and applications.
        This cannot be undone.
      </p>
      {!confirming ? (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="mt-4 cursor-pointer text-[13px] text-orange-700 underline decoration-dotted underline-offset-4 hover:text-orange-800"
        >
          Delete my account
        </button>
      ) : (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            disabled={isPending}
            onClick={handleDelete}
            className="cursor-pointer rounded-lg bg-stone-900 px-4 py-1 text-[13px] font-normal text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.15),inset_0_-1px_0_rgba(0,0,0,0.12)] hover:bg-stone-950 disabled:opacity-60"
          >
            {isPending ? "Deleting…" : "Yes, delete everything"}
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={() => {
              setConfirming(false);
              setError("");
            }}
            className="cursor-pointer text-[13px] text-stone-500 hover:text-stone-800"
          >
            Keep my account
          </button>
        </div>
      )}
      {error && <p className="mt-3 text-[11px] text-orange-600">{error}</p>}
    </section>
  );
}
