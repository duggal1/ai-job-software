"use client";

import { useState, useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { draftOutreach, sendOutreach } from "@/lib/actions/outreach";

type Stage = "intent" | "draft" | "sent";

export function GmailIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fill="#4285F4"
        d="M2 6.7 6 9.7v8.8H3.2A1.2 1.2 0 0 1 2 17.3V6.7Z"
      />
      <path
        fill="#34A853"
        d="M22 6.7 18 9.7v8.8h2.8a1.2 1.2 0 0 0 1.2-1.2V6.7Z"
      />
      <path
        fill="#FBBC04"
        d="M6 9.7v8.8h12V9.7L12 14.8 6 9.7Z"
      />
      <path
        fill="#EA4335"
        d="M2 6.7c0-1.6 1.8-2.5 3-1.6L12 10.4l7-5.3c1.2-.9 3 0 3 1.6l-4 3L12 14.8 6 9.7l-4-3Z"
      />
    </svg>
  );
}

const darkChip =
  "inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-stone-900 px-4 py-1.5 text-[13px] font-normal text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.15),inset_0_-1px_0_rgba(0,0,0,0.12)] transition-colors hover:bg-stone-950 disabled:cursor-wait disabled:opacity-60";
const softChip =
  "inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-stone-100 px-4 py-1.5 text-[13px] font-normal text-stone-700 transition-colors hover:bg-stone-200/70 disabled:cursor-not-allowed disabled:opacity-50";

/**
 * "Contact this candidate" flow:
 * intent → AI draft → review/edit → ask AI to refine → send via Resend.
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

  function openDialog() {
    // Every new conversation starts at the intent step. Resetting here (an
    // event, not an effect) keeps the closed dialog inert.
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
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not draft the email.");
      }
    });
  }

  function refine() {
    if (!instruction.trim()) return;
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
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not update the draft.");
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
        setStage("sent");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not send the email.");
      }
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={openDialog}
        className={
          variant === "full"
            ? "inline-flex cursor-pointer items-center gap-2 rounded-lg bg-stone-100 px-5 py-1.5 text-[14px] font-normal text-stone-800 transition-colors hover:bg-stone-200/70"
            : "inline-flex h-7 cursor-pointer items-center gap-1.5 rounded-lg bg-stone-100 px-2.5 text-[12px] font-normal text-stone-700 transition-colors hover:bg-stone-200/70"
        }
      >
        <GmailIcon className={variant === "full" ? "size-4" : "size-3.5"} />
        {label}
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg bg-white">
          <div className="flex items-start justify-between gap-4 px-5 pb-2 pt-5 pr-14">
            <div>
              <DialogTitle className="text-lg tracking-tight text-stone-900">
                {stage === "sent" ? "Email sent" : `Contact ${applicantName}`}
              </DialogTitle>
              <DialogDescription className="mt-1 text-[13px] leading-relaxed text-stone-500">
                {stage === "sent"
                  ? `Your message is on its way${applicantEmail ? ` to ${applicantEmail}` : ""}.`
                  : "Tell AI what you want to say. It writes the first draft using your company profile — then you edit and send."}
              </DialogDescription>
            </div>
          </div>

          <div className="max-h-[65vh] overflow-y-auto px-5 pb-4 pt-3">
            {stage === "sent" ? (
              <div className="flex flex-col items-center gap-3 py-10 text-center">
                <span className="flex size-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                  <svg
                    aria-hidden
                    viewBox="0 0 24 24"
                    className="size-5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="m5 13 4 4L19 7" />
                  </svg>
                </span>
                <p className="max-w-xs text-[13px] leading-relaxed text-stone-500">
                  Sent from your verified Fly AI address with replies going to
                  your inbox.
                </p>
              </div>
            ) : stage === "intent" ? (
              <div className="flex flex-col gap-2">
                <Label
                  htmlFor="outreach-intent"
                  className="text-[13px] font-normal text-stone-600"
                >
                  What do you want to tell {applicantName.split(" ")[0] || "them"}?
                </Label>
                <Textarea
                  id="outreach-intent"
                  value={intent}
                  onChange={(event) => setIntent(event.target.value)}
                  placeholder={
                    jobTitle
                      ? `e.g. Their work on distributed systems stood out. We're hiring for ${jobTitle} and want to set up a 20-minute intro call this week.`
                      : "e.g. Their work stood out. We want to set up a short intro call this week."
                  }
                  className="rounded-lg border-stone-200/60 bg-stone-50/80 text-[14px] text-stone-800 shadow-none focus-visible:ring-1 focus-visible:ring-stone-300"
                />
                <p className="text-[12px] leading-relaxed text-stone-400">
                  Include the role, why they stood out, and the next step. The
                  more specific you are, the better the draft.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label
                    htmlFor="outreach-subject"
                    className="text-[13px] font-normal text-stone-600"
                  >
                    Subject
                  </Label>
                  <Input
                    id="outreach-subject"
                    value={subject}
                    onChange={(event) => setSubject(event.target.value)}
                    className="rounded-lg border-stone-200/60 bg-stone-50/80 text-[14px] text-stone-800 shadow-none focus-visible:ring-1 focus-visible:ring-stone-300"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label
                    htmlFor="outreach-body"
                    className="text-[13px] font-normal text-stone-600"
                  >
                    Message
                  </Label>
                  <Textarea
                    id="outreach-body"
                    value={body}
                    onChange={(event) => setBody(event.target.value)}
                    className="min-h-56 rounded-lg border-stone-200/60 bg-stone-50/80 text-[14px] leading-relaxed text-stone-800 shadow-none focus-visible:ring-1 focus-visible:ring-stone-300"
                  />
                </div>
                <div className="rounded-lg bg-stone-50 px-3 py-3">
                  <Label
                    htmlFor="outreach-instruction"
                    className="text-[12px] font-normal text-stone-500"
                  >
                    Ask AI to improve it
                  </Label>
                  <div className="mt-2 flex items-center gap-2">
                    <Input
                      id="outreach-instruction"
                      value={instruction}
                      onChange={(event) => setInstruction(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" && !event.shiftKey) {
                          event.preventDefault();
                          refine();
                        }
                      }}
                      placeholder="Shorter, warmer, mention their GitHub…"
                      className="rounded-lg border-stone-200/60 bg-white text-[13px] text-stone-800 shadow-none focus-visible:ring-1 focus-visible:ring-stone-300"
                    />
                    <button
                      type="button"
                      onClick={refine}
                      disabled={isGenerating || !instruction.trim()}
                      className={`${softChip} shrink-0 bg-white`}
                    >
                      {isGenerating ? <Spinner className="size-3.5" /> : null}
                      Improve
                    </button>
                  </div>
                </div>
              </div>
            )}

            {error && <p className="mt-3 text-[12px] text-orange-600">{error}</p>}
          </div>

          <div className="flex flex-col-reverse gap-2 border-t border-stone-100 px-5 py-4 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className={softChip}
            >
              {stage === "sent" ? "Close" : "Cancel"}
            </button>
            {stage === "intent" && (
              <button
                type="button"
                onClick={generate}
                disabled={isGenerating || !intent.trim()}
                className={darkChip}
              >
                {isGenerating ? <Spinner className="size-3.5" /> : null}
                {isGenerating ? "Writing…" : "Generate email"}
              </button>
            )}
            {stage === "draft" && (
              <>
                <button
                  type="button"
                  onClick={() => setStage("intent")}
                  disabled={isGenerating || isSending}
                  className={softChip}
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={send}
                  disabled={isGenerating || isSending || !subject.trim() || !body.trim()}
                  className={darkChip}
                >
                  {isSending ? <Spinner className="size-3.5" /> : null}
                  {isSending ? "Sending…" : "Send email"}
                </button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
