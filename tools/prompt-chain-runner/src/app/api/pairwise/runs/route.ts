import { NextResponse } from "next/server";
import {
  getAllRuns,
  createRun,
  getRunComparisons,
  calculateAgreement,
  EvaluatorType,
} from "@/lib/pairwise-persistence";
import { getModelDisplayName } from "@/lib/pairwise-ai-evaluator";

// GET /api/pairwise/runs - List all runs
export async function GET() {
  try {
    const runs = await getAllRuns();

    // Sort by startedAt descending (most recent first)
    runs.sort(
      (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
    );

    // Add agreement stats to each run
    const runsWithAgreement = await Promise.all(
      runs.map(async (run) => {
        const comparisons = await getRunComparisons(run.id);
        const agreement = calculateAgreement(comparisons);
        return {
          ...run,
          agreementRate: agreement.agreementRate,
          agreements: agreement.agreements,
          disagreements: agreement.disagreements,
        };
      })
    );

    return NextResponse.json({ runs: runsWithAgreement });
  } catch (error) {
    console.error("Error listing runs:", error);
    return NextResponse.json(
      { error: "Failed to list runs" },
      { status: 500 }
    );
  }
}

interface CreateRunInput {
  evaluator: string;
  evaluatorType: EvaluatorType;
  aiModel?: string;
  paperSlug?: string;
  paperName?: string;
  targetCount: number;
}

// POST /api/pairwise/runs - Create a new run
export async function POST(request: Request) {
  try {
    const input: CreateRunInput = await request.json();

    // Validate required fields
    if (!input.evaluator || !input.evaluatorType || !input.targetCount) {
      return NextResponse.json(
        { error: "Missing required fields: evaluator, evaluatorType, targetCount" },
        { status: 400 }
      );
    }

    // Validate evaluator type
    if (!["human", "ai"].includes(input.evaluatorType)) {
      return NextResponse.json(
        { error: "Invalid evaluatorType. Must be 'human' or 'ai'" },
        { status: 400 }
      );
    }

    // AI runs require aiModel
    if (input.evaluatorType === "ai" && !input.aiModel) {
      return NextResponse.json(
        { error: "AI runs require aiModel to be specified" },
        { status: 400 }
      );
    }

    // Validate targetCount (human runs use a high sentinel value since they finish manually)
    const maxTarget = input.evaluatorType === "human" ? 99999 : 500;
    if (input.targetCount < 1 || input.targetCount > maxTarget) {
      return NextResponse.json(
        { error: `targetCount must be between 1 and ${maxTarget}` },
        { status: 400 }
      );
    }

    // Create the run
    const run = await createRun({
      evaluator: input.evaluator,
      evaluatorType: input.evaluatorType,
      aiModel: input.aiModel,
      paperSlug: input.paperSlug,
      paperName: input.paperName,
      targetCount: input.targetCount,
    });

    return NextResponse.json({ success: true, run });
  } catch (error) {
    console.error("Error creating run:", error);
    return NextResponse.json(
      { error: "Failed to create run" },
      { status: 500 }
    );
  }
}
