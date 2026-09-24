import { getServerStore, subscribeToBroadcast } from "@/lib/serverStore";

/**
 * Server-Sent Events endpoint for real-time broadcast state updates.
 * Replaces 2-second polling with a persistent push connection.
 */
export async function GET() {
  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();

  const encoder = new TextEncoder();
  let closed = false;

  const send = (event: string, data: unknown) => {
    if (closed) return;
    const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    writer.write(encoder.encode(payload)).catch(() => { closed = true; });
  };

  // Flush initial state
  const store = getServerStore();
  send("broadcast", store.broadcast);
  send("config", store.config);
  send("tickerTerms", store.tickerTerms);
  send("episodes", store.episodes.slice(0, 5));
  send("merch", store.merch.slice(0, 4));
  send("events", store.events.slice(0, 3));

  // Register this client with the store
  const unsubscribe = subscribeToBroadcast(send);

  const response = new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });

  // Cleanup when stream closes or errors
  writer.closed.then(() => { closed = true; unsubscribe(); }).catch(() => { closed = true; unsubscribe(); });

  // Abort handler for client disconnect
  const abortController = new AbortController();
  response.headers.set("Abort-Signal", abortController.signal.toString());
  abortController.signal.addEventListener("abort", () => { closed = true; unsubscribe(); });

  return response;
}
