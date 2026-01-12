import { subscribeToRun } from "@/lib/executor";
import { loadRunById } from "@/lib/persistence";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: runId } = await params;

  // Verify run exists
  const run = await loadRunById(runId);
  if (!run) {
    return new Response("Run not found", { status: 404 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // Send initial state
      const sendEvent = (event: string, data: unknown) => {
        const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
        controller.enqueue(encoder.encode(message));
      };

      // Send current state immediately
      sendEvent("state", {
        runId: run.id,
        chainId: run.chainId,
        status: run.status,
        steps: run.steps,
        currentStep: run.currentStep,
        error: run.error,
      });

      // If run is already completed/failed, close stream
      if (run.status === "completed" || run.status === "failed") {
        controller.close();
        return;
      }

      // Subscribe to updates
      const unsubscribe = subscribeToRun(runId, (event) => {
        try {
          sendEvent(event.type, event.data);

          // Close stream when run completes
          if (
            event.type === "run:completed" ||
            event.type === "run:failed"
          ) {
            setTimeout(() => {
              unsubscribe();
              controller.close();
            }, 100);
          }
        } catch (error) {
          console.error("Error sending SSE event:", error);
        }
      });

      // Heartbeat to keep connection alive
      const heartbeat = setInterval(() => {
        try {
          sendEvent("ping", { timestamp: Date.now() });
        } catch {
          clearInterval(heartbeat);
        }
      }, 15000);

      // Cleanup on client disconnect
      request.signal.addEventListener("abort", () => {
        clearInterval(heartbeat);
        unsubscribe();
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
