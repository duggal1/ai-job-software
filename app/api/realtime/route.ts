import { subscribeRealtime, type RealtimeEvent } from "@/lib/realtime/bus";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const encoder = new TextEncoder();

/**
 * Server-Sent Events feed for every browser tab.
 *
 * One connection replaces polling: whenever a job or application is written,
 * the matching TanStack Query cache is invalidated client-side and refetches
 * immediately. `jobs` and `applicants` are the only event types, so payloads
 * stay tiny.
 */
export async function GET(request: Request) {
  let unsubscribe: (() => void) | null = null;
  let heartbeat: ReturnType<typeof setInterval> | null = null;

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const send = (event: RealtimeEvent | { type: "ready"; at: number }) => {
        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(event)}\n\n`),
          );
        } catch {
          // connection already closed
        }
      };

      send({ type: "ready", at: Date.now() });
      unsubscribe = subscribeRealtime(send);

      // Proxies drop idle SSE connections; a comment every 20s keeps it open.
      heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": ping\n\n"));
        } catch {
          // connection already closed
        }
      }, 20_000);

      const close = () => {
        unsubscribe?.();
        unsubscribe = null;
        if (heartbeat) clearInterval(heartbeat);
        heartbeat = null;
        try {
          controller.close();
        } catch {
          // already closed
        }
      };

      request.signal.addEventListener("abort", close, { once: true });
    },
    cancel() {
      unsubscribe?.();
      unsubscribe = null;
      if (heartbeat) clearInterval(heartbeat);
      heartbeat = null;
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
