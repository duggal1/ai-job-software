"use client";

import { useRef, useState, useCallback } from "react";
import { Upload04Icon } from "hugeicons-react";
import { useUploadThing } from "@/lib/uploadthing";

export function LogoUpload({
  url,
  onUploadComplete,
  onRemove,
}: {
  url?: string | null;
  onUploadComplete: (url: string) => void;
  onRemove: () => void;
}) {
  const [dragActive, setDragActive] = useState(false);
  const [localUrl, setLocalUrl] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { startUpload, isUploading } = useUploadThing("imageUploader", {
    onClientUploadComplete: (res) => {
      const fileUrl = res[0]?.ufsUrl;
      if (fileUrl) onUploadComplete(fileUrl);
    },
    onUploadError: () => {
      setLocalUrl(null);
    },
  });

  const displayUrl = url ?? localUrl;

  const handleFile = useCallback(
    (file: File) => {
      if (!file.type.startsWith("image/")) return;
      setLocalUrl(URL.createObjectURL(file));
      startUpload([file]);
    },
    [startUpload],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  }, []);

  const handleClick = useCallback(() => {
    inputRef.current?.click();
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const handleRemove = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (localUrl) URL.revokeObjectURL(localUrl);
      setLocalUrl(null);
      onRemove();
    },
    [localUrl, onRemove],
  );

  return (
    <div className="flex items-center gap-4">
      <div className="group relative inline-flex">
        <div
          role="button"
          tabIndex={0}
          aria-label={displayUrl ? "Preview of uploaded logo" : "Upload company logo"}
          data-dragging={dragActive}
          onClick={handleClick}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") handleClick(); }}
          className="flex size-14 cursor-pointer items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-stone-100 bg-stone-100/80 transition-colors has-[img]:border-none"
        >
          {displayUrl ? (
            <img
              src={displayUrl}
              alt=""
              className="size-full object-cover"
              width={56}
              height={56}
            />
          ) : (
            <Upload04Icon className="size-4 text-neutral-400" />
          )}
        </div>

        {displayUrl && (
          <button
            type="button"
            aria-label="Remove logo"
            onClick={handleRemove}
            className="absolute -top-1 -right-1 z-10 hidden size-5 cursor-pointer items-center justify-center rounded-full bg-stone-50 shadow-none group-hover:flex"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="size-3 text-stone-500">
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        )}

        {isUploading && (
          <div className="absolute inset-0 z-100 flex items-center justify-center rounded-full bg-white/70">
            <div className="size-4 animate-spin rounded-full border-2 border-neutral-300 border-t-neutral-600" />
          </div>
        )}

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={handleInputChange}
        />
      </div>
      <p className="text-[12px] text-neutral-400">PNG or JPG.</p>
    </div>
  );
}
