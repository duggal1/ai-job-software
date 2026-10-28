"use client";

import { useState, useTransition } from "react";
import { aiEditJobPost, type JobPostAiDraft } from "@/lib/actions/posts";
import { Spinner } from "@/components/ui/spinner";
import { SparkIcon } from "@/components/ai-mark";

const HINTS = [
  "Make it shorter",
  "Sharpen the opening",
  "Tighten the scope",
] as const;

const chip =
  "inline-flex h-8 shrink-0 items-center gap-1.5 rounded-md px-2 text-[12px] font-normal transition-colors";
const chipDark = `${chip} bg-stone-900 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.15),inset_0_-1px_0_rgba(0,0,0,0.12)]`;
const chipMuted = `${chip} bg-stone-200 text-stone-400 shadow-none`;

/**
 * One-line prompt for AI edits.
 *
 * Deliberately not a card: it reads as a margin note above the post, with the
 * action sitting inside the field it acts on. State lives here so typing an
 * instruction never re-renders the whole editor below.
 *
 * `current` is a snapshot from the parent. On success the draft is handed back
 * for review; nothing is persisted until Save.
 */
export function AiEditComposer({
  postId,
  current,
  onDraft,
}: {
  postId: string;
  current: JobPostAiDraft;
  onDraft: (draft: JobPostAiDraft) => void;
}) {
  const [instruction, setInstruction] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const blank = !instruction.trim();
  const buttonClass = isPending
    ? `${chipDark} cursor-wait`
    : blank
      ? `${chipMuted} cursor-not-allowed`
      : `${chipDark} cursor-pointer hover:bg-stone-950`;

  function ask() {
    const text = instruction.trim();
    if (!text || isPending) return;
    setError("");
    setNote("");
    startTransition(async () => {
      try {
        const draft = await aiEditJobPost({
          postId,
          instruction: text,
          current,
        });
        onDraft(draft);
        setInstruction("");
        setNote("Draft updated. Review it, then save.");
      } catch (cause) {
        setError(
          cause instanceof Error ? cause.message : "AI could not edit this post.",
        );
      }
    });
  }

  return (
    <section aria-label="AI edit" className="border-y border-stone-100 py-5">
      <div className="flex items-baseline gap-2">
        <SparkIcon className="size-3.5 shrink-0 translate-y-px text-orange-600" />
        <h2 className="text-[13px] font-normal text-stone-800">
          Ask AI to edit
        </h2>
        <span className="ml-auto text-[11px] text-stone-400">Draft only</span>
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          ask();
        }}
        className="mt-3 flex h-10 items-center gap-2 rounded-lg border border-stone-200/60 bg-stone-50/80 pl-3.5 pr-1.5 transition-colors focus-within:border-stone-300 focus-within:bg-white"
      >
        <input
          value={instruction}
          onChange={(event) => {
            setInstruction(event.target.value);
            if (note) setNote("");
            if (error) setError("");
          }}
          placeholder="What should change?"
          aria-label="Instruction for AI"
          aria-describedby="ai-edit-hint"
          className="min-w-0 flex-1 border-0 bg-transparent p-0 text-[13px] font-normal text-stone-800 outline-none placeholder:text-stone-400"
        />
        <button
          type="submit"
          disabled={isPending || blank}
          aria-busy={isPending}
          className={buttonClass}
        >
          {isPending ? (
            <Spinner className="size-3.5 text-stone-300" />
          ) : (
            <SparkIcon
              className={`size-3.5 ${blank ? "text-stone-400" : "text-orange-300"}`}
            />
          )}
          <span className="leading-none">Ask AI</span>
        </button>
      </form>

      {/*
        One line, three occupants: suggestions, then confirmation, then error.
        The row is always present, so the editor below never shifts when the
        answer lands.
      */}
      <div
        id="ai-edit-hint"
        aria-live="polite"
        className="mt-2 flex min-h-4 flex-wrap items-center gap-x-4 gap-y-1 text-[11px]"
      >
        {error ? (
          <span className="text-orange-600">{error}</span>
        ) : note ? (
          <span className="flex items-center gap-1.5 text-stone-500">
            <span aria-hidden className="size-1 rounded-full bg-orange-500" />
            {note}
          </span>
        ) : (
          <>
            <span className="text-stone-400">Try</span>
            {HINTS.map((hint) => (
              <button
                key={hint}
                type="button"
                onClick={() => setInstruction(hint)}
                className="cursor-pointer text-stone-500 underline decoration-stone-300 decoration-dotted underline-offset-2 transition-colors hover:text-stone-800"
              >
                {hint}
              </button>
            ))}
          </>
        )}
      </div>
    </section>
  );
}
