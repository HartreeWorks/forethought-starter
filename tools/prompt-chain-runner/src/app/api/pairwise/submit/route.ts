import { NextResponse } from "next/server";
import {
  addComparison,
  Winner,
  Confidence,
} from "@/lib/pairwise-persistence";

interface SubmitComparisonInput {
  evaluator: string;
  critiqueA: string;
  critiqueB: string;
  winner: Winner;
  confidence: Confidence;
  notes?: string;
  rankA: number;
  rankB: number;
}

// POST /api/pairwise/submit
export async function POST(request: Request) {
  try {
    const input: SubmitComparisonInput = await request.json();

    // Validate required fields
    if (
      !input.evaluator ||
      !input.critiqueA ||
      !input.critiqueB ||
      !input.winner ||
      !input.confidence
    ) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: evaluator, critiqueA, critiqueB, winner, confidence",
        },
        { status: 400 }
      );
    }

    // Validate winner value
    const validWinners: Winner[] = ["A", "B", "tie", "unclear"];
    if (!validWinners.includes(input.winner)) {
      return NextResponse.json(
        { error: "Invalid winner value. Must be A, B, tie, or unclear" },
        { status: 400 }
      );
    }

    // Validate confidence value
    const validConfidences: Confidence[] = ["high", "medium", "low"];
    if (!validConfidences.includes(input.confidence)) {
      return NextResponse.json(
        { error: "Invalid confidence value. Must be high, medium, or low" },
        { status: 400 }
      );
    }

    // Add the comparison
    const comparison = await addComparison({
      evaluator: input.evaluator,
      critiqueA: input.critiqueA,
      critiqueB: input.critiqueB,
      winner: input.winner,
      confidence: input.confidence,
      notes: input.notes,
      rankA: input.rankA,
      rankB: input.rankB,
    });

    return NextResponse.json({ success: true, comparison });
  } catch (error) {
    console.error("Error submitting comparison:", error);
    return NextResponse.json(
      { error: "Failed to submit comparison" },
      { status: 500 }
    );
  }
}
