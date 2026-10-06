"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ProfileNameForm({
  initialName,
  email,
}: {
  initialName: string;
  email: string;
}) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Enter your name");
      return;
    }
    setError("");
    setSaved(false);
    startTransition(async () => {
      try {
        await authClient.updateUser({ name: trimmed });
        setSaved(true);
        router.refresh();
      } catch {
        setError("Could not save your name. Please try again.");
      }
    });
  }

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor="profile-name" className="text-[13px] font-normal text-stone-600">
        Name
      </Label>
      <div className="flex items-center gap-2">
        <Input
          id="profile-name"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (error) setError("");
            if (saved) setSaved(false);
          }}
          placeholder="Ada Lovelace"
          className="rounded-lg border-stone-200/50 bg-stone-50/80 text-[14px] text-stone-800 shadow-none focus-visible:ring-1 focus-visible:ring-stone-300"
        />
        <button
          type="button"
          disabled={isPending}
          onClick={handleSave}
          className="shrink-0 cursor-pointer rounded-lg bg-stone-900 px-4 py-1 text-[13px] font-normal text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.15),inset_0_-1px_0_rgba(0,0,0,0.12)] hover:bg-stone-950 disabled:opacity-60"
        >
          {isPending ? "Saving…" : "Save"}
        </button>
      </div>
      <p className="text-[12px] text-stone-400">{email}</p>
      {error && <p className="text-[11px] text-orange-600">{error}</p>}
      {saved && !error && (
        <p className="text-[11px] text-stone-500">Saved.</p>
      )}
    </div>
  );
}
