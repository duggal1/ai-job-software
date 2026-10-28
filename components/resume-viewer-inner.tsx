"use client";

import { useEffect, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

/**
 * Fits every page to the container instead of pinning 680px (which overflowed
 * the 576px column and made the preview look broken). All pages render in one
 * scroll so the whole resume can be skimmed in a single pass.
 */
export default function ResumeViewerInner({ url }: { url: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [numPages, setNumPages] = useState(0);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const measure = () => {
      // 2rem of inner padding, then clamp so it never blows past the column.
      setWidth(Math.max(240, Math.min(element.clientWidth - 32, 620)));
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
      className="overflow-hidden rounded-lg border border-stone-100 bg-stone-50 p-4"
    >
      <Document
        file={url}
        loading={<p className="py-8 text-center text-[13px] text-stone-400">Loading…</p>}
        onLoadSuccess={({ numPages: pages }) => setNumPages(pages)}
        error={
          <p className="py-8 text-center text-[13px] text-stone-400">
            Couldn&apos;t preview this PDF.{" "}
            <a href={url} target="_blank" rel="noreferrer" className="underline underline-offset-2">
              Open it instead
            </a>
            .
          </p>
        }
      >
        {width > 0 && (
          <div className="flex flex-col items-center gap-3">
            {Array.from({ length: numPages || 1 }).map((_, index) => (
              <div key={index} className="overflow-hidden rounded-md bg-white shadow-[0_1px_2px_rgba(0,0,0,0.06)]">
                <Page
                  pageNumber={index + 1}
                  width={width}
                  renderTextLayer={false}
                  renderAnnotationLayer={false}
                />
              </div>
            ))}
          </div>
        )}
      </Document>
    </div>
  );
}
