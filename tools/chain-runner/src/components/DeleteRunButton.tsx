"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  runId: string;
  chainId: string;
  variant?: "icon" | "button";
}

export function DeleteRunButton({ runId, chainId, variant = "button" }: Props) {
  const router = useRouter();
  const [isConfirming, setIsConfirming] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!isConfirming) {
      setIsConfirming(true);
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/runs/${runId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        router.push(`/chains/${chainId}`);
        router.refresh();
      } else {
        console.error("Failed to delete run");
        setIsConfirming(false);
      }
    } catch (error) {
      console.error("Error deleting run:", error);
      setIsConfirming(false);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancel = () => {
    setIsConfirming(false);
  };

  if (variant === "icon") {
    return (
      <div className="flex items-center gap-1">
        {isConfirming && (
          <button
            onClick={handleCancel}
            className="p-1.5 text-gray-400 hover:text-gray-600 rounded"
            title="Cancel"
          >
            ✕
          </button>
        )}
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className={`p-1.5 rounded transition-colors ${
            isConfirming
              ? "text-red-600 hover:text-red-700 hover:bg-red-50"
              : "text-gray-400 hover:text-red-500 hover:bg-gray-100"
          }`}
          title={isConfirming ? "Click again to confirm delete" : "Delete run"}
        >
          {isDeleting ? (
            <span className="inline-block animate-spin">⟳</span>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          )}
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {isConfirming && (
        <button
          onClick={handleCancel}
          className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 border rounded hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
      )}
      <button
        onClick={handleDelete}
        disabled={isDeleting}
        className={`px-3 py-1.5 text-sm rounded transition-colors ${
          isConfirming
            ? "bg-red-600 text-white hover:bg-red-700"
            : "text-red-600 border border-red-200 hover:bg-red-50"
        }`}
      >
        {isDeleting ? "Deleting..." : isConfirming ? "Confirm delete" : "Delete"}
      </button>
    </div>
  );
}
