"use client";

import { useCallback, useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { jobsKeys } from "@/lib/queries/jobs";
import { applicantKeys } from "@/lib/queries/applicants";
import { useToast } from "@/components/toast-provider";
import { slugify } from "@/lib/slug";

interface RealtimeMessage {
  type: "ready" | "jobs" | "applicants";
  jobPostId?: string;
  at?: number;
}

interface ApplicantFeedRow {
  applicant: { id: string; fullName: string };
  jobTitle: string;
}

/**
 * Keeps every TanStack Query cache live.
 *
 * - A single SSE connection per tab.
 * - `jobs` invalidates the job feeds the instant a post is written.
 * - `applicants` invalidates applicant lists/details the instant a resume
 *   lands, and raises a top-right notification for the newest candidate.
 * - A dropped connection reconnects and then does one full resync.
 */
export function RealtimeProvider() {
  const queryClient = useQueryClient();
  const { push } = useToast();
  const hasConnected = useRef(false);
  const lastApplicantId = useRef<string | null>(null);
  const applicantBaseline = useRef(false);
  const applicantRequest = useRef<Promise<void> | null>(null);

  /** Reads the live applicants feed; optionally announces the newest row. */
  const syncApplicants = useCallback(
    async (announce: boolean) => {
      try {
        const response = await fetch("/api/applicants", {
          credentials: "same-origin",
          headers: { Accept: "application/json" },
        });
        // 401 simply means nobody is signed in — nothing to notify.
        if (!response.ok) return;
        const rows = (await response.json()) as unknown;
        if (!Array.isArray(rows)) return;
        const newest = rows.length > 0 ? (rows[0] as ApplicantFeedRow) : null;
        const id = newest?.applicant?.id ?? null;

        if (!applicantBaseline.current) {
          // First read is the baseline; never notify about the backlog.
          // An empty baseline still counts: the first later applicant is new.
          applicantBaseline.current = true;
          lastApplicantId.current = id;
          return;
        }

        if (!newest || !id) return;

        if (announce && id !== lastApplicantId.current) {
          push({
            title: "New applicant",
            body: `${newest.applicant.fullName} applied for ${newest.jobTitle}.`,
            href: `/company/applicants/${slugify(newest.applicant.fullName)}/${id}`,
            action: "Read application",
          });
        }
        lastApplicantId.current = id;
      } catch {
        // Offline or transient — the next event/refetch will catch up.
      }
    },
    [push],
  );

  useEffect(() => {
    let source: EventSource | null = null;
    let retry: ReturnType<typeof setTimeout> | null = null;
    let disposed = false;

    const connect = () => {
      if (disposed) return;
      source = new EventSource("/api/realtime");

      source.onmessage = (event) => {
        let message: RealtimeMessage;
        try {
          message = JSON.parse(event.data) as RealtimeMessage;
        } catch {
          return;
        }

        if (message.type === "ready") {
          // First connection is already hydrated by the server; only a
          // reconnect needs a full resync for anything missed while offline.
          if (hasConnected.current) {
            void queryClient.invalidateQueries();
            // Re-baseline instead of firing a toast for every missed row.
            void syncApplicants(false);
          } else {
            hasConnected.current = true;
            void syncApplicants(false);
          }
          return;
        }

        if (message.type === "jobs") {
          void queryClient.invalidateQueries({ queryKey: jobsKeys.all });
          return;
        }

        if (message.type === "applicants") {
          void queryClient.invalidateQueries({ queryKey: applicantKeys.all });
          // Coalesce bursts (a batch of applications) into one read.
          if (!applicantRequest.current) {
            applicantRequest.current = syncApplicants(true).finally(() => {
              applicantRequest.current = null;
            });
          }
        }
      };

      source.onerror = () => {
        source?.close();
        source = null;
        if (!disposed) retry = setTimeout(connect, 1_500);
      };
    };

    connect();

    return () => {
      disposed = true;
      if (retry) clearTimeout(retry);
      source?.close();
    };
  }, [queryClient, syncApplicants]);

  return null;
}
