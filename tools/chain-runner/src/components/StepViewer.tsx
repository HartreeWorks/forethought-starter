"use client";

import { useState } from "react";
import type { ChainStep } from "@/lib/types";

interface StepWithPrompt extends ChainStep {
  promptContent: string;
}

interface Props {
  steps: StepWithPrompt[];
  defaultModel: string;
}

export function StepViewer({ steps, defaultModel }: Props) {
  const [expandedStep, setExpandedStep] = useState<string | null>(null);

  return (
    <div className="space-y-2">
      {steps.map((step, index) => {
        const isExpanded = expandedStep === step.id;

        return (
          <div key={step.id} className="border rounded overflow-hidden bg-white">
            {/* Step header - always visible */}
            <button
              onClick={() => setExpandedStep(isExpanded ? null : step.id)}
              className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 text-left"
            >
              <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-gray-100 rounded-full text-xs font-medium">
                {index + 1}
              </span>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm truncate">{step.name}</div>
                <div className="text-xs text-gray-500">
                  {step.model || defaultModel}
                </div>
              </div>
              <span
                className={`text-gray-400 text-lg transition-transform ${isExpanded ? "rotate-90" : ""}`}
              >
                ›
              </span>
            </button>

            {/* Expanded prompt content */}
            {isExpanded && (
              <div className="border-t bg-gray-50 p-3">
                <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                  Prompt template
                </div>
                <pre className="text-xs text-gray-700 whitespace-pre-wrap font-mono bg-white p-3 rounded border max-h-64 overflow-auto">
                  {step.promptContent}
                </pre>
                {step.output?.type && (
                  <div className="mt-3 text-xs text-gray-500">
                    Output type: <span className="font-medium">{step.output.type}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
