"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";

export interface ToastInput {
  title: string;
  body?: string;
  href?: string;
  action?: string;
}

interface Toast extends ToastInput {
  id: string;
}

const ToastContext = createContext<{
  push: (toast: ToastInput) => void;
} | null>(null);

const TOAST_MS = 8_000;

/**
 * Top-right notification stack. Deliberately small and quiet: a new
 * applicant should feel like a tap on the shoulder, not an alert dialog.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  const dismiss = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
    const timer = timers.current.get(id);
    if (timer) clearTimeout(timer);
    timers.current.delete(id);
  }, []);

  const push = useCallback(
    (toast: ToastInput) => {
      const id = crypto.randomUUID();
      setToasts((current) => [...current, { ...toast, id }].slice(-3));
      timers.current.set(
        id,
        setTimeout(() => dismiss(id), TOAST_MS),
      );
    },
    [dismiss],
  );

  const value = useMemo(() => ({ push }), [push]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="pointer-events-none fixed inset-x-4 top-4 z-[70] flex flex-col items-end gap-2 sm:inset-x-auto sm:right-4 sm:w-[22rem]"
      >
        <AnimatePresence initial={false}>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              layout
              initial={{ opacity: 0, y: -8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.98 }}
              transition={{ duration: 0.18, ease: [0.2, 0.7, 0.3, 1] }}
              className="pointer-events-auto w-full rounded-xl border border-stone-200/70 bg-white/95 p-4 shadow-[0_16px_48px_-20px_rgba(28,25,23,0.35)] backdrop-blur-md"
            >
              <div className="flex items-start gap-3">
                <span
                  aria-hidden
                  className="mt-1.5 size-1.5 shrink-0 rounded-full bg-emerald-500"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-normal text-stone-900">
                    {toast.title}
                  </p>
                  {toast.body && (
                    <p className="mt-0.5 text-[12px] leading-relaxed text-stone-500">
                      {toast.body}
                    </p>
                  )}
                  {toast.href && (
                    <Link
                      href={toast.href}
                      onClick={() => dismiss(toast.id)}
                      className="mt-2 inline-block cursor-pointer text-[12px] text-blue-600 underline decoration-blue-600 decoration-dotted underline-offset-4 hover:text-blue-700"
                    >
                      {toast.action ?? "View"}
                    </Link>
                  )}
                </div>
                <button
                  type="button"
                  aria-label="Dismiss notification"
                  onClick={() => dismiss(toast.id)}
                  className="-mr-1 -mt-1 cursor-pointer rounded-md p-1 text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-600"
                >
                  <svg
                    aria-hidden
                    viewBox="0 0 24 24"
                    className="size-3.5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  >
                    <path d="M18 6 6 18" />
                    <path d="m6 6 12 12" />
                  </svg>
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used inside ToastProvider");
  }
  return context;
}
