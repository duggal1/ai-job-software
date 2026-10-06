"use client";

import Markdown from "react-markdown";
import type { Components } from "react-markdown";

const components: Components = {
  h1: ({ children }) => (
    <h1 className="text-lg font-normal tracking-tight text-stone-900 antialiased">{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 className="text-base font-normal tracking-tight text-stone-900 antialiased">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-[15px] font-normal tracking-tight text-stone-800 antialiased">{children}</h3>
  ),
  h4: ({ children }) => (
    <h4 className="text-[14px] font-normal tracking-tight text-stone-800 antialiased">{children}</h4>
  ),
  h5: ({ children }) => (
    <h5 className="text-[13px] font-normal tracking-tight text-stone-700 antialiased">{children}</h5>
  ),
  h6: ({ children }) => (
    <h6 className="text-[12px] font-normal tracking-tight text-stone-600 antialiased">{children}</h6>
  ),
  p: ({ children }) => (
    <p className="text-[15px] font-normal leading-relaxed text-stone-600 antialiased">{children}</p>
  ),
  ul: ({ children }) => <ul className="flex flex-col gap-1.5 antialiased">{children}</ul>,
  ol: ({ children }) => <ol className="flex flex-col gap-1.5 antialiased">{children}</ol>,
  li: (props) => {
    const { children } = props;
    const ordered = "ordered" in props && typeof props.ordered === "boolean" ? props.ordered : false;
    const index = "index" in props && typeof props.index === "number" ? props.index : undefined;
    if (ordered) {
      return (
        <li className="flex items-start gap-2 text-[15px] font-normal leading-relaxed text-stone-600 antialiased">
          <span className="mt-0.5 inline-flex size-4.5 shrink-0 items-center justify-center rounded bg-stone-100 font-mono text-[11px] text-stone-500 antialiased">
            {(index ?? 0) + 1}
          </span>
          <span>{children}</span>
        </li>
      );
    }
    return (
      <li className="flex items-start gap-2.5 text-[15px] font-normal leading-relaxed text-stone-600 antialiased">
        <span className="mt-2 inline-block size-1.25 shrink-0 rounded-[1.5px] bg-zinc-800" />
        <span>{children}</span>
      </li>
    );
  },
  strong: ({ children }) => (
    <strong className="font-normal text-stone-800 antialiased">{children}</strong>
  ),
  em: ({ children }) => (
    <em className="font-normal text-stone-700 antialiased">{children}</em>
  ),
  code: ({ children }) => (
    <code className="rounded bg-stone-100 px-1.5 py-0.5 font-mono text-[13px] font-normal text-stone-800 antialiased">
      {children}
    </code>
  ),
  pre: ({ children }) => (
    <pre className="overflow-x-auto rounded-lg border border-stone-200/50 bg-stone-50 p-4 text-[13px] font-normal leading-relaxed text-stone-700 antialiased">
      {children}
    </pre>
  ),
  blockquote: ({ children }) => (
    <blockquote className="rounded-lg bg-stone-50/80 px-4 py-3 text-[15px] font-normal text-stone-500 antialiased">
      {children}
    </blockquote>
  ),
  a: ({ children, href }) => {
    if (href?.startsWith("mailto:")) {
      return (
        <a href={href} className="font-normal text-stone-600 underline underline-offset-2 antialiased hover:text-stone-900">
          {children}
        </a>
      );
    }
    return (
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        className="font-normal text-stone-600 underline decoration-dotted underline-offset-2 antialiased hover:text-stone-900"
      >
        {children}
      </a>
    );
  },
  hr: () => <hr className="my-4 border-t border-stone-200/50" />,
  img: ({ src, alt }) => (
    <img src={src} alt={alt ?? ""} className="rounded-lg border border-stone-200/50" />
  ),
  table: ({ children }) => (
    <div className="overflow-x-auto rounded-lg border border-stone-200/50 antialiased">
      <table className="w-full border-collapse text-[14px] font-normal text-stone-600">{children}</table>
    </div>
  ),
  thead: ({ children }) => (
    <thead className="bg-stone-100/70 font-normal text-stone-700">{children}</thead>
  ),
  tbody: ({ children }) => <tbody className="font-normal">{children}</tbody>,
  tr: ({ children }) => <tr className="border-b border-stone-200/50">{children}</tr>,
  th: ({ children }) => (
    <th className="px-3 py-2 text-left text-[13px] font-normal text-stone-700 antialiased">{children}</th>
  ),
  td: ({ children }) => (
    <td className="px-3 py-2 text-[13px] font-normal text-stone-600 antialiased">{children}</td>
  ),
  del: ({ children }) => (
    <del className="font-normal text-stone-400 line-through antialiased">{children}</del>
  ),
};

export function MarkdownRenderer({ content }: { content: string }) {
  return (
    <div className="flex flex-col gap-4 antialiased">
      <Markdown components={components}>{content}</Markdown>
    </div>
  );
}
