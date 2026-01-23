"use client";

import { useState, useEffect, useCallback, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import PairwiseComparison from "@/components/PairwiseComparison";

interface Run {
  id: string;
  evaluator: string;
  evaluatorType: "human" | "ai";
  aiModel?: string;
  paperSlug?: string;
  paperName?: string;
  targetCount: number;
  completedCount: number;
  status: "pending" | "in_progress" | "completed" | "failed";
  startedAt: string;
  completedAt?: string;
  error?: string;
}

interface Comparison {
  id: string;
  evaluator: string;
  critiqueA: string;
  critiqueB: string;
  winner: "A" | "B" | "tie" | "unclear";
  confidence: "high" | "medium" | "low";
  notes?: string;
  timestamp: string;
  rankA: number;
  rankB: number;
  runId?: string;
  aiReasoning?: string;
}

interface AgreementStats {
  totalComparisons: number;
  excludedUnclear: number;
  agreements: number;
  disagreements: number;
  agreementRate: number;
}

interface PageProps {
  params: Promise<{ runId: string }>;
}

export default function RunDetailPage({ params }: PageProps) {
  const { runId } = use(params);
  const router = useRouter();
  const [run, setRun] = useState<Run | null>(null);
  const [comparisons, setComparisons] = useState<Comparison[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date>(new Date());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [expandedComparison, setExpandedComparison] = useState<string | null>(null);
  const [critiqueTexts, setCritiqueTexts] = useState<Record<string, { textA: string; textB: string }>>({});
  const [showCritiqueNames, setShowCritiqueNames] = useState(false);
  const [agreement, setAgreement] = useState<AgreementStats | null>(null);

  const loadRun = useCallback(async () => {
    try {
      const res = await fetch(`/api/pairwise/runs/${runId}`);
      const data = await res.json();
      if (res.ok) {
        setRun(data.run);
        setComparisons(data.comparisons || []);
        setIsExecuting(data.isExecuting || false);
        setAgreement(data.agreement || null);
        setLastChecked(new Date());
      } else {
        setError(data.error || "Failed to load run");
      }
    } catch (err) {
      setError("Failed to load run");
    } finally {
      setIsLoading(false);
    }
  }, [runId]);

  useEffect(() => {
    loadRun();

    // Poll for updates if AI run is in progress
    const interval = setInterval(() => {
      if (isExecuting || run?.status === "in_progress") {
        loadRun();
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [loadRun, isExecuting, run?.status]);

  const handleStartExecution = async () => {
    try {
      const res = await fetch(`/api/pairwise/runs/${runId}/execute`, {
        method: "POST",
      });
      if (res.ok) {
        setIsExecuting(true);
        loadRun();
      }
    } catch (err) {
      setError("Failed to start execution");
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/pairwise/runs/${runId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        router.push("/pairwise");
      } else {
        setError("Failed to delete run");
      }
    } catch (err) {
      setError("Failed to delete run");
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const loadCritiqueTexts = async (comparisonId: string, critiqueAId: string, critiqueBId: string) => {
    if (critiqueTexts[comparisonId]) return; // Already loaded

    try {
      const res = await fetch(`/api/pairwise/critiques?ids=${critiqueAId},${critiqueBId}`);
      const data = await res.json();
      if (res.ok) {
        setCritiqueTexts((prev) => ({
          ...prev,
          [comparisonId]: {
            textA: data.critiques[critiqueAId] || "Critique not found",
            textB: data.critiques[critiqueBId] || "Critique not found",
          },
        }));
      }
    } catch (err) {
      console.error("Failed to load critique texts", err);
    }
  };

  const toggleComparison = (c: Comparison) => {
    if (expandedComparison === c.id) {
      setExpandedComparison(null);
    } else {
      setExpandedComparison(c.id);
      loadCritiqueTexts(c.id, c.critiqueA, c.critiqueB);
    }
  };

  const formatLastChecked = (date: Date) => {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 5) return "just now";
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m ago`;
  };

  const getComparisonAgreement = (c: Comparison): "agree" | "disagree" | "unclear" => {
    if (c.winner === "unclear") return "unclear";

    const rankDiff = Math.abs(c.rankA - c.rankB);
    let acornExpected: "A" | "B" | "tie";

    if (rankDiff <= 5) {
      acornExpected = "tie";
    } else if (c.rankA < c.rankB) {
      acornExpected = "A";
    } else {
      acornExpected = "B";
    }

    if (c.winner === "tie") {
      return rankDiff <= 10 ? "agree" : "disagree";
    } else if (acornExpected === "tie") {
      return "agree"; // Lenient when ACORN thinks it's close
    } else {
      return c.winner === acornExpected ? "agree" : "disagree";
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (error || !run) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-700">{error || "Run not found"}</p>
        <Link href="/pairwise" className="mt-2 text-red-600 hover:underline">
          ← Back to runs
        </Link>
      </div>
    );
  }

  const progress = run.targetCount > 0 ? run.completedCount / run.targetCount : 0;
  const progressPercent = Math.round(progress * 100);
  const isAI = run.evaluatorType === "ai";
  const canExecute = isAI && run.status !== "completed" && !isExecuting;

  // For human runs, show the comparison UI
  if (!isAI && run.status !== "completed") {
    return (
      <div>
        <div className="mb-6">
          <Link
            href="/pairwise"
            className="text-blue-600 hover:underline text-sm"
          >
            ← Back to runs
          </Link>
        </div>
        <PairwiseComparison runId={runId} evaluator={run.evaluator} paperSlug={run.paperSlug} />
      </div>
    );
  }

  // For AI runs or completed runs, show details view
  return (
    <div>
      <div className="mb-6">
        <Link
          href="/pairwise"
          className="text-blue-600 hover:underline text-sm"
        >
          ← Back to runs
        </Link>
      </div>

      {/* Run header */}
      <div className="mb-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold mb-2">{run.evaluator}</h1>
            <div className="flex items-center gap-3 text-gray-600">
              <span className="capitalize">{run.evaluatorType}</span>
              {isAI && run.aiModel && (
                <>
                  <span>•</span>
                  <span>{run.aiModel}</span>
                </>
              )}
              <span>•</span>
              <span
                className={`px-2 py-0.5 rounded text-sm ${
                  run.status === "completed"
                    ? "bg-green-100 text-green-700"
                    : run.status === "failed"
                    ? "bg-red-100 text-red-700"
                    : run.status === "in_progress"
                    ? "bg-blue-100 text-blue-700"
                    : "bg-gray-100 text-gray-700"
                }`}
              >
                {run.status === "in_progress" ? "In progress" : run.status}
              </span>
              {(run.status === "in_progress" || isExecuting) && (
                <span className="text-xs text-gray-400">
                  checked {formatLastChecked(lastChecked)}
                </span>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            {showDeleteConfirm ? (
              <>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="px-3 py-1 bg-red-600 text-white rounded-md font-medium hover:bg-red-700 disabled:opacity-50"
                >
                  {deleting ? "Deleting..." : "Confirm delete"}
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-3 py-1 border border-gray-300 rounded-md font-medium hover:bg-gray-50"
                >
                  Cancel
                </button>
              </>
            ) : (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="px-3 py-1 border border-red-300 text-red-600 rounded-md font-medium hover:bg-red-50"
              >
                Delete run
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Progress */}
      <div className="mb-6">
        <div className="flex justify-between text-sm text-gray-600 mb-1">
          <span>Progress</span>
          <span>
            {run.completedCount} / {run.targetCount} ({progressPercent}%)
          </span>
        </div>
        <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all ${
              run.status === "failed" ? "bg-red-500" : "bg-blue-600"
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* ACORN Agreement stats */}
      {agreement && comparisons.length > 0 && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="text-sm font-medium mb-1">ACORN agreement</div>
          <div className="text-2xl font-bold">{Math.round(agreement.agreementRate * 100)}%</div>
          <div className="text-sm text-gray-500">
            {agreement.agreements} agree, {agreement.disagreements} disagree
            {agreement.excludedUnclear > 0 && `, ${agreement.excludedUnclear} unclear`}
          </div>
        </div>
      )}

      {/* Execute button for AI runs */}
      {canExecute && (
        <div className="mb-6">
          <button
            onClick={handleStartExecution}
            className="px-4 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700"
          >
            Start AI evaluation
          </button>
        </div>
      )}

      {/* Executing status */}
      {isExecuting && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent"></div>
            <span className="text-blue-700">
              AI evaluation in progress... ({run.completedCount} / {run.targetCount} completed)
            </span>
          </div>
        </div>
      )}

      {/* Error */}
      {run.error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          <strong>Error:</strong> {run.error}
        </div>
      )}

      {/* Comparisons list */}
      {comparisons.length > 0 && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">
              Comparisons ({comparisons.length})
            </h2>
            <button
              onClick={() => setShowCritiqueNames(!showCritiqueNames)}
              className="text-sm text-gray-600 hover:text-gray-900 px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              {showCritiqueNames ? "Hide critique names" : "Show critique names"}
            </button>
          </div>
          <div className="space-y-3">
            {comparisons.map((c) => (
              <div
                key={c.id}
                className="border rounded-lg bg-white overflow-hidden"
              >
                <button
                  onClick={() => toggleComparison(c)}
                  className={`w-full p-4 text-left hover:bg-gray-50 ${expandedComparison === c.id ? "" : "rounded-lg"}`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="text-sm">
                      <span className="font-medium">{showCritiqueNames ? c.critiqueA : "Critique A"}</span>
                      <span className="text-gray-400 mx-2">vs</span>
                      <span className="font-medium">{showCritiqueNames ? c.critiqueB : "Critique B"}</span>
                      <span className="text-gray-400 ml-2 text-xs">
                        {expandedComparison === c.id ? "▼" : "▶"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded text-sm font-medium ${
                          c.winner === "A"
                            ? "bg-blue-100 text-blue-700"
                            : c.winner === "B"
                            ? "bg-blue-100 text-blue-700"
                            : c.winner === "tie"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {c.winner === "A"
                          ? "A wins"
                          : c.winner === "B"
                          ? "B wins"
                          : c.winner === "tie"
                          ? "Tie"
                          : "Unclear"}
                      </span>
                      <span className="text-xs text-gray-500">
                        ({c.confidence} confidence)
                      </span>
                      {(() => {
                        const compAgreement = getComparisonAgreement(c);
                        return compAgreement !== "unclear" && (
                          <span className={`px-2 py-0.5 rounded text-xs ${
                            compAgreement === "agree"
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}>
                            {compAgreement === "agree" ? "✓ Agrees" : "✗ Disagrees"}
                          </span>
                        );
                      })()}
                    </div>
                  </div>
                  {c.aiReasoning && (
                    <div className="text-sm text-gray-600 mt-2 p-2 bg-gray-50 rounded max-w-prose mx-auto">
                      {c.aiReasoning}
                    </div>
                  )}
                  {showCritiqueNames && (
                    <div className="text-xs text-gray-400 mt-2">
                      Ranks: A={c.rankA}, B={c.rankB}
                    </div>
                  )}
                </button>

                {/* Expanded critique texts */}
                {expandedComparison === c.id && (
                  <div className="border-t p-4">
                    {critiqueTexts[c.id] ? (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-medium text-sm">Critique A{showCritiqueNames ? `: ${c.critiqueA}` : ""}</h4>
                            {c.winner === "A" && (
                              <span className="px-2 py-0.5 rounded text-xs bg-blue-100 text-blue-700">Winner</span>
                            )}
                          </div>
                          <div className={`text-sm text-gray-700 p-3 rounded whitespace-pre-wrap ${c.winner === "A" ? "bg-blue-50" : "bg-gray-50"}`}>
                            {critiqueTexts[c.id].textA}
                          </div>
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-medium text-sm">Critique B{showCritiqueNames ? `: ${c.critiqueB}` : ""}</h4>
                            {c.winner === "B" && (
                              <span className="px-2 py-0.5 rounded text-xs bg-blue-100 text-blue-700">Winner</span>
                            )}
                          </div>
                          <div className={`text-sm text-gray-700 p-3 rounded whitespace-pre-wrap ${c.winner === "B" ? "bg-blue-50" : "bg-gray-50"}`}>
                            {critiqueTexts[c.id].textB}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-gray-500 text-sm">Loading critiques...</div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
