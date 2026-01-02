import { NextResponse } from "next/server";
import { executeChain } from "@/lib/executor";
import { getChain } from "@/lib/chains";
import { getRecentRuns } from "@/lib/persistence";

export const dynamic = "force-dynamic";

// GET: List recent runs
export async function GET() {
  try {
    const runs = await getRecentRuns(20);

    return NextResponse.json({
      runs: runs.map((run) => ({
        id: run.id,
        chainId: run.chainId,
        status: run.status,
        startedAt: run.startedAt,
        completedAt: run.completedAt,
        stepCount: Object.keys(run.steps).length,
        currentStep: run.currentStep,
        error: run.error,
      })),
    });
  } catch (error) {
    console.error("Error loading runs:", error);
    return NextResponse.json({ error: "Failed to load runs" }, { status: 500 });
  }
}

// POST: Start a new run
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { chainId, inputs } = body;

    if (!chainId) {
      return NextResponse.json(
        { error: "chainId is required" },
        { status: 400 }
      );
    }

    // Verify chain exists
    const chain = await getChain(chainId);
    if (!chain) {
      return NextResponse.json(
        { error: `Chain "${chainId}" not found` },
        { status: 404 }
      );
    }

    // Start chain execution in background
    // Note: In production, you'd want a proper job queue
    const runPromise = executeChain(chainId, inputs || {});

    // Wait briefly to get the run ID
    const run = await Promise.race([
      runPromise,
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 100)),
    ]);

    if (run) {
      // Chain completed quickly
      return NextResponse.json({
        runId: run.id,
        chainId,
        status: run.status,
      });
    }

    // Chain is still running - we need to handle this differently
    // For now, we'll wait for the run to start and return the ID
    // In a real implementation, we'd use a job queue

    // This is a simplified approach - in practice we'd need
    // to track the run ID before execution starts
    return NextResponse.json({
      message: "Chain execution started",
      chainId,
    });
  } catch (error) {
    console.error("Error starting run:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to start run" },
      { status: 500 }
    );
  }
}
