import { NextResponse } from "next/server";
import { getRun, getRunComparisons, deleteRun, calculateAgreement } from "@/lib/pairwise-persistence";
import { isRunExecuting, stopRunExecution } from "@/lib/pairwise-executor";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/pairwise/runs/[id] - Get run details with comparisons
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const run = await getRun(id);

    if (!run) {
      return NextResponse.json({ error: "Run not found" }, { status: 404 });
    }

    const comparisons = await getRunComparisons(id);
    const executing = isRunExecuting(id);
    const agreement = calculateAgreement(comparisons);

    return NextResponse.json({
      run,
      comparisons,
      isExecuting: executing,
      agreement,
    });
  } catch (error) {
    console.error("Error getting run:", error);
    return NextResponse.json(
      { error: "Failed to get run" },
      { status: 500 }
    );
  }
}

// DELETE /api/pairwise/runs/[id] - Delete a run and its comparisons
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;

    // Stop execution if running
    if (isRunExecuting(id)) {
      stopRunExecution(id);
    }

    const deleted = await deleteRun(id);

    if (!deleted) {
      return NextResponse.json({ error: "Run not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting run:", error);
    return NextResponse.json(
      { error: "Failed to delete run" },
      { status: 500 }
    );
  }
}
