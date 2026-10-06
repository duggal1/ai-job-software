"use client";

import { useRouter } from "next/navigation";
import { AuthDialog } from "@/components/auth-dialog";

export function SignInClient() {
  const router = useRouter();

  return (
    <main className="mx-auto flex w-full max-w-xl flex-col items-center px-6 py-24">
      <h1 className="text-2xl font-normal tracking-tight text-stone-900">Sign in to Fly AI</h1>
      <p className="mt-2 max-w-sm text-center text-[14px] leading-relaxed text-stone-500">
        Use your company email to sign in or create an account. You will post one job at a time — keep it sharp.
      </p>
      <AuthDialog
        open
        onOpenChange={(open) => {
          if (!open) router.push("/");
        }}
        onAuthenticated={() => {
          window.location.href = "/job-post/new";
        }}
      />
    </main>
  );
}
