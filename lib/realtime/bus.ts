import "server-only";

import { getPreparedQueries } from "@/lib/db/queries";

/**
 * Tiny realtime bus.
 *
 * `publish()` wakes every SSE connection on this instance immediately (server
 * actions call it right after a write). The poller is the safety net for other
 * instances: it compares job/applicant watermarks every few seconds and emits
 * the same events, so a mutation made on instance B still reaches a browser
 * connected to instance A.
 */
export type RealtimeEvent =
  | { type: "jobs"; jobPostId?: string }
  | { type: "applicants"; jobPostId?: string };

type Listener = (event: RealtimeEvent) => void;

type RealtimeState = {
  listeners: Set<Listener>;
  timer: ReturnType<typeof setInterval> | null;
  initialized: boolean;
  jobsAt: number;
  jobsTotal: number;
  applicantsAt: number;
  applicantsTotal: number;
};

const globalRef = globalThis as unknown as { __realtime?: RealtimeState };

const state: RealtimeState = (globalRef.__realtime ??= {
  listeners: new Set(),
  timer: null,
  initialized: false,
  jobsAt: 0,
  jobsTotal: -1,
  applicantsAt: 0,
  applicantsTotal: -1,
});

export function publishRealtime(event: RealtimeEvent) {
  for (const listener of state.listeners) {
    try {
      listener(event);
    } catch {
      // a broken SSE connection must never break a write
    }
  }
}

const POLL_MS = 2_500;

async function tick() {
  try {
    const queries = getPreparedQueries();
    const [jobsRows, applicantRows] = await Promise.all([
      queries.jobsWatermark.execute(),
      queries.applicantsWatermark.execute(),
    ]);
    const jobs = jobsRows[0];
    const apps = applicantRows[0];
    const jobsAt = jobs?.at ? jobs.at.getTime() : 0;
    const jobsTotal = Number(jobs?.total ?? 0);
    const applicantsAt = apps?.at ? apps.at.getTime() : 0;
    const applicantsTotal = Number(apps?.total ?? 0);

    // First tick only records the baseline.
    if (!state.initialized) {
      state.initialized = true;
      state.jobsAt = jobsAt;
      state.jobsTotal = jobsTotal;
      state.applicantsAt = applicantsAt;
      state.applicantsTotal = applicantsTotal;
      return;
    }

    if (jobsTotal !== state.jobsTotal || jobsAt !== state.jobsAt) {
      state.jobsTotal = jobsTotal;
      state.jobsAt = jobsAt;
      publishRealtime({ type: "jobs" });
    }

    if (applicantsTotal !== state.applicantsTotal || applicantsAt !== state.applicantsAt) {
      state.applicantsTotal = applicantsTotal;
      state.applicantsAt = applicantsAt;
      publishRealtime({ type: "applicants" });
    }
  } catch (error) {
    // DB hiccup — keep the connection alive and try again next tick.
    console.warn("[realtime] poll failed:", error instanceof Error ? error.message : error);
  }
}

function ensurePoller() {
  if (state.timer) return;
  state.timer = setInterval(() => void tick(), POLL_MS);
  // Do not keep the process alive just for the poller.
  state.timer.unref?.();
}

function stopPoller() {
  if (!state.timer) return;
  clearInterval(state.timer);
  state.timer = null;
  state.initialized = false;
}

export function subscribeRealtime(listener: Listener): () => void {
  state.listeners.add(listener);
  ensurePoller();

  return () => {
    state.listeners.delete(listener);
    if (state.listeners.size === 0) stopPoller();
  };
}
