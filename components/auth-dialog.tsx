"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Dialog,
  DialogBackdrop,
  DialogClose,
  DialogPortal,
  DialogPrimitive,
  DialogViewport,
} from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import {
  OTPField,
  OTPFieldInput,
  OTPFieldSeparator,
} from "@/components/ui/otp-field";
import { emailSchema, otpSchema } from "@/lib/validation";
import { authClient } from "@/lib/auth-client";

interface AuthDialogProps {
  onOpenChange?: (open: boolean) => void;
  open?: boolean;
  onAuthenticated?: () => void;
}

const OTP_LENGTH = 6;
const GROUP_LENGTH = 3;

const OTP_SLOT_KEYS = Array.from({ length: OTP_LENGTH }, (_, i) => `otp-slot-${i}`);

export function AuthDialog({ open, onOpenChange, onAuthenticated }: AuthDialogProps) {
  const [email, setEmail] = useState("");
  const [step, setStep] = useState<"email" | "otp">("email");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [otpValue, setOtpValue] = useState("");

  function isValidEmail(value: string): boolean {
    return emailSchema.safeParse({ email: value }).success;
  }

  async function handleSendOtp() {
    const trimmed = email.trim();
    if (!trimmed || !isValidEmail(trimmed)) {
      setError("Enter a valid email address");
      return;
    }
    setError("");
    setIsLoading(true);
    try {
      // Use the Better Auth client (not raw fetch) so endpoint atom signals
      // fire and `useSession` refetches everywhere (navbar, hero, etc).
      const { error } = await authClient.emailOtp.sendVerificationOtp({
        email: trimmed,
        type: "sign-in",
      });
      if (error) {
        setError(error.message ?? "Failed to send code");
        return;
      }
      setStep("otp");
    } catch {
      setError("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleVerifyOtp(otp: string) {
    const parsed = otpSchema.safeParse({ otp });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Invalid code");
      return;
    }
    setOtpValue(otp);
setIsLoading(true);
      setError("");
      try {
        // `signIn.emailOtp` triggers the email-otp plugin's `$sessionSignal`,
        // so every `useSession` hook re-renders with the new session
        // immediately — no stale logged-out navbar.
        const { error } = await authClient.signIn.emailOtp(
          {
            email: email.trim(),
            otp,
          },
          {
            onSuccess: async () => {
              // Belt-and-braces: force the session atom to refetch now so the
              // navbar flips to Dashboard/Applicants before navigation.
              await authClient.getSession({ query: { disableCookieCache: true } });
            },
          },
        );
      if (error) {
        setError(error.message ?? "Wrong code");
        return;
      }
      onAuthenticated?.();
      onOpenChange?.(false);
      setStep("email");
      setEmail("");
      setOtpValue("");
    } catch {
      setError("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogPortal>
        <DialogBackdrop />
        <DialogViewport>
          <DialogPrimitive.Popup className="relative row-start-2 flex w-full max-w-sm flex-col rounded-xl bg-zinc-50 px-8 py-14 outline-none transition-all duration-200 data-starting-style:scale-95 data-starting-style:opacity-0 data-ending-style:scale-95 data-ending-style:opacity-0 dark:bg-zinc-900">
            <DialogClose className="absolute top-3 right-3 flex size-8 cursor-pointer items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-200/70 hover:text-zinc-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-300">
              <svg fill="none" height="15" viewBox="0 0 16 16" width="15">
                <path
                  d="M4 4L12 12M12 4L4 12"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeWidth="1.5"
                />
              </svg>
            </DialogClose>

            <div className="flex flex-col items-start">
              <Image
                alt="Fly AI"
                src="/logo.svg"
                width={22}
                height={22}
              />
              <div className="mt-5 space-y-1">
                <h2 className="text-[22px] font-normal tracking-tight text-zinc-950 dark:text-zinc-50">
                  {step === "email" ? "Sign in" : "Check your email"}
                </h2>
                <p className="text-[22px] leading-6 text-zinc-400 dark:text-zinc-500">
                  {step === "email"
                    ? "Enter your email to get started"
                    : `We sent a code to ${email}`}
                </p>
              </div>
            </div>

            <div className="mt-10">
              {step === "email" ? (
                <div className="flex flex-col gap-4">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (error) setError("");
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSendOtp();
                    }}
                    placeholder="you@example.com"
                    className="w-full rounded-lg border border-stone-200/70 bg-stone-100/70 px-4 py-2 text-sm text-stone-700 outline-none transition-colors placeholder:text-stone-400 focus-visible:ring-1 focus-visible:ring-stone-200 focus-visible:ring-offset-0"
                    autoFocus
                  />
                  <button
                    type="button"
                    disabled={isLoading}
                    onClick={handleSendOtp}
                    className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-stone-200/75 bg-stone-900 px-7 py-2 text-sm font-normal text-white transition-all hover:underline hover:underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-200 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {isLoading && <Spinner color="white" size={16} />}
                    {isLoading ? "Sending code..." : "Continue with email"}
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4">
                  <OTPField
                    length={OTP_LENGTH}
                    value={otpValue}
                    onValueChange={(v: string) => {
                      setOtpValue(v);
                      if (error) setError("");
                    }}
                    onValueComplete={handleVerifyOtp}
                  >
                    {OTP_SLOT_KEYS.slice(0, GROUP_LENGTH).map((slotKey, index) => (
                      <OTPFieldInput
                        key={slotKey}
                        aria-label={index === 0 ? undefined : `Character ${index + 1} of ${OTP_LENGTH}`}
                      />
                    ))}
                    <OTPFieldSeparator />
                    {OTP_SLOT_KEYS.slice(GROUP_LENGTH).map((slotKey, index) => (
                      <OTPFieldInput
                        key={slotKey}
                        aria-label={`Character ${index + GROUP_LENGTH + 1} of ${OTP_LENGTH}`}
                      />
                    ))}
                  </OTPField>
                  {isLoading && <Spinner color="currentColor" size={18} />}
                  <button
                    type="button"
                    onClick={() => {
                      setStep("email");
                      setError("");
                      setOtpValue("");
                    }}
                    className="text-sm text-zinc-500 underline underline-offset-2 transition-colors hover:text-zinc-700 cursor-pointer"
                  >
                    Use a different email
                  </button>
                </div>
              )}
            </div>

            {error && (
              <p className="mt-4 text-sm text-red-500">{error}</p>
            )}

            <div className="mt-12 flex items-start gap-2 pt-5 text-[14px] leading-relaxed text-zinc-500 dark:border-zinc-800 dark:text-zinc-500">
              <Image alt="Lock" src="/lock.svg" height="16" width="16" className="mt-0.5 dark:invert" />
              <span>
                Your data is extremely important to us. It is{" "}
                <u className="text-zinc-600 underline decoration-zinc-600 dark:text-zinc-400 dark:decoration-zinc-400">
                  safe and secure
                </u>
              </span>
            </div>
          </DialogPrimitive.Popup>
        </DialogViewport>
      </DialogPortal>
    </Dialog>
  );
}
