"use client";

import { useState } from "react";
import Link from "next/link";

interface RunCardProps {
  run: {
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
    agreementRate?: number;
    agreements?: number;
    disagreements?: number;
  };
  onExecute?: () => void;
  onDelete?: () => void;
  isExecuting?: boolean;
  lastChecked?: Date;
}

export default function RunCard({ run, onExecute, onDelete, isExecuting, lastChecked }: RunCardProps) {
  const [executing, setExecuting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const progress = run.targetCount > 0 ? run.completedCount / run.targetCount : 0;
  const progressPercent = Math.round(progress * 100);

  const statusColors = {
    pending: "bg-gray-100 text-gray-700",
    in_progress: "bg-blue-100 text-blue-700",
    completed: "bg-green-100 text-green-700",
    failed: "bg-red-100 text-red-700",
  };

  const statusLabels = {
    pending: "Not started",
    in_progress: "In progress",
    completed: "Completed",
    failed: "Failed",
  };

  const handleExecute = async () => {
    if (!onExecute) return;
    setExecuting(true);
    try {
      const res = await fetch(`/api/pairwise/runs/${run.id}/execute`, {
        method: "POST",
      });
      if (res.ok) {
        onExecute();
      }
    } finally {
      setExecuting(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/pairwise/runs/${run.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        onDelete();
      }
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const formatLastChecked = (date: Date) => {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 5) return "just now";
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m ago`;
  };

  const formattedDate = new Date(run.startedAt).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const isAI = run.evaluatorType === "ai";
  const canExecute = isAI && run.status !== "completed" && !isExecuting && !executing;
  const canContinue = !isAI && run.status !== "completed";

  return (
    <div className="border rounded-lg p-4 bg-white hover:border-gray-300 transition-all">
      <div className="flex justify-between items-start mb-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-lg">{run.evaluator}</h3>
            {run.paperName && (
              <span className="text-sm text-gray-500">• {run.paperName}</span>
            )}
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span className="capitalize">{run.evaluatorType}</span>
            {isAI && run.aiModel && (
              <>
                <span>•</span>
                <span>{run.aiModel}</span>
              </>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`px-2 py-1 rounded-md text-sm font-medium ${
              statusColors[run.status]
            }`}
          >
            {statusLabels[run.status]}
          </span>
          {(run.status === "in_progress" || isExecuting) && lastChecked && (
            <span className="text-xs text-gray-400">
              checked {formatLastChecked(lastChecked)}
            </span>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-3">
        <div className="flex justify-between text-sm text-gray-600 mb-1">
          <span>Progress</span>
          <span>
            {run.completedCount} / {run.targetCount} ({progressPercent}%)
          </span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all ${
              run.status === "failed" ? "bg-red-500" : "bg-blue-600"
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        {run.completedCount > 0 && run.agreementRate !== undefined && (
          <div className="text-sm text-gray-600 mt-2">
            ACORN agreement: <span className="font-medium">{Math.round(run.agreementRate * 100)}%</span>
            <span className="text-gray-400 ml-1">({run.agreements}/{(run.agreements || 0) + (run.disagreements || 0)})</span>
          </div>
        )}
      </div>

      <div className="flex justify-between items-center text-sm text-gray-500">
        <span>Started {formattedDate}</span>
        <div className="flex gap-2">
          {canExecute && (
            <button
              onClick={handleExecute}
              disabled={executing}
              className="px-3 py-1 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {executing || isExecuting ? "Starting..." : "Start"}
            </button>
          )}
          {canContinue && (
            <Link
              href={`/pairwise/${run.id}`}
              className="px-3 py-1 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700"
            >
              Continue
            </Link>
          )}
          <Link
            href={`/pairwise/${run.id}`}
            className="px-3 py-1 border border-gray-300 rounded-md font-medium hover:bg-gray-50"
          >
            View
          </Link>
          {showDeleteConfirm ? (
            <div className="flex gap-1">
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-3 py-1 bg-red-600 text-white rounded-md font-medium hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? "..." : "Confirm"}
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-3 py-1 border border-gray-300 rounded-md font-medium hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="px-3 py-1 border border-red-300 text-red-600 rounded-md font-medium hover:bg-red-50"
            >
              Delete
            </button>
          )}
        </div>
      </div>

      {run.error && (
        <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
          {run.error}
        </div>
      )}
    </div>
  );
}
