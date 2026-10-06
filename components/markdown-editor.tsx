"use client";

import { useRef, useState } from "react";
import { TextBoldIcon, TextItalicIcon, Link01Icon, ParagraphBulletsPoint01Icon, ViewIcon } from "hugeicons-react";
import { Button } from "@/components/ui/button";
import { InputGroup, InputGroupAddon, InputGroupTextarea } from "@/components/ui/input-group";
import { Toggle } from "@/components/ui/toggle";
import { MarkdownRenderer } from "@/components/markdown-renderer";

function wrapSelection(value: string, start: number, end: number, before: string, after = before) {
  return value.slice(0, start) + before + value.slice(start, end) + after + value.slice(end);
}

export function MarkdownEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const [preview, setPreview] = useState(false);
  const ref = useRef<HTMLTextAreaElement>(null);

  function applyWrap(before: string, after = before) {
    const el = ref.current;
    if (!el) return;
    onChange(wrapSelection(value, el.selectionStart, el.selectionEnd, before, after));
  }

  function applyBullet() {
    const el = ref.current;
    if (!el) return;
    const lineStart = value.lastIndexOf("\n", el.selectionStart - 1) + 1;
    onChange(`${value.slice(0, lineStart)}- ${value.slice(lineStart)}`);
  }

  return (
    <InputGroup className="rounded-lg border-neutral-200/50 bg-neutral-50/80 shadow-none before:shadow-none">
      <InputGroupAddon
        align="block-start"
        className="gap-1 rounded-t-lg border-b border-neutral-200/50 bg-neutral-100/60 p-2!"
      >
        <Toggle
          aria-label="Bold"
          size="sm"
          onPressedChange={() => applyWrap("**")}
          className="cursor-pointer data-[state=on]:bg-neutral-200/70"
        >
          <TextBoldIcon aria-hidden="true" className="size-3.5" />
        </Toggle>
        <Toggle
          aria-label="Italic"
          size="sm"
          onPressedChange={() => applyWrap("_")}
          className="cursor-pointer data-[state=on]:bg-neutral-200/70"
        >
          <TextItalicIcon aria-hidden="true" className="size-3.5" />
        </Toggle>
        <Button
          aria-label="Bullet list"
          size="icon-sm"
          variant="ghost"
          onClick={applyBullet}
          className="text-neutral-500 hover:text-neutral-800"
        >
          <ParagraphBulletsPoint01Icon aria-hidden="true" className="size-3.5" />
        </Button>
        <Button
          aria-label="Link"
          size="icon-sm"
          variant="ghost"
          onClick={() => applyWrap("[", "](https://)")}
          className="text-neutral-500 hover:text-neutral-800"
        >
          <Link01Icon aria-hidden="true" className="size-3.5" />
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => setPreview((p) => !p)}
          className="ml-auto gap-1.5 text-[12px] text-neutral-500 hover:text-neutral-800"
        >
          <ViewIcon aria-hidden="true" className="size-3.5" />
          {preview ? "Edit" : "Preview"}
        </Button>
      </InputGroupAddon>

      {preview ? (
        <div className="min-h-32 px-3 py-3">
          <MarkdownRenderer content={value || "Nothing to preview yet."} />
        </div>
      ) : (
        <InputGroupTextarea
          ref={ref}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Describe the role, responsibilities, requirements…"
          className="min-h-32 max-h-80 overflow-y-auto border-none bg-transparent text-[14px] leading-relaxed text-neutral-800 placeholder:text-neutral-400 focus-visible:ring-0"
        />
      )}
    </InputGroup>
  );
}
