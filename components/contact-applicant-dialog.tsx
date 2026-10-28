"use client";

import { useState, useTransition } from "react";
import { motion, useReducedMotion } from "motion/react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { SparkIcon } from "@/components/ai-mark";
import { useToast } from "@/components/toast-provider";
import { draftOutreach, sendOutreach } from "@/lib/actions/outreach";

type Stage = "intent" | "draft";

/**
 * Official Gmail mark (2020), five paths, untouched geometry.
 * Brand colour is the one place a non-product accent is allowed: it identifies
 * the channel, not the action.
 */
export function GmailIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="52 42 88 66"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      shapeRendering="geometricPrecision"
    >
      <path
        fill="#4285f4"
        d="M58 108h14V74L52 59v43c0 3.32 2.69 6 6 6"
      />
      <path
        fill="#34a853"
        d="M120 108h14c3.32 0 6-2.69 6-6V59l-20 15"
      />
      <path
        fill="#fbbc04"
        d="M120 48v26l20-15v-8c0-7.42-8.47-11.65-14.4-7.2"
      />
      <path fill="#ea4335" d="M72 74V48l24 18 24-18v26L96 92" />
      <path
        fill="#c5221f"
        d="M52 51v8l20 15V48l-5.6-4.2c-5.94-4.45-14.4-.22-14.4 7.2"
      />
    </svg>
  );
}

const STARTERS = [
  {
    label: "Intro call",
    text: "Their application stood out. Ask for a 20-minute intro call this week.",
  },
  {
    label: "Their work",
    text: "Reference one specific project from their application and ask how they approached it.",
  },
  {
    label: "The role",
    text: "Explain what the role owns, why it is open now, and ask if they want the full brief.",
  },
] as const;

const primaryButton =
  "inline-flex h-8 min-w-[112px] items-center justify-center gap-1.5 rounded-lg px-3 text-[12px] font-normal transition-colors";
const primaryActive = `${primaryButton} cursor-pointer bg-stone-900 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.15),inset_0_-1px_0_rgba(0,0,0,0.12)] hover:bg-stone-950`;
const primaryBusy = `${primaryButton} cursor-wait bg-stone-900 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.15),inset_0_-1px_0_rgba(0,0,0,0.12)]`;
const primaryMuted = `${primaryButton} cursor-not-allowed bg-stone-200 text-stone-400 shadow-none`;

const quietLink =
  "cursor-pointer text-[12px] font-normal text-stone-500 underline decoration-stone-300 decoration-dotted underline-offset-4 transition-colors hover:text-stone-800";

/**
 * Founder-to-candidate email.
 *
 * Three states, one surface: intent → draft → sent. The dialog is a writing
 * surface, not a settings form — metadata sits on hairlines, the message gets
 * the space, and AI is a single line at the bottom of the draft.
 *
 * The applicant id is the only trust boundary the client sends; the server
 * re-checks company ownership on both draft and send.
 */
export function ContactApplicantDialog({
  applicantId,
  applicantName,
  applicantEmail,
  jobTitle,
  variant = "compact",
  label = "Contact",
}: {
  applicantId: string;
  applicantName: string;
  applicantEmail?: string;
  jobTitle?: string;
  variant?: "compact" | "full";
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const [stage, setStage] = useState<Stage>("intent");
  const [intent, setIntent] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [instruction, setInstruction] = useState("");
  const [error, setError] = useState("");
  const [isGenerating, startGenerating] = useTransition();
  const [isSending, startSending] = useTransition();
  const reduceMotion = useReducedMotion();
  const { push } = useToast();

  const firstName = applicantName.split(" ")[0] || "them";

  function openDialog() {
    setStage("intent");
    setIntent("");
    setSubject("");
    setBody("");
    setInstruction("");
    setError("");
    setOpen(true);
  }

  function generate() {
    if (!intent.trim()) {
      setError("Tell us what you want to say first.");
      return;
    }
    setError("");
    startGenerating(async () => {
      try {
        const draft = await draftOutreach({
          applicantId,
          intent: intent.trim(),
        });
        setSubject(draft.subject);
        setBody(draft.body);
        setStage("draft");
      } catch (cause) {
        setError(
          cause instanceof Error ? cause.message : "Could not draft the email.",
        );
      }
    });
  }

  function refine() {
    if (!instruction.trim() || isGenerating) return;
    setError("");
    startGenerating(async () => {
      try {
        const draft = await draftOutreach({
          applicantId,
          intent: intent.trim(),
          currentDraft: { subject, body },
          instruction: instruction.trim(),
        });
        setSubject(draft.subject);
        setBody(draft.body);
        setInstruction("");
      } catch (cause) {
        setError(
          cause instanceof Error ? cause.message : "Could not update the draft.",
        );
      }
    });
  }

  function send() {
    if (!subject.trim() || !body.trim()) {
      setError("Add a subject and a message before sending.");
      return;
    }
    setError("");
    startSending(async () => {
      try {
        await sendOutreach({ applicantId, subject, body });
        setOpen(false);
        push({
          title: "Email sent",
          body: `On its way to ${firstName}. Replies land in your inbox.`,
        });
      } catch (cause) {
        setError(
          cause instanceof Error ? cause.message : "Could not send the email.",
        );
      }
    });
  }

  const title =
    stage === "intent"
      ? `What should we tell ${firstName}?`
      : "Review before sending.";

  const description =
    stage === "intent"
      ? "Two sentences in. AI writes the rest from your company profile — you edit every word before it sends."
      : `To ${applicantEmail ?? applicantName}. Edit anything before it sends; replies come straight back to you.`;

  const canWrite = intent.trim().length > 0;
  const canSend = subject.trim().length > 0 && body.trim().length > 0;

  return (
    <>
      <button
        type="button"
        onClick={openDialog}
        aria-haspopup="dialog"
        className={
          variant === "full"
            ? "inline-flex cursor-pointer items-center gap-2 rounded-lg bg-stone-100 px-4 py-1.5 text-[14px] font-normal text-stone-800 transition-colors hover:bg-stone-200/70"
            : "inline-flex h-7 cursor-pointer items-center gap-1.5 rounded-md bg-stone-100/80 px-2 text-[12px] font-normal text-stone-600 transition-colors hover:bg-stone-200/60 hover:text-stone-900"
        }
      >
        <GmailIcon className={variant === "full" ? "size-4" : "size-3.5"} />
        <span className="leading-none">{label}</span>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-[640px] gap-0 overflow-hidden rounded-2xl border-stone-200/70 bg-white p-0">
          <div className="px-8 pb-5 pr-14 pt-6">
            <div className="flex items-center gap-2 text-[11px] text-stone-400">
              <GmailIcon className="size-3.5" />
              <span>New email</span>
              <span aria-hidden className="size-0.5 rounded-full bg-stone-300" />
              <span className="truncate">{applicantName}</span>
            </div>
            <DialogTitle className="mt-3 text-xl leading-tight tracking-tight text-stone-900">
              {title}
            </DialogTitle>
            <DialogDescription className="mt-2 max-w-[52ch] text-[13px] leading-relaxed text-stone-500">
              {description}
            </DialogDescription>
          </div>

          <div className="max-h-[62vh] overflow-y-auto">
            <motion.div
              key={stage}
              initial={reduceMotion ? false : { opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
              className="px-8"
            >
              {stage === "intent" ? (
                <div className="flex min-h-[430px] flex-col pb-6">
                  <textarea
                    autoFocus
                    value={intent}
                    onChange={(event) => setIntent(event.target.value)}
                    onKeyDown={(event) => {
                      if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
                        event.preventDefault();
                        generate();
                      }
                    }}
                    aria-label="What the email should say"
                    placeholder={
                      jobTitle
                        ? `e.g. Their work on evals stood out. We're hiring for ${jobTitle} and want a 20-minute call this week.`
                        : "e.g. Their application stood out. Ask for a short intro call this week."
                    }
                    className="min-h-[220px] w-full flex-1 resize-none border-0 bg-transparent p-0 text-[15px] leading-relaxed text-stone-800 outline-none placeholder:text-stone-400"
                  />

                  <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5">
                    <span className="text-[11px] text-stone-400">Start with</span>
                    {STARTERS.map((starter) => (
                      <button
                        key={starter.label}
                        type="button"
                        onClick={() => setIntent(starter.text)}
                        className="cursor-pointer text-[11px] text-stone-500 underline decoration-stone-300 decoration-dotted underline-offset-2 transition-colors hover:text-stone-800"
                      >
                        {starter.label}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex min-h-[430px] flex-col pb-2">
                  <div className="flex items-baseline gap-4 border-b border-stone-100 py-3">
                    <span className="w-14 shrink-0 text-[11px] text-stone-400">
                      To
                    </span>
                    <span className="truncate text-[13px] text-stone-800">
                      {applicantEmail ?? "Applicant"}
                    </span>
                  </div>

                  <div className="flex items-baseline gap-4 border-b border-stone-100 py-3 transition-colors focus-within:border-stone-200">
                    <label
                      htmlFor="outreach-subject"
                      className="w-14 shrink-0 text-[11px] text-stone-400"
                    >
                      Subject
                    </label>
                    <input
                      id="outreach-subject"
                      autoFocus
                      value={subject}
                      onChange={(event) => setSubject(event.target.value)}
                      readOnly={isGenerating || isSending}
                      className="min-w-0 flex-1 border-0 bg-transparent p-0 text-[14px] font-normal text-stone-900 outline-none"
                    />
                  </div>

                  <textarea
                    value={body}
                    onChange={(event) => setBody(event.target.value)}
                    readOnly={isGenerating || isSending}
                    aria-label="Email body"
                    className="mt-4 min-h-[280px] w-full flex-1 resize-none border-0 bg-transparent p-0 text-[14px] leading-[1.7] text-stone-700 outline-none"
                  />

                  <div className="flex items-center gap-2 border-t border-stone-100 py-3">
                    <SparkIcon className="size-3.5 shrink-0 text-orange-600" />
                    <input
                      value={instruction}
                      onChange={(event) => setInstruction(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" && !event.shiftKey) {
                          event.preventDefault();
                          refine();
                        }
                      }}
                      aria-label="Instruction to refine the email"
                      placeholder="Refine: warmer, shorter, mention their GitHub…"
                      className="min-w-0 flex-1 border-0 bg-transparent p-0 text-[12px] text-stone-700 outline-none placeholder:text-stone-400"
                    />
                    <button
                      type="button"
                      onClick={refine}
                      disabled={isGenerating || !instruction.trim()}
                      className="inline-flex h-6 min-w-[64px] shrink-0 cursor-pointer items-center justify-end gap-1.5 rounded-md px-2 text-[11px] font-normal text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-800 disabled:cursor-not-allowed disabled:text-stone-300 disabled:hover:bg-transparent"
                    >
                      {isGenerating ? <Spinner className="size-3" /> : null}
                      Refine
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>

          {error && (
            <p
              role="alert"
              className="px-8 pt-3 text-[11px] leading-relaxed text-orange-600"
            >
              {error}
            </p>
          )}

          <div className="flex items-center justify-between gap-3 border-t border-stone-100 px-8 py-4">
            {stage === "draft" ? (
              <button
                type="button"
                onClick={() => {
                  setStage("intent");
                  setError("");
                }}
                disabled={isGenerating || isSending}
                className={`${quietLink} disabled:opacity-40`}
              >
                Start over
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setOpen(false)}
                className={quietLink}
              >
                Cancel
              </button>
            )}

            {stage === "intent" && (
              <button
                type="button"
                onClick={generate}
                disabled={isGenerating || !canWrite}
                className={
                  isGenerating
                    ? primaryBusy
                    : canWrite
                      ? primaryActive
                      : primaryMuted
                }
              >
                {isGenerating ? (
                  <Spinner className="size-3.5 text-stone-300" />
                ) : (
                  <SparkIcon
                    className={`size-3.5 ${canWrite ? "text-orange-300" : "text-stone-400"}`}
                  />
                )}
                {isGenerating ? "Writing…" : "Write draft"}
              </button>
            )}

            {stage === "draft" && (
              <button
                type="button"
                onClick={send}
                disabled={isGenerating || isSending || !canSend}
                className={
                  isSending
                    ? primaryBusy
                    : isGenerating || !canSend
                      ? primaryMuted
                      : primaryActive
                }
              >
                {isSending ? <Spinner className="size-3.5 text-stone-300" /> : null}
                {isSending ? "Sending…" : "Send email"}
              </button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
