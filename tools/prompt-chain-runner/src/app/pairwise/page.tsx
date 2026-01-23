"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import NewRunModal from "@/components/NewRunModal";
import RunCard from "@/components/RunCard";

interface Run {
  id: string;
  evaluator: string;
  evaluatorType: "human" | "ai";
  aiModel?: string;
  targetCount: number;
  completedCount: number;
  status: "pending" | "in_progress" | "completed" | "failed";
  startedAt: string;
  completedAt?: string;
  error?: string;
  agreementRate?: number;
  agreements?: number;
  disagreements?: number;
}

export default function PairwisePage() {
  const [runs, setRuns] = useState<Run[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showNewRunModal, setShowNewRunModal] = useState(false);
  const [totalPairs, setTotalPairs] = useState(302); // Default, will be updated
  const [lastChecked, setLastChecked] = useState<Date>(new Date());
  const runsRef = useRef<Run[]>([]);

  const loadRuns = useCallback(async () => {
    try {
      const res = await fetch("/api/pairwise/runs");
      const data = await res.json();
      if (res.ok) {
        setRuns(data.runs || []);
        setLastChecked(new Date());
      } else {
        setError(data.error || "Failed to load runs");
      }
    } catch (err) {
      setError("Failed to load runs");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load total pairs count
  useEffect(() => {
    fetch("/api/pairwise/next?evaluator=__count__")
      .then((res) => res.json())
      .then((data) => {
        if (data.progress?.total) {
          setTotalPairs(data.progress.total);
        }
      })
      .catch(() => {});
  }, []);

  // Keep ref in sync with state for polling
  useEffect(() => {
    runsRef.current = runs;
  }, [runs]);

  useEffect(() => {
    loadRuns();

    // Poll for updates every 5 seconds when there are running AI runs
    const interval = setInterval(() => {
      const hasRunningAI = runsRef.current.some(
        (r) => r.evaluatorType === "ai" && r.status === "in_progress"
      );
      if (hasRunningAI) {
        loadRuns();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [loadRuns]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-700">{error}</p>
        <button
          onClick={() => {
            setError(null);
            loadRuns();
          }}
          className="mt-2 text-red-600 hover:underline"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">Pairwise comparison</h1>
        <p className="text-gray-600">
          Compare pairs of critiques to validate the ACORN grader. Create a new
          run to start evaluating.
        </p>
      </div>

      {/* Action buttons */}
      <div className="flex gap-3 mb-6">
        <button
          onClick={() => setShowNewRunModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700"
        >
          + New run
        </button>
      </div>

      {/* Runs list */}
      {runs.length === 0 ? (
        <div className="text-center py-12 border rounded-lg bg-gray-50">
          <p className="text-gray-600 mb-4">No evaluation runs yet.</p>
          <button
            onClick={() => setShowNewRunModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700"
          >
            Create your first run
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {runs.map((run) => (
            <RunCard
              key={run.id}
              run={run}
              onExecute={loadRuns}
              onDelete={loadRuns}
              isExecuting={run.status === "in_progress"}
              lastChecked={lastChecked}
            />
          ))}
        </div>
      )}

      {/* New run modal */}
      <NewRunModal
        isOpen={showNewRunModal}
        onClose={() => setShowNewRunModal(false)}
        onCreated={loadRuns}
        totalPairs={totalPairs}
      />
    </div>
  );
}
