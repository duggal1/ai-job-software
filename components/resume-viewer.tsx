"use client";

import dynamic from "next/dynamic";

export const ResumeViewer = dynamic(() => import("./resume-viewer-inner"), {
  ssr: false,
  loading: () => <p className="py-8 text-center text-[13px] text-stone-400">Loading resume…</p>,
});
