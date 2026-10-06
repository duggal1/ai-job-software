"use client";

import { useState, useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { AppleIntelligenceIcon } from "hugeicons-react";
import { autofillJobPost } from "@/lib/actions/autofill";
import type { AutofillResult } from "@/lib/actions/autofill";

interface AiAutofillDialogProps {
  onAutofill: (data: AutofillResult) => void;
}

export function AiAutofillDialog({ onAutofill }: AiAutofillDialogProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [url, setUrl] = useState("");
  const [promptText, setPromptText] = useState("");
  const [error, setError] = useState("");
  const [urlError, setUrlError] = useState("");

  const handleGenerate = () => {
    const trimmedUrl = url.trim();
    if (!trimmedUrl) {
      setUrlError("URL is required");
      return;
    }
    try {
      const parsed = new URL(trimmedUrl.startsWith("http") ? trimmedUrl : `https://${trimmedUrl}`);
      if (!parsed.hostname.includes(".")) {
        setUrlError("Enter a valid URL");
        return;
      }
    } catch {
      setUrlError("Enter a valid URL");
      return;
    }
    setUrlError("");

    const trimmedPrompt = promptText.trim();
    if (!trimmedPrompt) {
      setError("Describe the role you want to generate");
      return;
    }
    setError("");

    startTransition(async () => {
      try {
        const result = await autofillJobPost(trimmedUrl, trimmedPrompt);
        onAutofill(result);
        setOpen(false);
        setUrl("");
        setPromptText("");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to generate");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="group flex shrink-0 cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-lg border border-stone-100 bg-stone-50 px-4 py-1 text-[13px] font-normal text-stone-600 transition-all hover:border-stone-200 hover:bg-stone-100/70">
        <AppleIntelligenceIcon className="size-4 text-orange-600" />
        <span className="transition-all group-hover:underline group-hover:underline-offset-2 group-hover:decoration-stone-800">
          AI Autofill
        </span>
      </DialogTrigger>
      <DialogContent
        closeProps={{
          className: "absolute inset-e-2 top-2 rounded-lg bg-stone-100 p-1.5",
        }}
        className="rounded-xl border border-stone-200/50 bg-stone-50 sm:max-w-md"
      >
        <DialogHeader>
          <DialogTitle className="text-[15px] font-normal tracking-tight text-stone-900">
            AI autofill
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-5 px-6 pb-8">
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-normal text-stone-600">
              Website URL
            </label>
            <Input
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                if (urlError) setUrlError("");
              }}
              placeholder="acme.com"
              className="rounded-lg border border-stone-200 bg-stone-100/80 text-[14px] text-stone-800 shadow-none focus-visible:ring-1 focus-visible:ring-stone-300"
            />
            {urlError && <p className="text-[11px] text-orange-600">{urlError}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-normal text-stone-600">
              Describe the role
            </label>
            <textarea
              value={promptText}
              onChange={(e) => {
                setPromptText(e.target.value);
                if (error) setError("");
              }}
              placeholder="Senior software engineer with 3+ years of React experience..."
              rows={4}
              className="block w-full resize-none overflow-y-auto rounded-lg border border-stone-200 bg-stone-100/80 px-3 py-1.5 text-[14px] text-stone-800 shadow-none outline-none transition-colors focus-visible:ring-1 focus-visible:ring-stone-300"
            />
            {error && <p className="text-[11px] text-orange-600">{error}</p>}
          </div>

          <Button
            type="button"
            disabled={isPending}
            onClick={handleGenerate}
            className="flex w-fit cursor-pointer items-center gap-2 rounded-lg bg-stone-900 px-5 py-1 text-[14px] font-normal text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.15),inset_0_-1px_0_rgba(0,0,0,0.12)] transition-all hover:bg-stone-950 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending ? (
              <>
                <Spinner className="size-4" />
                Generating…
              </>
            ) : (
              "Generate"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
