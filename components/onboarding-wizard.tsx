"use client";

import { useState, useTransition } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import {
  autofillOnboarding,
  saveOnboarding,
  type OnboardingProfile,
} from "@/lib/actions/onboarding";
import {
  EMPLOYEE_COUNTS,
  INDUSTRIES,
  TALENT_NEEDS,
  type EmployeeCount,
  type Industry,
  type TalentNeed,
} from "@/lib/onboarding-options";

export interface OnboardingInitial {
  name?: string;
  domain?: string;
  employeeCount?: string;
  industry?: string;
  talentNeeds?: string[];
}

const STEPS = [
  { title: "Company", hint: "Name and domain" },
  { title: "Profile", hint: "Size and industry" },
  { title: "Talent", hint: "Who you hire" },
] as const;

const inputClass =
  "rounded-lg border-stone-200/50 bg-stone-50/80 text-[14px] text-stone-800 shadow-none focus-visible:ring-1 focus-visible:ring-stone-300";
const darkChip =
  "inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-stone-900 px-5 py-1.5 text-[13px] font-normal text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.15),inset_0_-1px_0_rgba(0,0,0,0.12)] transition-colors hover:bg-stone-950 disabled:cursor-wait disabled:opacity-60";
const softChip =
  "inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-stone-100 px-4 py-1.5 text-[13px] font-normal text-stone-700 transition-colors hover:bg-stone-200/70 disabled:cursor-not-allowed disabled:opacity-50";

function isDomain(value: string): boolean {
  return /^([a-z0-9-]+\.)+[a-z]{2,}$/i.test(
    value
      .trim()
      .replace(/^https?:\/\//, "")
      .replace(/^www\./, "")
      .replace(/\/.*$/, ""),
  );
}

/**
 * Three-step company onboarding.
 *
 * Every selectable value is fixed vocabulary (no free text for headcount,
 * industry, or talent). AI can pre-fill the entire form from a domain, and
 * the result is always clamped back to the same vocabularies.
 */
export function OnboardingWizard({
  initial,
}: {
  initial: OnboardingInitial;
}) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState(initial.name ?? "");
  const [domain, setDomain] = useState(initial.domain ?? "");
  const [employeeCount, setEmployeeCount] = useState<EmployeeCount | "">(
    EMPLOYEE_COUNTS.includes(initial.employeeCount as EmployeeCount)
      ? (initial.employeeCount as EmployeeCount)
      : "",
  );
  const [industry, setIndustry] = useState<Industry | "">(
    INDUSTRIES.includes(initial.industry as Industry)
      ? (initial.industry as Industry)
      : "",
  );
  const [talentNeeds, setTalentNeeds] = useState<TalentNeed[]>(
    (initial.talentNeeds ?? []).filter((value): value is TalentNeed =>
      TALENT_NEEDS.includes(value as TalentNeed),
    ),
  );

  const [aiDomain, setAiDomain] = useState(initial.domain ?? "");
  const [aiNote, setAiNote] = useState("");
  const [aiError, setAiError] = useState("");
  const [isAiPending, startAi] = useTransition();
  const [error, setError] = useState("");
  const [isSaving, startSave] = useTransition();

  function autofill() {
    setAiError("");
    setAiNote("");
    if (!isDomain(aiDomain)) {
      setAiError("Enter a valid domain, e.g. acme.com");
      return;
    }
    startAi(async () => {
      try {
        const profile = await autofillOnboarding({ domain: aiDomain });
        applyProfile(profile);
        setAiNote(
          `Filled from ${profile.domain}. Check each answer — you can change anything.`,
        );
      } catch (e) {
        setAiError(
          e instanceof Error ? e.message : "Could not read that website.",
        );
      }
    });
  }

  function applyProfile(profile: OnboardingProfile) {
    setName(profile.name);
    setDomain(profile.domain);
    setEmployeeCount(profile.employeeCount);
    setIndustry(profile.industry);
    setTalentNeeds(profile.talentNeeds);
    setAiDomain(profile.domain);
  }

  function validate(current: number): string | null {
    if (current === 0) {
      if (!name.trim()) return "Enter your company name.";
      if (!isDomain(domain)) return "Enter a valid company domain, e.g. acme.com.";
    }
    if (current === 1) {
      if (!employeeCount) return "Select your team size.";
      if (!industry) return "Select your industry.";
    }
    if (current === 2 && talentNeeds.length === 0) {
      return "Pick at least one type of talent you hire.";
    }
    return null;
  }

  function next() {
    const message = validate(step);
    if (message) {
      setError(message);
      return;
    }
    setError("");
    setStep((current) => Math.min(current + 1, STEPS.length - 1));
  }

  function finish() {
    const message = validate(2);
    if (message) {
      setError(message);
      return;
    }
    if (!employeeCount || !industry) {
      setError("Go back and complete your company profile.");
      return;
    }
    setError("");
    startSave(async () => {
      try {
        await saveOnboarding({
          name: name.trim(),
          domain: domain.trim(),
          employeeCount,
          industry,
          talentNeeds,
        });
        // Full reload so server components and cached company data are fresh.
        window.location.href = "/job-post/new";
      } catch (e) {
        setError(
          e instanceof Error ? e.message : "Could not save your company.",
        );
      }
    });
  }

  function addTalent(value: string | null) {
    if (!value) return;
    const talent = value as TalentNeed;
    setTalentNeeds((current) =>
      current.includes(talent) ? current : [...current, talent],
    );
    setError("");
  }

  return (
    <div className="mt-8">
      <ol className="flex items-center gap-3">
        {STEPS.map((item, index) => (
          <li key={item.title} className="flex-1">
            <div className="flex items-center gap-2">
              <span
                className={`flex size-5 shrink-0 items-center justify-center rounded-full text-[11px] ${
                  index < step
                    ? "bg-stone-900 text-white"
                    : index === step
                      ? "bg-stone-900 text-white"
                      : "bg-stone-100 text-stone-400"
                }`}
              >
                {index < step ? (
                  <svg
                    aria-hidden
                    viewBox="0 0 24 24"
                    className="size-3"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="m5 13 4 4L19 7" />
                  </svg>
                ) : (
                  index + 1
                )}
              </span>
              <p
                className={`text-[12px] ${
                  index === step ? "text-stone-900" : "text-stone-400"
                }`}
              >
                {item.title}
              </p>
            </div>
            <div
              className={`mt-2 h-0.5 rounded-full ${
                index <= step ? "bg-stone-900" : "bg-stone-200/70"
              }`}
            />
          </li>
        ))}
      </ol>

      <div className="mt-6 rounded-lg border border-stone-100 bg-stone-50 px-6 py-5">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
            transition={{ duration: 0.16, ease: [0.2, 0.7, 0.3, 1] }}
          >
            {step === 0 && (
              <div className="flex flex-col gap-5">
                <div>
                  <h2 className="text-[15px] font-normal text-stone-900">
                    Your company
                  </h2>
                  <p className="mt-1 text-[13px] leading-relaxed text-stone-500">
                    This appears on every job post and your public careers page.
                  </p>
                </div>

                <div className="rounded-lg bg-white/70 px-3 py-3">
                  <Label
                    htmlFor="onboarding-ai-domain"
                    className="text-[12px] font-normal text-stone-500"
                  >
                    Autofill everything from your website
                  </Label>
                  <div className="mt-2 flex items-center gap-2">
                    <Input
                      id="onboarding-ai-domain"
                      value={aiDomain}
                      onChange={(event) => setAiDomain(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          autofill();
                        }
                      }}
                      placeholder="acme.com"
                      className="rounded-lg border-stone-200/60 bg-white text-[13px] text-stone-800 shadow-none focus-visible:ring-1 focus-visible:ring-stone-300"
                    />
                    <button
                      type="button"
                      onClick={autofill}
                      disabled={isAiPending}
                      className={`${darkChip} shrink-0`}
                    >
                      {isAiPending ? <Spinner className="size-3.5" /> : null}
                      {isAiPending ? "Reading…" : "Autofill with AI"}
                    </button>
                  </div>
                  {aiNote && (
                    <p className="mt-2 text-[11px] text-emerald-700">{aiNote}</p>
                  )}
                  {aiError && (
                    <p className="mt-2 text-[11px] text-orange-600">{aiError}</p>
                  )}
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label
                    htmlFor="onboarding-name"
                    className="text-[13px] font-normal text-stone-600"
                  >
                    Company name
                  </Label>
                  <Input
                    id="onboarding-name"
                    value={name}
                    onChange={(event) => {
                      setName(event.target.value);
                      setError("");
                    }}
                    placeholder="Acme"
                    className={inputClass}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label
                    htmlFor="onboarding-domain"
                    className="text-[13px] font-normal text-stone-600"
                  >
                    Company domain
                  </Label>
                  <Input
                    id="onboarding-domain"
                    value={domain}
                    onChange={(event) => {
                      setDomain(event.target.value);
                      setError("");
                    }}
                    placeholder="acme.com"
                    className={inputClass}
                  />
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="flex flex-col gap-5">
                <div>
                  <h2 className="text-[15px] font-normal text-stone-900">
                    Company profile
                  </h2>
                  <p className="mt-1 text-[13px] leading-relaxed text-stone-500">
                    Helps candidates understand the stage and shape of the team.
                  </p>
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label className="text-[13px] font-normal text-stone-600">
                    How many employees?
                  </Label>
                  <Select
                    value={employeeCount}
                    onValueChange={(value) => {
                      if (
                        EMPLOYEE_COUNTS.includes(value as EmployeeCount)
                      ) {
                        setEmployeeCount(value as EmployeeCount);
                        setError("");
                      }
                    }}
                  >
                    <SelectTrigger className={inputClass}>
                      <SelectValue placeholder="Select team size" />
                    </SelectTrigger>
                    <SelectContent>
                      {EMPLOYEE_COUNTS.map((count) => (
                        <SelectItem key={count} value={count}>
                          {count} employees
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label className="text-[13px] font-normal text-stone-600">
                    Industry
                  </Label>
                  <Select
                    value={industry}
                    onValueChange={(value) => {
                      if (INDUSTRIES.includes(value as Industry)) {
                        setIndustry(value as Industry);
                        setError("");
                      }
                    }}
                  >
                    <SelectTrigger className={inputClass}>
                      <SelectValue placeholder="Select industry" />
                    </SelectTrigger>
                    <SelectContent>
                      {INDUSTRIES.map((value) => (
                        <SelectItem key={value} value={value}>
                          {value}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="flex flex-col gap-5">
                <div>
                  <h2 className="text-[15px] font-normal text-stone-900">
                    Talent you hire
                  </h2>
                  <p className="mt-1 text-[13px] leading-relaxed text-stone-500">
                    Pick at least one. This shapes which candidates and roles we
                    surface for you.
                  </p>
                </div>

                <div className="flex flex-col gap-2">
                  <Label className="text-[13px] font-normal text-stone-600">
                    Types of talent
                  </Label>
                  <Select value="" onValueChange={addTalent}>
                    <SelectTrigger className={inputClass}>
                      <SelectValue placeholder="Add a talent type" />
                    </SelectTrigger>
                    <SelectContent>
                      {TALENT_NEEDS.map((talent) => (
                        <SelectItem
                          key={talent}
                          value={talent}
                          disabled={talentNeeds.includes(talent)}
                        >
                          {talent}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {talentNeeds.length > 0 ? (
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {talentNeeds.map((talent) => (
                        <span
                          key={talent}
                          className="inline-flex items-center gap-1.5 rounded-md bg-white px-2 py-1 text-[12px] text-stone-700"
                        >
                          {talent}
                          <button
                            type="button"
                            aria-label={`Remove ${talent}`}
                            onClick={() => {
                              setTalentNeeds((current) =>
                                current.filter((value) => value !== talent),
                              );
                              setError("");
                            }}
                            className="cursor-pointer rounded-sm p-0.5 text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-700"
                          >
                            <svg
                              aria-hidden
                              viewBox="0 0 24 24"
                              className="size-3"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.8"
                              strokeLinecap="round"
                            >
                              <path d="M18 6 6 18" />
                              <path d="m6 6 12 12" />
                            </svg>
                          </button>
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[12px] text-stone-400">
                      Nothing selected yet.
                    </p>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {error && <p className="mt-4 text-[12px] text-orange-600">{error}</p>}

        <div className="mt-6 flex items-center justify-between gap-3 border-t border-stone-200/60 pt-4">
          <button
            type="button"
            onClick={() => {
              setError("");
              setStep((current) => Math.max(0, current - 1));
            }}
            disabled={step === 0 || isSaving}
            className={`${softChip} ${step === 0 ? "invisible" : ""}`}
          >
            Back
          </button>
          {step < STEPS.length - 1 ? (
            <button type="button" onClick={next} className={darkChip}>
              Continue
            </button>
          ) : (
            <button
              type="button"
              onClick={finish}
              disabled={isSaving}
              className={darkChip}
            >
              {isSaving ? <Spinner className="size-3.5" /> : null}
              {isSaving ? "Saving…" : "Finish onboarding"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
