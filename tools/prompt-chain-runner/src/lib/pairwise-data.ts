import fs from "fs/promises";
import path from "path";

// Base paths for critique data
const CRITIQUES_DIR =
  "/Users/ph/Documents/Projects/2025-09-forethought-ai-uplift/work/research/critique-prompt-experiment/outputs/parsed";
const GRADES_DIR =
  "/Users/ph/Documents/Projects/2025-09-forethought-ai-uplift/work/research/critique-prompt-experiment/results";

// Paper name mappings for display
const PAPER_NAMES: Record<string, string> = {
  convergence: "The Convergence Hypothesis",
  "no-easy-eutopia": "No Easy Eutopia",
};

// Prompt name mappings
const PROMPT_NAMES: Record<string, string> = {
  surgery: "Argument Surgery",
  personas: "Hostile Personas",
  unforgettable: "Unforgettable Objection",
};

export interface CritiqueWithGrade {
  id: string; // e.g., "surgery-convergence-01"
  promptType: string; // e.g., "surgery"
  paperSlug: string; // e.g., "convergence"
  paperName: string; // e.g., "The Convergence Hypothesis"
  instanceNumber: number; // e.g., 1
  critique: string; // Full critique text
  grade: AcornGrade;
}

export interface AcornGrade {
  centrality: number;
  strength: number;
  correctness: number;
  clarity: number;
  dead_weight: number;
  single_issue: number;
  overall: number;
  reasoning?: string;
}

export interface PairSelection {
  pairIndex: number;
  critiqueA: CritiqueWithGrade;
  critiqueB: CritiqueWithGrade;
  // Track which position in the sorted list each critique is from
  rankA: number;
  rankB: number;
}

/**
 * Load all critiques with their ACORN grades.
 */
export async function loadAllCritiques(): Promise<CritiqueWithGrade[]> {
  const critiques: CritiqueWithGrade[] = [];

  // Read all .txt files from parsed directory
  const files = await fs.readdir(CRITIQUES_DIR);
  const txtFiles = files.filter((f) => f.endsWith(".txt"));

  for (const file of txtFiles) {
    const id = file.replace(".txt", "");

    // Parse the ID: format is {prompt}-{paper}-{number}
    // e.g., "surgery-convergence-01" or "personas-no-easy-eutopia-15"
    const match = id.match(/^(\w+)-(.+)-(\d+)$/);
    if (!match) {
      console.warn(`Skipping file with unexpected format: ${file}`);
      continue;
    }

    const [, promptType, paperSlug, numStr] = match;
    const instanceNumber = parseInt(numStr, 10);

    // Load critique text
    const critiquePath = path.join(CRITIQUES_DIR, file);
    const critique = await fs.readFile(critiquePath, "utf-8");

    // Load grade JSON
    const gradeFile = `${id}.json`;
    const gradePath = path.join(GRADES_DIR, gradeFile);
    let grade: AcornGrade;

    try {
      const gradeJson = await fs.readFile(gradePath, "utf-8");
      grade = JSON.parse(gradeJson);
    } catch (error) {
      console.warn(`No grade found for ${id}, skipping`);
      continue;
    }

    critiques.push({
      id,
      promptType,
      paperSlug,
      paperName: PAPER_NAMES[paperSlug] || paperSlug,
      instanceNumber,
      critique,
      grade,
    });
  }

  return critiques;
}

/**
 * Sort critiques by overall ACORN score (descending).
 */
export function sortByOverallScore(
  critiques: CritiqueWithGrade[]
): CritiqueWithGrade[] {
  return [...critiques].sort((a, b) => b.grade.overall - a.grade.overall);
}

/**
 * Generate pairs using "extremes first, converge" strategy.
 *
 * Round 1: #1 vs #90, #2 vs #89, #3 vs #88, etc.
 * Round 2: #1 vs #45, #2 vs #44, etc. (middle pairs)
 * Round 3: #1 vs #23, #23 vs #45, etc. (quarter pairs)
 * Continue converging...
 *
 * This ensures we first test the clearest signal (best vs worst),
 * then progressively test harder distinctions.
 */
export function generatePairs(
  sortedCritiques: CritiqueWithGrade[],
  maxPairs?: number
): PairSelection[] {
  const n = sortedCritiques.length;
  if (n < 2) return [];

  const pairs: PairSelection[] = [];
  const usedPairs = new Set<string>();

  // Helper to add a pair if not already added
  const addPair = (i: number, j: number) => {
    if (i === j || i < 0 || j < 0 || i >= n || j >= n) return;
    const key = i < j ? `${i}-${j}` : `${j}-${i}`;
    if (usedPairs.has(key)) return;
    usedPairs.add(key);

    pairs.push({
      pairIndex: pairs.length,
      critiqueA: sortedCritiques[i],
      critiqueB: sortedCritiques[j],
      rankA: i + 1,
      rankB: j + 1,
    });
  };

  // Round 1: Extremes (#1 vs #n, #2 vs #n-1, etc.)
  for (let i = 0; i < Math.floor(n / 2); i++) {
    addPair(i, n - 1 - i);
  }

  // Round 2: First vs middle (#1 vs #n/2, #2 vs #n/2-1, etc.)
  const mid = Math.floor(n / 2);
  for (let i = 0; i < mid; i++) {
    addPair(i, mid - i);
    addPair(mid + i, n - 1 - i);
  }

  // Round 3: Quarter splits
  const quarter = Math.floor(n / 4);
  const threeQuarter = Math.floor((3 * n) / 4);
  for (let i = 0; i < quarter; i++) {
    addPair(i, quarter);
    addPair(quarter, mid - i);
    addPair(mid, threeQuarter - i);
    addPair(threeQuarter, n - 1 - i);
  }

  // Round 4: Adjacent pairs for close comparisons
  for (let i = 0; i < n - 1; i += 2) {
    addPair(i, i + 1);
  }

  // Round 5: Every 3rd
  for (let i = 0; i < n - 2; i++) {
    addPair(i, i + 3);
  }

  // Limit if requested
  if (maxPairs && pairs.length > maxPairs) {
    return pairs.slice(0, maxPairs);
  }

  return pairs;
}

/**
 * Get the next pair for an evaluator, skipping pairs they've already completed.
 */
export function getNextPair(
  allPairs: PairSelection[],
  completedPairIds: Set<string>
): PairSelection | null {
  for (const pair of allPairs) {
    const pairId = `${pair.critiqueA.id}:${pair.critiqueB.id}`;
    if (!completedPairIds.has(pairId)) {
      return pair;
    }
  }
  return null;
}

/**
 * Create a unique pair ID (order-independent).
 */
export function getPairId(critiqueAId: string, critiqueBId: string): string {
  const sorted = [critiqueAId, critiqueBId].sort();
  return `${sorted[0]}:${sorted[1]}`;
}
