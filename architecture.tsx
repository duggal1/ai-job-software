"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Fly AI architecture.
 * Fixed 1160 x 552 canvas, scaled to fit its container.
 * Type: 13 to 17px, weights 400 and 500 only.
 *
 * Two planes, one database:
 *  - the request path a person waits on (browser → proxy → stream → cache → write)
 *  - the intelligence path they don't wait on (embed → Pinecone → hydrate, and
 *    PDF → Reflection → fields → Resend)
 * plus the SSE bus that keeps every open tab honest.
 */

const W = 1160;
const H = 552;
const NW = 176;
const NH = 64;

const GRAY = "#a8a29e";
const SOFT = "#e7e5e4";
const ORANGE = "#ea580c";

type Tone = "default" | "accent" | "beta";

function Node({
  x,
  y,
  title,
  note,
  tone = "default",
  guard = false,
}: {
  x: number;
  y: number;
  title: string;
  note: React.ReactNode;
  tone?: Tone;
  guard?: boolean;
}) {
  const box =
    tone === "accent"
      ? "border-orange-500 bg-[#fff7ed]"
      : tone === "beta"
        ? "border-dashed border-stone-300 bg-white"
        : "border-stone-200 bg-white";

  return (
    <div
      className={`absolute z-10 flex flex-col justify-center rounded-[4px] border px-3.5 ${box}`}
      style={{ left: x, top: y, width: NW, height: NH }}
    >
      {guard && (
        <span className="absolute right-3 top-3 h-1.5 w-1.5 rounded-full bg-orange-600" />
      )}
      <span className="text-[17px] font-medium leading-none tracking-tight text-stone-900">
        {title}
      </span>
      <span
        className={`mt-2 text-[15px] font-normal leading-none ${
          tone === "accent" ? "text-orange-600" : "text-stone-500"
        }`}
      >
        {note}
      </span>
    </div>
  );
}

function Flow({
  d,
  soft = false,
  head = true,
}: {
  d: string;
  soft?: boolean;
  head?: boolean;
}) {
  return (
    <path
      d={d}
      fill="none"
      stroke={soft ? SOFT : GRAY}
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeDasharray="0.1 5"
      className="df-flow"
      markerEnd={head ? `url(#${soft ? "df-head-soft" : "df-head"})` : undefined}
    />
  );
}

function Lane({
  y,
  height,
  title,
  note,
}: {
  y: number;
  height: number;
  title: string;
  note: string;
}) {
  return (
    <>
      <div className="absolute left-0 w-24" style={{ top: y }}>
        <div className="text-[14px] font-medium leading-none text-stone-900">{title}</div>
        <div className="mt-2 text-[13px] font-normal leading-none text-stone-400">{note}</div>
      </div>
      <div className="absolute w-px bg-stone-200" style={{ left: 100, top: y, height }} />
    </>
  );
}

function Pill({ children }: { children: string }) {
  return (
    <span className="rounded-[4px] bg-white px-2 py-1 text-[13px] font-normal leading-none text-stone-500">
      {children}
    </span>
  );
}

function Key({ children, mark }: { children: string; mark: React.ReactNode }) {
  return (
    <span className="flex items-center gap-2 text-[14px] font-normal leading-none text-stone-500">
      {mark}
      {children}
    </span>
  );
}

export default function Architecture() {
  const hostRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const el = hostRef.current;
    if (!el) return;
    const update = () => setScale(Math.min(1, Math.max(0.68, el.clientWidth / W)));
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div
      ref={hostRef}
      className="mx-auto w-full max-w-[1040px] overflow-x-auto"
      role="img"
      aria-label="Fly AI architecture. The request path runs browser, proxy, streamed server components, TanStack Query cache and server actions into one Neon Postgres database. The intelligence path embeds job text with a 1024 dimension model into Pinecone for semantic search, hydrates matches from Postgres, and turns resumes and prompts into structured fields with Reflection AI before Resend sends approved outreach. Every write publishes one realtime event over SSE so open tabs invalidate only the affected cache."
    >
      <style>{`
        .df-flow { animation: df-drift 2s linear infinite; }
        @keyframes df-drift { to { stroke-dashoffset: -5.1; } }
        @media (prefers-reduced-motion: reduce) {
          .df-flow { animation: none; }
          .df-run { display: none; }
        }
      `}</style>

      <div style={{ width: W * scale, height: H * scale }}>
        <div
          className="relative font-sans antialiased"
          style={{ width: W, height: H, transform: `scale(${scale})`, transformOrigin: "top left" }}
        >
          {/* Lanes */}
          <Lane y={32} height={64} title="Request path" note="synchronous" />
          <Lane y={264} height={144} title="Intelligence" note="deferred" />

          {/* Connectors sit under the nodes so the run marker passes behind them */}
          <svg className="absolute inset-0 z-0" width={W} height={H} viewBox={`0 0 ${W} ${H}`} fill="none">
            <defs>
              <marker id="df-head" viewBox="0 0 8 8" refX="6" refY="4" markerWidth="8" markerHeight="8" markerUnits="userSpaceOnUse" orient="auto">
                <path d="M2 1.5L5.5 4L2 6.5" stroke={GRAY} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
              </marker>
              <marker id="df-head-soft" viewBox="0 0 8 8" refX="6" refY="4" markerWidth="8" markerHeight="8" markerUnits="userSpaceOnUse" orient="auto">
                <path d="M2 1.5L5.5 4L2 6.5" stroke={SOFT} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
              </marker>
            </defs>

            {/* Request path */}
            <Flow d="M288 64H324" />
            <Flow d="M504 64H540" />
            <Flow d="M720 64H756" />
            <Flow d="M936 64H972" />

            {/* Request path into the shared database */}
            <Flow d="M416 100V148" />
            <Flow d="M1064 100V148" />

            {/* Retrieval row */}
            <Flow d="M288 296H324" />
            <Flow d="M504 296H540" />
            <Flow d="M720 296H756" />
            <Flow d="M936 296H972" />

            {/* Generation row */}
            <Flow d="M288 376H324" />
            <Flow d="M504 376H540" />
            <Flow d="M720 376H756" />
            <Flow d="M936 376H972" />

            {/* Postgres feeds the hydrate step */}
            <Flow d="M848 212V260" />

            {/* Writes publish to the realtime bus */}
            <Flow soft d="M848 408V444" />

            {/* One request moving through the retrieval path */}
            <g className="df-run">
              <circle r="8" fill={ORANGE} opacity="0.14" />
              <circle r="3" fill={ORANGE} />
              <animateMotion dur="7s" repeatCount="indefinite" path="M180 296H1060" />
            </g>
          </svg>

          {/* Request path */}
          <Node x={112} y={32} title="Browser" note="candidate or founder" />
          <Node x={328} y={32} title="Proxy" note="auth + setup gate" guard />
          <Node x={544} y={32} title="RSC stream" note="Suspense shell first" />
          <Node x={760} y={32} title="Query cache" note="TanStack, optimistic" />
          <Node x={976} y={32} title="Server actions" note="session before write" guard />

          {/* Shared database */}
          <div
            className="absolute z-10 flex items-center justify-between rounded-[4px] bg-stone-50 px-4"
            style={{ left: 112, top: 152, width: 1040, height: 56 }}
          >
            <div className="flex items-baseline gap-3">
              <span className="text-[17px] font-medium leading-none tracking-tight text-stone-900">
                Neon Postgres, Drizzle over HTTP
              </span>
              <span className="text-[14px] font-normal leading-none text-stone-400">
                one source of truth for both paths
              </span>
            </div>
            <div className="flex gap-2">
              <Pill>sessions</Pill>
              <Pill>companies</Pill>
              <Pill>job posts</Pill>
              <Pill>applicants</Pill>
            </div>
          </div>

          {/* Retrieval */}
          <Node x={112} y={264} title="Job post / query" note="one embed, two uses" />
          <Node x={328} y={264} title="Embedding" note="LFM-2.5 · 1024d" />
          <Node x={544} y={264} title="Pinecone" note="index on save, top-K" tone="accent" />
          <Node x={760} y={264} title="Postgres hydrate" note="ids → typed rows" />
          <Node x={976} y={264} title="Ranked jobs" note="archived never shown" />

          {/* Generation */}
          <Node x={112} y={344} title="Apply" note="public, no sign-in" />
          <Node x={328} y={344} title="PDF → text" note="unpdf, server-side" />
          <Node x={544} y={344} title="Reflection AI" note="Beam · strict JSON" tone="accent" />
          <Node x={760} y={344} title="Fields + notes" note="never invented" />
          <Node x={976} y={344} title="Resend" note="approved, then sent" tone="beta" guard />

          {/* Realtime */}
          <div
            className="absolute z-10 flex items-center gap-3 rounded-[4px] border border-stone-200 bg-white px-4"
            style={{ left: 112, top: 448, width: 1040, height: 40 }}
          >
            <span className="flex gap-1">
              <span className="h-1 w-1 rounded-full bg-stone-400" />
              <span className="h-1 w-1 rounded-full bg-stone-300" />
              <span className="h-1 w-1 rounded-full bg-stone-200" />
            </span>
            <span className="text-[14px] font-normal leading-none text-stone-500">
              Every write publishes one event — open tabs invalidate only the affected cache, and the first new applicant raises a toast
            </span>
          </div>

          {/* Key */}
          <div className="absolute flex items-center gap-8" style={{ left: 112, top: 520 }}>
            <Key
              mark={
                <svg width="28" height="6" viewBox="0 0 28 6" fill="none">
                  <path d="M2 3H26" stroke={GRAY} strokeWidth="1.75" strokeLinecap="round" strokeDasharray="0.1 5" />
                </svg>
              }
            >
              Data flow
            </Key>
            <Key mark={<span className="h-3 w-4 rounded-[4px] border border-orange-500 bg-[#fff7ed]" />}>
              AI or retrieval step
            </Key>
            <Key mark={<span className="h-1.5 w-1.5 rounded-full bg-orange-600" />}>
              A human decides
            </Key>
            <Key mark={<span className="h-3 w-4 rounded-[4px] border border-dashed border-stone-300" />}>
              Beta
            </Key>
          </div>
        </div>
      </div>
    </div>
  );
}
