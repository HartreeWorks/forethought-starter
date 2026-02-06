import fs from "fs/promises";
import path from "path";

// Base directory for critique-prompt experiment data
const EXPERIMENTS_BASE =
  "/Users/ph/Documents/Projects/2025-09-forethought-ai-uplift/work/shared/2026-01/experiments/critique-prompt";

// Per-paper directory configuration
// Each paper has its own outputs (parsed critiques) and results (ACORN grades) dirs
interface PaperConfig {
  slug: string;
  name: string;
  parsedDir: string;
  resultsDir: string;
  paperTextPath: string;
}

const PAPER_CONFIGS: PaperConfig[] = [
  {
    slug: "no-easy-eutopia",
    name: "No Easy Eutopia",
    parsedDir: path.join(EXPERIMENTS_BASE, "outputs-gpt/parsed"),
    resultsDir: path.join(EXPERIMENTS_BASE, "results-gpt"),
    paperTextPath:
      "/Users/ph/Documents/Projects/2025-09-forethought-ai-uplift/assets/papers/no-easy-eutopia.md",
  },
  {
    slug: "compute-bottlenecks",
    name: "Will Compute Bottlenecks Prevent a SIE?",
    parsedDir: path.join(EXPERIMENTS_BASE, "outputs-gpt-cb/parsed"),
    resultsDir: path.join(EXPERIMENTS_BASE, "results-gpt-cb"),
    paperTextPath:
      "/Users/ph/Documents/Projects/2025-09-forethought-ai-uplift/assets/papers/will-compute-bottlenecks-prevent-a-sie.md",
  },
  {
    slug: "convergence-and-compromise",
    name: "Convergence and Compromise",
    parsedDir: path.join(EXPERIMENTS_BASE, "outputs-gpt-cc/parsed"),
    resultsDir: path.join(EXPERIMENTS_BASE, "results-gpt-cc"),
    paperTextPath:
      "/Users/ph/Documents/Projects/2025-09-forethought-ai-uplift/assets/papers/convergence-and-compromise.md",
  },
];

// The 8 base prompt variants the report focuses on.
// Excludes legacy baselines (baseline, baseline-v1) and model refinements (gemini-*, gpt-*).
const BASE_VARIANTS = new Set([
  "conversational",
  "baseline-v2",
  "surgery",
  "personas",
  "unforgettable",
  "pivot-attack",
  "authors-tribunal",
  "pre-mortem",
]);

// Prompt display names
const PROMPT_NAMES: Record<string, string> = {
  conversational: "Conversational",
  "baseline-v2": "November",
  surgery: "Argument Surgery",
  personas: "Hostile Personas",
  unforgettable: "Unforgettable Objection",
  "pivot-attack": "Pivot-Attack",
  "authors-tribunal": "Authors' Tribunal",
  "pre-mortem": "Pre-Mortem",
};

export interface CritiqueWithGrade {
  id: string; // e.g., "surgery-no-easy-eutopia-01"
  promptType: string; // e.g., "surgery"
  paperSlug: string; // e.g., "no-easy-eutopia"
  paperName: string; // e.g., "No Easy Eutopia"
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
 * Parse a critique filename to extract variant, paper slug, and instance number.
 *
 * Handles compound prompt names (pivot-attack, authors-tribunal, pre-mortem),
 * versioned baselines (baseline-v2), and model prefixes (gemini-*, gpt-*).
 *
 * Adapted from the PHP report's parseFilename().
 */
function parseFilename(name: string): {
  variant: string;
  paperSlug: string;
  instanceNumber: number;
} | null {
  const parts = name.split("-");

  // Check for model prefix (gemini or gpt) — skip these
  let prefix = "";
  if (parts[0] === "gemini" || parts[0] === "gpt") {
    prefix = parts.shift()! + "-";
  }

  let baseVariant = parts.shift();
  if (!baseVariant) return null;

  // Handle compound prompt names
  if (baseVariant === "pivot" && parts.length > 0 && parts[0] === "attack") {
    baseVariant = "pivot-attack";
    parts.shift();
  } else if (
    baseVariant === "authors" &&
    parts.length > 0 &&
    parts[0] === "tribunal"
  ) {
    baseVariant = "authors-tribunal";
    parts.shift();
  } else if (
    baseVariant === "pre" &&
    parts.length > 0 &&
    parts[0] === "mortem"
  ) {
    baseVariant = "pre-mortem";
    parts.shift();
  }

  // Handle versioned baseline (baseline-v1, baseline-v2)
  if (
    baseVariant === "baseline" &&
    parts.length > 0 &&
    /^v\d+$/.test(parts[0])
  ) {
    baseVariant = "baseline-" + parts.shift();
  }

  const variant = prefix + baseVariant;

  // Last part is instance number, rest is paper slug
  const numStr = parts.pop();
  if (!numStr) return null;
  const instanceNumber = parseInt(numStr, 10);
  if (isNaN(instanceNumber)) return null;

  const paperSlug = parts.join("-");
  if (!paperSlug) return null;

  return { variant, paperSlug, instanceNumber };
}

/**
 * Load all critiques with their ACORN grades.
 * Only loads the 8 base variants the report cares about.
 */
export async function loadAllCritiques(): Promise<CritiqueWithGrade[]> {
  const critiques: CritiqueWithGrade[] = [];

  for (const config of PAPER_CONFIGS) {
    let files: string[];
    try {
      files = await fs.readdir(config.parsedDir);
    } catch (error) {
      console.warn(
        `Could not read parsed dir for ${config.slug}: ${config.parsedDir}`
      );
      continue;
    }

    const txtFiles = files.filter((f) => f.endsWith(".txt"));

    for (const file of txtFiles) {
      const basename = file.replace(".txt", "");
      const parsed = parseFilename(basename);
      if (!parsed) {
        console.warn(`Skipping file with unexpected format: ${file}`);
        continue;
      }

      // Only include base variants
      if (!BASE_VARIANTS.has(parsed.variant)) {
        continue;
      }

      // Verify the paper slug matches this config's expected paper
      if (parsed.paperSlug !== config.slug) {
        console.warn(
          `Paper slug mismatch in ${file}: expected ${config.slug}, got ${parsed.paperSlug}`
        );
        continue;
      }

      // Load critique text
      const critiquePath = path.join(config.parsedDir, file);
      const critique = await fs.readFile(critiquePath, "utf-8");

      // Load grade JSON
      const gradeFile = `${basename}.json`;
      const gradePath = path.join(config.resultsDir, gradeFile);
      let grade: AcornGrade;

      try {
        const gradeJson = await fs.readFile(gradePath, "utf-8");
        grade = JSON.parse(gradeJson);
      } catch (error) {
        console.warn(`No grade found for ${basename}, skipping`);
        continue;
      }

      critiques.push({
        id: basename,
        promptType: parsed.variant,
        paperSlug: config.slug,
        paperName: config.name,
        instanceNumber: parsed.instanceNumber,
        critique,
        grade,
      });
    }
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
    // Use order-independent pair ID (sorted) to match getCompletedPairIds
    const pairId = getPairId(pair.critiqueA.id, pair.critiqueB.id);
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
export async function loadPaperText(
  paperSlug: string
): Promise<string | null> {
  const config = PAPER_CONFIGS.find((c) => c.slug === paperSlug);
  if (!config) {
    console.warn(`No paper config for slug: ${paperSlug}`);
    return null;
  }

  try {
    return await fs.readFile(config.paperTextPath, "utf-8");
  } catch (error) {
    console.error(`Failed to load paper ${paperSlug}:`, error);
    return null;
  }
}

/**
 * Get all available paper slugs.
 */
export function getPaperSlugs(): string[] {
  return PAPER_CONFIGS.map((c) => c.slug);
}

/**
 * Get paper display name from slug.
 */
export function getPaperName(paperSlug: string): string {
  const config = PAPER_CONFIGS.find((c) => c.slug === paperSlug);
  return config ? config.name : paperSlug;
}

/**
 * Get all available papers with their slugs and names.
 */
export function getAvailablePapers(): { slug: string; name: string }[] {
  return PAPER_CONFIGS.map((c) => ({ slug: c.slug, name: c.name }));
}
