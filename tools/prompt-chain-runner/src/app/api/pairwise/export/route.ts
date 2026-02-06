import { NextResponse } from "next/server";
import {
  loadComparisons,
  loadRuns,
  calculateAgreement,
  getRunComparisons,
} from "@/lib/pairwise-persistence";

// GET /api/pairwise/export - Export all runs, comparisons, and agreement stats as JSON
export async function GET() {
  try {
    const [comparisonsData, runsData] = await Promise.all([
      loadComparisons(),
      loadRuns(),
    ]);

    // Calculate overall agreement stats
    const overallStats = calculateAgreement(comparisonsData.comparisons);

    // Calculate per-run stats
    const runStats = await Promise.all(
      runsData.runs.map(async (run) => {
        const runComparisons = await getRunComparisons(run.id);
        const stats = calculateAgreement(runComparisons);
        return {
          run,
          comparisons: runComparisons,
          agreementStats: stats,
        };
      })
    );

    return NextResponse.json({
      exportedAt: new Date().toISOString(),
      overall: {
        totalComparisons: comparisonsData.comparisons.length,
        agreementStats: overallStats,
      },
      runs: runStats,
    });
  } catch (error) {
    console.error("Error exporting pairwise data:", error);
    return NextResponse.json(
      { error: "Failed to export pairwise data" },
      { status: 500 }
    );
  }
}
