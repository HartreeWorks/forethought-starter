"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Chain } from "@/lib/types";

interface Props {
  chain: Chain;
}

export function ChainInputForm({ chain }: Props) {
  const router = useRouter();
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/runs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chainId: chain.meta.id,
          inputs,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to start run");
      }

      // Redirect to the run page
      if (data.runId) {
        router.push(`/runs/${data.runId}`);
      } else {
        // Fallback: go to chain page and refresh
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const chainInputs = chain.inputs || [];

  // If no inputs defined, show a simple text input
  if (chainInputs.length === 0) {
    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">
            Input
          </label>
          <textarea
            name="input"
            value={inputs.input || ""}
            onChange={(e) => setInputs({ ...inputs, input: e.target.value })}
            className="w-full p-3 border rounded bg-white font-mono text-sm min-h-[200px]"
            placeholder="Enter your input here..."
          />
        </div>

        {error && (
          <div className="p-3 bg-red-50 text-red-700 rounded text-sm">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {isSubmitting ? "Starting..." : "Start run"}
        </button>
      </form>
    );
  }

  // Separate boolean inputs (shown as compact toggles below submit)
  const booleanInputs = chainInputs.filter((input) => input.type === "boolean");
  const otherInputs = chainInputs.filter((input) => input.type !== "boolean");

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {otherInputs.map((input) => (
        <div key={input.id}>
          <label className="block text-sm font-medium mb-1">
            {input.name || input.id}
            {input.required && <span className="text-red-500 ml-1">*</span>}
          </label>
          {input.description && (
            <p className="text-sm text-gray-500 mb-1">{input.description}</p>
          )}

          {input.type === "text" && (
            <textarea
              name={input.id}
              value={inputs[input.id] || ""}
              onChange={(e) =>
                setInputs({ ...inputs, [input.id]: e.target.value })
              }
              className="w-full p-3 border rounded bg-white font-mono text-sm min-h-[150px]"
              placeholder={input.placeholder}
              required={input.required}
            />
          )}

          {input.type === "choice" && input.options && (
            <div className="space-y-1">
              {input.options.map((option) => (
                <label
                  key={option.id}
                  className="flex items-center gap-2 p-2 border rounded bg-white hover:bg-gray-50 cursor-pointer"
                >
                  <input
                    type={input.multiple ? "checkbox" : "radio"}
                    name={input.id}
                    value={option.id}
                    checked={
                      input.multiple
                        ? (inputs[input.id] || "").split(",").includes(option.id)
                        : inputs[input.id] === option.id
                    }
                    onChange={(e) => {
                      if (input.multiple) {
                        const current = (inputs[input.id] || "")
                          .split(",")
                          .filter(Boolean);
                        const newValue = e.target.checked
                          ? [...current, option.id]
                          : current.filter((v) => v !== option.id);
                        setInputs({ ...inputs, [input.id]: newValue.join(",") });
                      } else {
                        setInputs({ ...inputs, [input.id]: option.id });
                      }
                    }}
                    className="rounded"
                  />
                  <span>{option.label}</span>
                </label>
              ))}
            </div>
          )}

          {input.type === "number" && (
            <input
              type="number"
              name={input.id}
              value={inputs[input.id] || ""}
              onChange={(e) =>
                setInputs({ ...inputs, [input.id]: e.target.value })
              }
              className="w-full p-2 border rounded bg-white"
              placeholder={input.placeholder}
              required={input.required}
            />
          )}

          {input.type === "url" && (
            <input
              type="url"
              name={input.id}
              value={inputs[input.id] || ""}
              onChange={(e) =>
                setInputs({ ...inputs, [input.id]: e.target.value })
              }
              className="w-full p-2 border rounded bg-white"
              placeholder={input.placeholder || "https://..."}
              required={input.required}
            />
          )}
        </div>
      ))}

      {error && (
        <div className="p-3 bg-red-50 text-red-700 rounded text-sm">{error}</div>
      )}

      <div>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {isSubmitting ? "Starting..." : "Start run"}
        </button>

        {/* Boolean toggles as compact inline options */}
        {booleanInputs.map((input) => (
          <label key={input.id} className="flex items-center gap-2 mt-2 text-xs text-gray-500 cursor-pointer">
            <input
              type="checkbox"
              name={input.id}
              checked={inputs[input.id] === "true"}
              onChange={(e) =>
                setInputs({
                  ...inputs,
                  [input.id]: e.target.checked ? "true" : "false",
                })
              }
              className="rounded"
            />
            <span>{input.name || input.id}{input.description && ` — ${input.description}`}</span>
          </label>
        ))}
      </div>
    </form>
  );
}
