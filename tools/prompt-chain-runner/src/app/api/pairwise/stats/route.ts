import { NextResponse } from "next/server";
import {
  loadComparisons,
  getEvaluatorComparisons,
  getEvaluators,
  calculateAgreement,
  AgreementStats,
} from "@/lib/pairwise-persistence";

interface StatsResponse {
  overall: AgreementStats;
  byEvaluator: Record<string, AgreementStats>;
  evaluators: string[];
  totalComparisons: number;
}

// GET /api/pairwise/stats?evaluator=Peter (optional evaluator filter)
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const evaluatorFilter = url.searchParams.get("evaluator");

    const data = await loadComparisons();
    const evaluators = await getEvaluators();

    // Calculate overall stats
    const overallStats = calculateAgreement(data.comparisons);

    // Calculate per-evaluator stats
    const byEvaluator: Record<string, AgreementStats> = {};
    for (const evaluator of evaluators) {
      const comparisons = await getEvaluatorComparisons(evaluator);
      byEvaluator[evaluator] = calculateAgreement(comparisons);
    }

    const response: StatsResponse = {
      overall: overallStats,
      byEvaluator,
      evaluators,
      totalComparisons: data.comparisons.length,
    };

    // If specific evaluator requested, also include their detailed comparisons
    if (evaluatorFilter) {
      const evaluatorComparisons = await getEvaluatorComparisons(evaluatorFilter);
      return NextResponse.json({
        ...response,
        evaluatorComparisons,
        evaluatorStats: byEvaluator[evaluatorFilter] || calculateAgreement([]),
      });
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error getting stats:", error);
    return NextResponse.json(
      { error: "Failed to get stats" },
      { status: 500 }
    );
  }
}
