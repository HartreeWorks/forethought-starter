"use client";

import { useState, useEffect } from "react";

interface Paper {
  slug: string;
  name: string;
}

interface NewRunModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
  totalPairs: number;
}

type EvaluatorType = "human" | "ai";

const AI_MODELS = [
  { id: "gpt-5.2-pro", name: "GPT-5.2 Pro", description: "Most capable, ~$1 per pair" },
  { id: "gpt-5.2", name: "GPT-5.2", description: "Standard, ~$0.07 per pair" },
];

export default function NewRunModal({
  isOpen,
  onClose,
  onCreated,
  totalPairs,
}: NewRunModalProps) {
  const [evaluatorType, setEvaluatorType] = useState<EvaluatorType>("ai");
  const [evaluatorName, setEvaluatorName] = useState("");
  const [aiModel, setAiModel] = useState("gpt-5.2-pro");
  const [targetCount, setTargetCount] = useState(5);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [papers, setPapers] = useState<Paper[]>([]);
  const [selectedPaper, setSelectedPaper] = useState<string>("");

  // Fetch available papers
  useEffect(() => {
    if (isOpen) {
      fetch("/api/pairwise/papers")
        .then((res) => res.json())
        .then((data) => {
          setPapers(data.papers || []);
          // Default to first paper if none selected
          if (!selectedPaper && data.papers?.length > 0) {
            setSelectedPaper(data.papers[0].slug);
          }
        })
        .catch(() => {});
    }
  }, [isOpen, selectedPaper]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const body: Record<string, unknown> = {
        evaluatorType,
        // Human runs don't have a target - they go until Finish is clicked
        // Use a high number so the run doesn't auto-complete
        targetCount: evaluatorType === "human" ? 9999 : targetCount,
      };

      if (evaluatorType === "human") {
        if (!evaluatorName.trim()) {
          setError("Please enter your name");
          setIsSubmitting(false);
          return;
        }
        body.evaluator = evaluatorName.trim();
      } else {
        const model = AI_MODELS.find((m) => m.id === aiModel);
        body.evaluator = model?.name || aiModel;
        body.aiModel = aiModel;
      }

      // Add paper filter
      if (selectedPaper) {
        const paper = papers.find((p) => p.slug === selectedPaper);
        body.paperSlug = selectedPaper;
        body.paperName = paper?.name || selectedPaper;
      }

      const res = await fetch("/api/pairwise/runs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create run");
      }

      onCreated();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
        <h2 className="text-xl font-semibold mb-4">New evaluation run</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Evaluator Type Selection */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Evaluator type
            </label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setEvaluatorType("ai")}
                className={`flex-1 px-4 py-2 rounded-md font-medium transition-all ${
                  evaluatorType === "ai"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                AI
              </button>
              <button
                type="button"
                onClick={() => setEvaluatorType("human")}
                className={`flex-1 px-4 py-2 rounded-md font-medium transition-all ${
                  evaluatorType === "human"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Human
              </button>
            </div>
          </div>

          {/* Paper Selection */}
          <div>
            <label className="block text-sm font-medium mb-2">Paper</label>
            <div className="space-y-2">
              {papers.map((paper) => (
                <label
                  key={paper.slug}
                  className={`flex items-center p-3 border rounded-md cursor-pointer transition-all ${
                    selectedPaper === paper.slug
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="paper"
                    value={paper.slug}
                    checked={selectedPaper === paper.slug}
                    onChange={(e) => setSelectedPaper(e.target.value)}
                    className="mr-3"
                  />
                  <div className="font-medium">{paper.name}</div>
                </label>
              ))}
            </div>
          </div>

          {/* AI Model Selection */}
          {evaluatorType === "ai" && (
            <div>
              <label className="block text-sm font-medium mb-2">AI model</label>
              <div className="space-y-2">
                {AI_MODELS.map((model) => (
                  <label
                    key={model.id}
                    className={`flex items-center p-3 border rounded-md cursor-pointer transition-all ${
                      aiModel === model.id
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="aiModel"
                      value={model.id}
                      checked={aiModel === model.id}
                      onChange={(e) => setAiModel(e.target.value)}
                      className="mr-3"
                    />
                    <div>
                      <div className="font-medium">{model.name}</div>
                      <div className="text-sm text-gray-500">
                        {model.description}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Human Name */}
          {evaluatorType === "human" && (
            <div>
              <label className="block text-sm font-medium mb-2">Your name</label>
              <input
                type="text"
                value={evaluatorName}
                onChange={(e) => setEvaluatorName(e.target.value)}
                placeholder="e.g., Peter Hartree"
                className="w-full border rounded-md px-3 py-2"
              />
            </div>
          )}

          {/* Target Count - only for AI runs */}
          {evaluatorType === "ai" && (
            <div>
              <label className="block text-sm font-medium mb-2">
                Number of pairs to evaluate
              </label>
              <input
                type="number"
                value={targetCount}
                onChange={(e) => setTargetCount(parseInt(e.target.value) || 1)}
                min={1}
                max={totalPairs}
                className="w-full border rounded-md px-3 py-2"
              />
              <p className="text-sm text-gray-500 mt-1">
                {totalPairs} pairs available in total
              </p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3 text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md font-medium hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {isSubmitting
                ? evaluatorType === "ai"
                  ? "Starting..."
                  : "Creating..."
                : evaluatorType === "ai"
                ? "Start run"
                : "Create run"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
