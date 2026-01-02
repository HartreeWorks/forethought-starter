"use client";

import { useEffect, useState } from "react";
import type { RunState, ChainStep, StepRunState } from "@/lib/types";
import { StepOutput } from "./StepOutput";

interface Props {
  runId: string;
  chainId: string;
  initialRun: RunState;
  steps: ChainStep[];
}

export function RunViewer({ runId, chainId, initialRun, steps }: Props) {
  const [run, setRun] = useState<RunState>(initialRun);
  const [selectedStep, setSelectedStep] = useState<string | null>(null);

  // Subscribe to SSE updates
  useEffect(() => {
    if (run.status === "completed" || run.status === "failed") {
      return;
    }

    const eventSource = new EventSource(`/api/runs/${runId}/stream`);

    eventSource.addEventListener("state", (event) => {
      const data = JSON.parse(event.data);
      setRun((prev) => ({ ...prev, ...data }));
    });

    eventSource.addEventListener("step:started", (event) => {
      const data = JSON.parse(event.data);
      setRun((prev) => ({
        ...prev,
        currentStep: data.stepId,
        steps: {
          ...prev.steps,
          [data.stepId]: {
            status: "running",
            startedAt: new Date().toISOString(),
          },
        },
      }));
    });

    eventSource.addEventListener("step:completed", (event) => {
      const data = JSON.parse(event.data);
      setRun((prev) => ({
        ...prev,
        steps: {
          ...prev.steps,
          [data.stepId]: {
            status: "completed",
            completedAt: new Date().toISOString(),
            output: data.output,
            durationMs: data.durationMs,
            tokens: data.tokens,
          },
        },
      }));
    });

    eventSource.addEventListener("step:failed", (event) => {
      const data = JSON.parse(event.data);
      setRun((prev) => ({
        ...prev,
        steps: {
          ...prev.steps,
          [data.stepId]: {
            status: "failed",
            completedAt: new Date().toISOString(),
            error: data.error,
          },
        },
      }));
    });

    eventSource.addEventListener("run:completed", () => {
      setRun((prev) => ({
        ...prev,
        status: "completed",
        completedAt: new Date().toISOString(),
      }));
      eventSource.close();
    });

    eventSource.addEventListener("run:failed", (event) => {
      const data = JSON.parse(event.data);
      setRun((prev) => ({
        ...prev,
        status: "failed",
        completedAt: new Date().toISOString(),
        error: data.error,
      }));
      eventSource.close();
    });

    eventSource.onerror = () => {
      // Attempt to reconnect or handle error
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, [runId, run.status]);

  // Auto-select current step
  useEffect(() => {
    if (run.currentStep && !selectedStep) {
      setSelectedStep(run.currentStep);
    }
  }, [run.currentStep, selectedStep]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Step timeline */}
      <div className="lg:col-span-1">
        <h2 className="text-lg font-semibold mb-3">Steps</h2>
        <div className="space-y-2">
          {steps.map((step, index) => {
            const stepState = run.steps[step.id];
            const isActive = run.currentStep === step.id;
            const isSelected = selectedStep === step.id;

            return (
              <button
                key={step.id}
                onClick={() => setSelectedStep(step.id)}
                className={`w-full flex items-center gap-3 p-3 border rounded text-left transition-colors ${
                  isSelected
                    ? "border-blue-500 bg-blue-50"
                    : "hover:border-gray-300"
                }`}
              >
                <StepIndicator
                  index={index + 1}
                  status={stepState?.status}
                  isActive={isActive}
                />
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{step.name}</div>
                  {stepState?.durationMs && (
                    <div className="text-xs text-gray-500">
                      {(stepState.durationMs / 1000).toFixed(1)}s
                      {stepState.tokens && (
                        <span className="ml-2">
                          {stepState.tokens.input + stepState.tokens.output} tokens
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {run.error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
            <strong>Error:</strong> {run.error}
          </div>
        )}
      </div>

      {/* Step output */}
      <div className="lg:col-span-2">
        <h2 className="text-lg font-semibold mb-3">Output</h2>
        {selectedStep ? (
          <StepOutput
            step={steps.find((s) => s.id === selectedStep)!}
            stepState={run.steps[selectedStep]}
          />
        ) : (
          <div className="p-8 border rounded text-center text-gray-500">
            Select a step to view its output
          </div>
        )}
      </div>
    </div>
  );
}

function StepIndicator({
  index,
  status,
  isActive,
}: {
  index: number;
  status?: string;
  isActive: boolean;
}) {
  if (status === "completed") {
    return (
      <span className="w-6 h-6 flex items-center justify-center bg-green-500 text-white rounded-full text-sm">
        ✓
      </span>
    );
  }

  if (status === "failed") {
    return (
      <span className="w-6 h-6 flex items-center justify-center bg-red-500 text-white rounded-full text-sm">
        ✕
      </span>
    );
  }

  if (status === "running" || isActive) {
    return (
      <span className="w-6 h-6 flex items-center justify-center bg-blue-500 text-white rounded-full text-sm animate-pulse">
        {index}
      </span>
    );
  }

  return (
    <span className="w-6 h-6 flex items-center justify-center bg-gray-200 text-gray-600 rounded-full text-sm">
      {index}
    </span>
  );
}
