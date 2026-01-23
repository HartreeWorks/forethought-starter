import fs from "fs/promises";
import path from "path";

// Base paths for critique data
const CRITIQUES_DIR =
  "/Users/ph/Documents/Projects/2025-09-forethought-ai-uplift/work/research/critique-prompt-experiment/outputs/parsed";
const GRADES_DIR =
  "/Users/ph/Documents/Projects/2025-09-forethought-ai-uplift/work/research/critique-prompt-experiment/results";

// Paper file paths
const PAPER_PATHS: Record<string, string> = {
  convergence:
    "/Users/ph/Documents/Projects/2025-09-forethought-ai-uplift/work/research/critique-prompt-experiment/paper.md",
  "no-easy-eutopia":
    "/Users/ph/Documents/Projects/2025-09-forethought-ai-uplift/assets/papers/no-easy-eutopia.md",
};

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
 * Generate pairs for a single paper using "extremes first, converge" strategy.
 *
 * Round 1: #1 vs #n, #2 vs #n-1, etc. (extremes)
 * Round 2: #1 vs #n/2, etc. (middle pairs)
 * Round 3: Quarter splits
 * Round 4: Adjacent pairs for close comparisons
 * Round 5: Every 3rd
 *
 * This ensures we first test the clearest signal (best vs worst),
 * then progressively test harder distinctions.
 */
function generatePairsForPaper(
  sortedCritiques: CritiqueWithGrade[],
  globalRanks: Map<string, number>,
  usedPairs: Set<string>,
  pairs: PairSelection[]
): void {
  const n = sortedCritiques.length;
  if (n < 2) return;

  // Helper to add a pair if not already added
  const addPair = (i: number, j: number) => {
    if (i === j || i < 0 || j < 0 || i >= n || j >= n) return;
    const critiqueA = sortedCritiques[i];
    const critiqueB = sortedCritiques[j];
    const key =
      critiqueA.id < critiqueB.id
        ? `${critiqueA.id}-${critiqueB.id}`
        : `${critiqueB.id}-${critiqueA.id}`;
    if (usedPairs.has(key)) return;
    usedPairs.add(key);

    pairs.push({
      pairIndex: pairs.length,
      critiqueA,
      critiqueB,
      rankA: globalRanks.get(critiqueA.id) || i + 1,
      rankB: globalRanks.get(critiqueB.id) || j + 1,
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
}

/**
 * Generate pairs using "extremes first, converge" strategy.
 * Only pairs critiques of the same paper together.
 * Interleaves pairs from different papers.
 */
export function generatePairs(
  sortedCritiques: CritiqueWithGrade[],
  maxPairs?: number
): PairSelection[] {
  // Build global rank map (used for display)
  const globalRanks = new Map<string, number>();
  sortedCritiques.forEach((c, i) => globalRanks.set(c.id, i + 1));

  // Group critiques by paper
  const byPaper = new Map<string, CritiqueWithGrade[]>();
  for (const critique of sortedCritiques) {
    const paper = critique.paperSlug;
    if (!byPaper.has(paper)) {
      byPaper.set(paper, []);
    }
    byPaper.get(paper)!.push(critique);
  }

  // Generate pairs for each paper separately
  const pairsByPaper: PairSelection[][] = [];
  const usedPairs = new Set<string>();

  for (const [, paperCritiques] of byPaper) {
    // Sort this paper's critiques by overall score
    const sorted = [...paperCritiques].sort(
      (a, b) => b.grade.overall - a.grade.overall
    );
    const paperPairs: PairSelection[] = [];
    generatePairsForPaper(sorted, globalRanks, usedPairs, paperPairs);
    pairsByPaper.push(paperPairs);
  }

  // Interleave pairs from different papers (round-robin)
  const pairs: PairSelection[] = [];
  let added = true;
  let round = 0;
  while (added) {
    added = false;
    for (const paperPairs of pairsByPaper) {
      if (round < paperPairs.length) {
        pairs.push({ ...paperPairs[round], pairIndex: pairs.length });
        added = true;
      }
    }
    round++;
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

/**
 * Load the full text of a paper by its slug.
 */
export async function loadPaperText(paperSlug: string): Promise<string | null> {
  const paperPath = PAPER_PATHS[paperSlug];
  if (!paperPath) {
    console.warn(`No paper path configured for slug: ${paperSlug}`);
    return null;
  }

  try {
    return await fs.readFile(paperPath, "utf-8");
  } catch (error) {
    console.error(`Failed to load paper ${paperSlug}:`, error);
    return null;
  }
}

/**
 * Get all available paper slugs.
 */
export function getPaperSlugs(): string[] {
  return Object.keys(PAPER_PATHS);
}

/**
 * Get paper display name from slug.
 */
export function getPaperName(paperSlug: string): string {
  return PAPER_NAMES[paperSlug] || paperSlug;
}
