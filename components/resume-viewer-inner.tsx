"use client";

import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export default function ResumeViewerInner({ url }: { url: string }) {
  return (
    <div className="flex justify-center overflow-x-auto rounded-lg border border-stone-100 bg-stone-50 p-4">
      <Document file={url} loading={<p className="py-8 text-[13px] text-stone-400">Loading…</p>}>
        <Page pageNumber={1} width={680} renderTextLayer={false} renderAnnotationLayer={false} />
      </Document>
    </div>
  );
}
