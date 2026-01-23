"use client";

import { useState, useEffect, useCallback } from "react";

type Winner = "A" | "B" | "tie" | "unclear";
type Confidence = "high" | "medium" | "low";

interface BlindCritique {
  id: string;
  paperName: string;
  critique: string;
}

interface PairData {
  critiqueA: BlindCritique;
  critiqueB: BlindCritique;
  _meta: {
    rankA: number;
    rankB: number;
  };
}

interface Progress {
  completed: number;
  total: number;
  remaining: number;
}

interface AgreementStats {
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
}

interface StatsResponse {
  evaluatorStats: AgreementStats;
  overall: AgreementStats;
}

interface PairwiseComparisonProps {
  runId?: string;
  evaluator?: string;
  paperSlug?: string;
}

export default function PairwiseComparison({ runId, evaluator: initialEvaluator, paperSlug }: PairwiseComparisonProps = {}) {
  // Evaluator state
  const [evaluator, setEvaluator] = useState<string | null>(null);
  const [nameInput, setNameInput] = useState("");
  const [showNameModal, setShowNameModal] = useState(false);

  // Comparison state
  const [currentPair, setCurrentPair] = useState<PairData | null>(null);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [selectedWinner, setSelectedWinner] = useState<Winner | null>(null);
  const [confidence, setConfidence] = useState<Confidence>("medium");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Results state
  const [showResults, setShowResults] = useState(false);
  const [stats, setStats] = useState<StatsResponse | null>(null);

  // Loading state
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check localStorage for existing evaluator name (or use prop if provided)
  useEffect(() => {
    if (initialEvaluator) {
      setEvaluator(initialEvaluator);
      setIsLoading(false);
      return;
    }
    const storedName = localStorage.getItem("pairwise-evaluator");
    if (storedName) {
      setEvaluator(storedName);
    } else {
      setShowNameModal(true);
    }
    setIsLoading(false);
  }, [initialEvaluator]);

  // Load next pair when evaluator is set
  const loadNextPair = useCallback(async () => {
    if (!evaluator) return;

    setIsLoading(true);
    setError(null);

    try {
      let url = `/api/pairwise/next?evaluator=${encodeURIComponent(evaluator)}`;
      if (paperSlug) {
        url += `&paper=${encodeURIComponent(paperSlug)}`;
      }
      const res = await fetch(url);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to load next pair");
      }

      setCurrentPair(data.pair);
      setProgress(data.progress);

      // If no more pairs, show results
      if (!data.pair) {
        setShowResults(true);
        loadStats();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }, [evaluator, paperSlug]);

  useEffect(() => {
    if (evaluator && !showResults) {
      loadNextPair();
    }
  }, [evaluator, showResults, loadNextPair]);

  // Load stats
  const loadStats = async () => {
    if (!evaluator) return;

    try {
      const res = await fetch(
        `/api/pairwise/stats?evaluator=${encodeURIComponent(evaluator)}`
      );
      const data = await res.json();
      setStats(data);
    } catch (err) {
      console.error("Failed to load stats:", err);
    }
  };

  // Handle name submission
  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const name = nameInput.trim();
    if (name) {
      localStorage.setItem("pairwise-evaluator", name);
      setEvaluator(name);
      setShowNameModal(false);
    }
  };

  // Handle comparison submission
  const handleSubmit = async () => {
    if (!evaluator || !currentPair || !selectedWinner) return;

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/pairwise/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          evaluator,
          critiqueA: currentPair.critiqueA.id,
          critiqueB: currentPair.critiqueB.id,
          winner: selectedWinner,
          confidence,
          notes: notes || undefined,
          rankA: currentPair._meta.rankA,
          rankB: currentPair._meta.rankB,
          runId: runId || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to submit");
      }

      // Reset form and load next pair
      setSelectedWinner(null);
      setConfidence("medium");
      setNotes("");
      await loadNextPair();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render name modal
  if (showNameModal) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
          <h2 className="text-xl font-semibold mb-4">Welcome to Pairwise Comparison</h2>
          <p className="text-gray-600 mb-4">
            This tool helps validate our ACORN grader by comparing pairs of critiques.
            Your comparisons will be tracked under your name.
          </p>
          <form onSubmit={handleNameSubmit}>
            <label className="block mb-2 text-sm font-medium">Your name</label>
            <input
              type="text"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              placeholder="e.g., Peter"
              className="w-full border rounded-md px-3 py-2 mb-4"
              autoFocus
            />
            <button
              type="submit"
              disabled={!nameInput.trim()}
              className="w-full bg-blue-600 text-white rounded-md py-2 font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Start comparing
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Render results
  if (showResults && stats) {
    const evalStats = stats.evaluatorStats;
    const pct = (evalStats.agreementRate * 100).toFixed(0);
    const remaining = progress?.remaining ?? 0;
    const isComplete = remaining === 0;

    return (
      <div className="max-w-4xl mx-auto">
        {isComplete ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-green-800 mb-2">
              All comparisons complete!
            </h2>
            <p className="text-green-700">
              You've completed all available comparisons. Thank you for helping validate
              the ACORN grader!
            </p>
          </div>
        ) : (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-blue-800 mb-2">
              Your progress so far
            </h2>
            <p className="text-blue-700">
              You've completed {evalStats.totalComparisons} comparisons.{" "}
              {remaining} pairs remaining.
            </p>
          </div>
        )}

        <div className="bg-white border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Your results</h3>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-3xl font-bold text-blue-600">{pct}%</div>
              <div className="text-sm text-gray-600">Agreement with ACORN</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-3xl font-bold">{evalStats.totalComparisons}</div>
              <div className="text-sm text-gray-600">Total comparisons</div>
            </div>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Agreements</span>
              <span className="font-medium">{evalStats.agreements}</span>
            </div>
            <div className="flex justify-between">
              <span>Disagreements</span>
              <span className="font-medium">{evalStats.disagreements}</span>
            </div>
            <div className="flex justify-between">
              <span>Excluded (unclear)</span>
              <span className="font-medium">{evalStats.excludedUnclear}</span>
            </div>
          </div>

          <h4 className="font-medium mt-6 mb-2">By confidence level</h4>
          <div className="space-y-2 text-sm">
            {(["high", "medium", "low"] as const).map((level) => {
              const data = evalStats.byConfidence[level];
              const levelPct =
                data.total > 0
                  ? ((data.agreements / data.total) * 100).toFixed(0)
                  : "N/A";
              return (
                <div key={level} className="flex justify-between">
                  <span className="capitalize">{level} confidence</span>
                  <span className="font-medium">
                    {data.agreements}/{data.total} ({levelPct}%)
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {remaining > 0 ? (
          <button
            onClick={() => setShowResults(false)}
            className="mt-6 w-full bg-blue-600 text-white rounded-md py-3 font-medium hover:bg-blue-700 transition-all"
          >
            Continue comparing ({remaining} remaining)
          </button>
        ) : (
          <button
            onClick={() => setShowResults(false)}
            className="mt-6 text-blue-600 hover:underline"
          >
            ← Back to comparison
          </button>
        )}
      </div>
    );
  }

  // Render loading
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  // Render error
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-700">{error}</p>
        <button
          onClick={() => loadNextPair()}
          className="mt-2 text-red-600 hover:underline"
        >
          Retry
        </button>
      </div>
    );
  }

  // Render no pairs available
  if (!currentPair) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold mb-2">No pairs available</h2>
        <p className="text-gray-600">
          You've completed all available comparisons, or none are loaded yet.
        </p>
        <button
          onClick={() => {
            setShowResults(true);
            loadStats();
          }}
          className="mt-4 text-blue-600 hover:underline"
        >
          View your results
        </button>
      </div>
    );
  }

  // Render comparison UI
  return (
    <div>
      {/* Progress bar */}
      {progress && (
        <div className="mb-6">
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>
              Comparing as <strong>{evaluator}</strong>
            </span>
            <span>
              {progress.completed} of {progress.total} pairs completed
            </span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 transition-all"
              style={{
                width: `${(progress.completed / progress.total) * 100}%`,
              }}
            />
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <p className="text-blue-800 text-sm">
          <strong>Instructions:</strong> Read both critiques below and decide which
          one is better. A good critique targets a central claim, makes a strong
          argument, is factually correct, and is clearly written.
        </p>
      </div>

      {/* Side-by-side critiques - wider on large screens for optimal line length */}
      <div className="grid md:grid-cols-2 gap-6 mb-6 lg:-mx-[50px]">
        {/* Critique A */}
        <div
          className={`border rounded-lg p-4 cursor-pointer transition-all ${
            selectedWinner === "A"
              ? "border-blue-500 bg-blue-50 ring-2 ring-blue-500"
              : "border-gray-200 hover:border-gray-300"
          }`}
          onClick={() => setSelectedWinner("A")}
        >
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-semibold text-lg">Critique A</h3>
            <span className="text-sm font-bold text-gray-900">
              {currentPair.critiqueA.paperName}
            </span>
          </div>
          <div className="prose prose-sm max-w-none">
            <p className="whitespace-pre-wrap text-gray-700">
              {currentPair.critiqueA.critique}
            </p>
          </div>
        </div>

        {/* Critique B */}
        <div
          className={`border rounded-lg p-4 cursor-pointer transition-all ${
            selectedWinner === "B"
              ? "border-blue-500 bg-blue-50 ring-2 ring-blue-500"
              : "border-gray-200 hover:border-gray-300"
          }`}
          onClick={() => setSelectedWinner("B")}
        >
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-semibold text-lg">Critique B</h3>
            <span className="text-sm font-bold text-gray-900">
              {currentPair.critiqueB.paperName}
            </span>
          </div>
          <div className="prose prose-sm max-w-none">
            <p className="whitespace-pre-wrap text-gray-700">
              {currentPair.critiqueB.critique}
            </p>
          </div>
        </div>
      </div>

      {/* Selection buttons */}
      <div className="flex flex-wrap gap-3 mb-6">
        <button
          onClick={() => setSelectedWinner("A")}
          className={`px-4 py-2 rounded-md font-medium transition-all ${
            selectedWinner === "A"
              ? "bg-blue-600 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          A is better
        </button>
        <button
          onClick={() => setSelectedWinner("B")}
          className={`px-4 py-2 rounded-md font-medium transition-all ${
            selectedWinner === "B"
              ? "bg-blue-600 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          B is better
        </button>
        <button
          onClick={() => setSelectedWinner("tie")}
          className={`px-4 py-2 rounded-md font-medium transition-all ${
            selectedWinner === "tie"
              ? "bg-blue-600 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          Too close / Tie
        </button>
        <button
          onClick={() => setSelectedWinner("unclear")}
          className={`px-4 py-2 rounded-md font-medium transition-all ${
            selectedWinner === "unclear"
              ? "bg-blue-600 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          Can't tell
        </button>
      </div>

      {/* Confidence and notes (shown after selection) */}
      {selectedWinner && (
        <div className="bg-gray-50 rounded-lg p-4 mb-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              How confident are you?
            </label>
            <div className="flex gap-3">
              {(["high", "medium", "low"] as const).map((level) => (
                <button
                  key={level}
                  onClick={() => setConfidence(level)}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-all ${
                    confidence === level
                      ? "bg-blue-600 text-white"
                      : "bg-white border text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  {level.charAt(0).toUpperCase() + level.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Notes (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any thoughts on why you made this choice..."
              className="w-full border rounded-md px-3 py-2 text-sm"
              rows={2}
            />
          </div>
        </div>
      )}

      {/* Submit button */}
      <button
        onClick={handleSubmit}
        disabled={!selectedWinner || isSubmitting}
        className="w-full bg-blue-600 text-white rounded-md py-3 font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
      >
        {isSubmitting ? "Submitting..." : "Submit & Next"}
      </button>

      {/* Finish & view results button */}
      {progress && progress.completed > 0 && (
        <button
          onClick={() => {
            setShowResults(true);
            loadStats();
          }}
          className="mt-4 w-full border border-gray-300 text-gray-700 rounded-md py-2 font-medium hover:bg-gray-50 transition-all"
        >
          Finish & view results
        </button>
      )}
    </div>
  );
}
