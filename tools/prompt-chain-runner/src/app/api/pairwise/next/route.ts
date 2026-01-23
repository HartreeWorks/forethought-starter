import { NextResponse } from "next/server";
import {
  loadAllCritiques,
  sortByOverallScore,
  generatePairs,
  getNextPair,
  CritiqueWithGrade,
} from "@/lib/pairwise-data";
import { getCompletedPairIds } from "@/lib/pairwise-persistence";

// Simplified critique for sending to client (no ACORN scores for blind evaluation)
interface BlindCritique {
  id: string;
  paperName: string;
  critique: string;
}

interface NextPairResponse {
  pair: {
    critiqueA: BlindCritique;
    critiqueB: BlindCritique;
    // Internal tracking (not revealed to user during comparison)
    _meta: {
      rankA: number;
      rankB: number;
    };
  } | null;
  progress: {
    completed: number;
    total: number;
    remaining: number;
  };
}

// Cache loaded data to avoid re-reading files on every request
let cachedCritiques: CritiqueWithGrade[] | null = null;
let cachedPairs: ReturnType<typeof generatePairs> | null = null;

async function getCritiquesAndPairs() {
  if (!cachedCritiques || !cachedPairs) {
    const critiques = await loadAllCritiques();
    const sorted = sortByOverallScore(critiques);
    const pairs = generatePairs(sorted);
    cachedCritiques = sorted;
    cachedPairs = pairs;
  }
  return { critiques: cachedCritiques, pairs: cachedPairs };
}

// GET /api/pairwise/next?evaluator=Peter
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const evaluator = url.searchParams.get("evaluator");

    if (!evaluator) {
      return NextResponse.json(
        { error: "Missing evaluator parameter" },
        { status: 400 }
      );
    }

    const { pairs } = await getCritiquesAndPairs();
    const completedPairIds = await getCompletedPairIds(evaluator);

    const nextPair = getNextPair(pairs, completedPairIds);

    // Randomly swap A and B to avoid position bias
    let pairToSend = nextPair;
    let swapped = false;
    if (nextPair && Math.random() > 0.5) {
      pairToSend = {
        ...nextPair,
        critiqueA: nextPair.critiqueB,
        critiqueB: nextPair.critiqueA,
        rankA: nextPair.rankB,
        rankB: nextPair.rankA,
      };
      swapped = true;
    }

    const response: NextPairResponse = {
      pair: pairToSend
        ? {
            critiqueA: {
              id: pairToSend.critiqueA.id,
              paperName: pairToSend.critiqueA.paperName,
              critique: pairToSend.critiqueA.critique,
            },
            critiqueB: {
              id: pairToSend.critiqueB.id,
              paperName: pairToSend.critiqueB.paperName,
              critique: pairToSend.critiqueB.critique,
            },
            _meta: {
              rankA: pairToSend.rankA,
              rankB: pairToSend.rankB,
            },
          }
        : null,
      progress: {
        completed: completedPairIds.size,
        total: pairs.length,
        remaining: pairs.length - completedPairIds.size,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error getting next pair:", error);
    return NextResponse.json(
      { error: "Failed to get next pair" },
      { status: 500 }
    );
  }
}
