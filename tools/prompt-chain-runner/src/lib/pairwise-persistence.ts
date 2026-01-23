import fs from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";

// Store comparisons in the prompt-chain-runner directory
// Use process.cwd() since that's where Next.js runs from
const PAIRWISE_DIR = path.join(process.cwd(), "pairwise-comparisons");
const COMPARISONS_FILE = path.join(PAIRWISE_DIR, "comparisons.json");

export type Winner = "A" | "B" | "tie" | "unclear";
export type Confidence = "high" | "medium" | "low";

export interface Comparison {
  id: string;
  evaluator: string;
  critiqueA: string; // critique ID
  critiqueB: string; // critique ID
  winner: Winner;
  confidence: Confidence;
  notes?: string;
  timestamp: string;
  // Store the ranks at time of comparison for analysis
  rankA: number;
  rankB: number;
}

export interface ComparisonsData {
  comparisons: Comparison[];
}

/**
 * Ensure the pairwise-comparisons directory exists.
 */
async function ensureDir(): Promise<void> {
  try {
    await fs.mkdir(PAIRWISE_DIR, { recursive: true });
  } catch (error) {
    // Directory may already exist
  }
}

/**
 * Load all comparisons from disk.
 */
export async function loadComparisons(): Promise<ComparisonsData> {
  await ensureDir();

  try {
    const content = await fs.readFile(COMPARISONS_FILE, "utf-8");
    return JSON.parse(content);
  } catch (error) {
    // File doesn't exist yet
    return { comparisons: [] };
  }
}

/**
 * Save comparisons to disk.
 */
async function saveComparisons(data: ComparisonsData): Promise<void> {
  await ensureDir();
  await fs.writeFile(COMPARISONS_FILE, JSON.stringify(data, null, 2), "utf-8");
}

/**
 * Add a new comparison.
 */
export async function addComparison(
  comparison: Omit<Comparison, "id" | "timestamp">
): Promise<Comparison> {
  const data = await loadComparisons();

  const newComparison: Comparison = {
    ...comparison,
    id: uuidv4(),
    timestamp: new Date().toISOString(),
  };

  data.comparisons.push(newComparison);
  await saveComparisons(data);

  return newComparison;
}

/**
 * Get comparisons by evaluator.
 */
export async function getEvaluatorComparisons(
  evaluator: string
): Promise<Comparison[]> {
  const data = await loadComparisons();
  return data.comparisons.filter((c) => c.evaluator === evaluator);
}

/**
 * Get set of pair IDs that an evaluator has completed.
 */
export async function getCompletedPairIds(evaluator: string): Promise<Set<string>> {
  const comparisons = await getEvaluatorComparisons(evaluator);
  const pairIds = new Set<string>();

  for (const c of comparisons) {
    // Create order-independent pair ID
    const sorted = [c.critiqueA, c.critiqueB].sort();
    pairIds.add(`${sorted[0]}:${sorted[1]}`);
  }

  return pairIds;
}

/**
 * Get all unique evaluators.
 */
export async function getEvaluators(): Promise<string[]> {
  const data = await loadComparisons();
  const evaluators = new Set(data.comparisons.map((c) => c.evaluator));
  return Array.from(evaluators);
}

/**
 * Calculate agreement stats between human comparisons and ACORN grader.
 *
 * Agreement is defined as:
 * - Human picks A, and ACORN ranks A higher (lower rank number) = agree
 * - Human picks B, and ACORN ranks B higher = agree
 * - Human picks tie, and ranks are within 5 positions = agree
 * - Human picks unclear = excluded from calculation
 */
export interface AgreementStats {
  totalComparisons: number;
  excludedUnclear: number;
  agreements: number;
  disagreements: number;
  agreementRate: number;
  byConfidence: {
    high: { agreements: number; total: number };
    medium: { agreements: number; total: number };
    low: { agreements: number; total: number };
  };
  disagreementDetails: Array<{
    comparison: Comparison;
    acornExpected: Winner;
  }>;
}

export function calculateAgreement(
  comparisons: Comparison[]
): AgreementStats {
  const stats: AgreementStats = {
    totalComparisons: comparisons.length,
    excludedUnclear: 0,
    agreements: 0,
    disagreements: 0,
    agreementRate: 0,
    byConfidence: {
      high: { agreements: 0, total: 0 },
      medium: { agreements: 0, total: 0 },
      low: { agreements: 0, total: 0 },
    },
    disagreementDetails: [],
  };

  for (const c of comparisons) {
    if (c.winner === "unclear") {
      stats.excludedUnclear++;
      continue;
    }

    // Determine what ACORN would predict
    // Lower rank = better, so if rankA < rankB, ACORN expects A to win
    const rankDiff = Math.abs(c.rankA - c.rankB);
    let acornExpected: Winner;

    if (rankDiff <= 5) {
      // Ranks are close, ACORN would consider it a tie
      acornExpected = "tie";
    } else if (c.rankA < c.rankB) {
      acornExpected = "A";
    } else {
      acornExpected = "B";
    }

    // Check agreement
    const humanPick = c.winner;
    let agrees = false;

    if (humanPick === "tie") {
      // Human thinks it's a tie - agree if ranks are close
      agrees = rankDiff <= 10;
    } else if (acornExpected === "tie") {
      // ACORN thinks it's close - agree if human picks either or tie
      agrees = true; // Be lenient when ACORN thinks it's close
    } else {
      // Clear ACORN preference - check if human agrees
      agrees = humanPick === acornExpected;
    }

    if (agrees) {
      stats.agreements++;
      stats.byConfidence[c.confidence].agreements++;
    } else {
      stats.disagreements++;
      stats.disagreementDetails.push({ comparison: c, acornExpected });
    }

    stats.byConfidence[c.confidence].total++;
  }

  const validComparisons = stats.totalComparisons - stats.excludedUnclear;
  stats.agreementRate =
    validComparisons > 0 ? stats.agreements / validComparisons : 0;

  return stats;
}
