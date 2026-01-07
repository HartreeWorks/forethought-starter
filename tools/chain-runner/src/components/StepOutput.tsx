"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { ChainStep, StepRunState } from "@/lib/types";

interface Props {
  step: ChainStep;
  stepState?: StepRunState;
}

export function StepOutput({ step, stepState }: Props) {
  if (!stepState) {
    return (
      <div className="p-8 border rounded text-center text-gray-500">
        Step not yet started
      </div>
    );
  }

  if (stepState.status === "running") {
    return (
      <div className="p-8 border rounded text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-4"></div>
        <p className="text-gray-600">Running {step.name}...</p>
      </div>
    );
  }

  if (stepState.status === "failed") {
    return (
      <div className="p-4 border border-red-200 bg-red-50 rounded">
        <h3 className="font-semibold text-red-700 mb-2">Step failed</h3>
        <pre className="text-sm text-red-600 whitespace-pre-wrap">
          {stepState.error}
        </pre>
      </div>
    );
  }

  const output = stepState.output;
  const displayType = step.display?.type;

  // Handle arrays
  if (Array.isArray(output)) {
    // Check if items have long text fields that need expandable treatment
    const hasLongContent = output.length > 0 && hasLongTextFields(output[0]);

    if (hasLongContent || displayType === "cards") {
      return <ExpandableListRenderer data={output} displayHints={step.display} />;
    }

    if (displayType === "table" || hasTableableItems(output)) {
      return <ExpandableTableRenderer data={output} displayHints={step.display} />;
    }

    return <ArrayRenderer data={output} />;
  }

  // Handle objects with nested arrays (like score step)
  if (typeof output === "object" && output !== null) {
    return <StructuredObjectRenderer data={output as Record<string, unknown>} />;
  }

  // Fallback: render as prose
  return <ProseRenderer content={String(output)} />;
}

// Check if an object has fields with long text content
function hasLongTextFields(obj: unknown): boolean {
  if (typeof obj !== "object" || obj === null) return false;
  const record = obj as Record<string, unknown>;
  const longFields = ["expanded", "deep", "revised", "counter", "rationale"];
  return longFields.some(
    (field) => typeof record[field] === "string" && (record[field] as string).length > 200
  );
}

function hasTableableItems(arr: unknown[]): boolean {
  if (arr.length === 0) return false;
  const first = arr[0];
  return typeof first === "object" && first !== null && !Array.isArray(first);
}

// Prose/markdown renderer
function ProseRenderer({ content }: { content: string }) {
  return (
    <div className="prose prose-sm max-w-none p-4 border rounded">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  );
}

// Inline markdown for shorter text
function InlineMarkdown({ content }: { content: string }) {
  return (
    <span className="prose prose-sm max-w-none [&>p]:inline [&>p]:m-0">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </span>
  );
}

// Table with expandable rows for additional content
function ExpandableTableRenderer({
  data,
  displayHints,
}: {
  data: Record<string, unknown>[];
  displayHints?: { columns?: string[]; sort_by?: string; sort_order?: string };
}) {
  const [expandedRow, setExpandedRow] = useState<number | null>(null);

  if (data.length === 0) {
    return <div className="p-4 border rounded text-gray-500">No data</div>;
  }

  // Get columns from hints or infer from first item
  const allKeys = Object.keys(data[0]);
  const columns = displayHints?.columns || allKeys.filter((k) => k !== "id");

  // Fields that are hidden but shown on expand
  const expandableFields = allKeys.filter(
    (k) => !columns.includes(k) && k !== "id" && typeof data[0][k] === "string"
  );

  // Apply sorting
  let sorted = [...data];
  if (displayHints?.sort_by) {
    sorted.sort((a, b) => {
      const aVal = a[displayHints.sort_by!];
      const bVal = b[displayHints.sort_by!];
      if (typeof aVal === "number" && typeof bVal === "number") {
        return displayHints.sort_order === "asc" ? aVal - bVal : bVal - aVal;
      }
      return 0;
    });
  }

  return (
    <div className="border rounded overflow-hidden">
      <table className="w-full">
        <thead className="bg-gray-50">
          <tr>
            {expandableFields.length > 0 && <th className="w-8"></th>}
            {columns.map((col) => (
              <th
                key={col}
                className="px-4 py-3 text-left text-sm font-semibold text-gray-700"
              >
                {formatColumnName(col)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y">
          {sorted.map((row, idx) => (
            <>
              <tr
                key={idx}
                onClick={() => expandableFields.length > 0 && setExpandedRow(expandedRow === idx ? null : idx)}
                className={`${expandableFields.length > 0 ? "cursor-pointer" : ""} hover:bg-gray-50`}
              >
                {expandableFields.length > 0 && (
                  <td className="px-2 py-3 text-gray-400">
                    <span className={`inline-block transition-transform ${expandedRow === idx ? "rotate-90" : ""}`}>
                      ›
                    </span>
                  </td>
                )}
                {columns.map((col) => (
                  <td key={col} className="px-4 py-3 text-sm">
                    <CellValue value={row[col]} />
                  </td>
                ))}
              </tr>
              {expandedRow === idx && expandableFields.length > 0 && (
                <tr key={`${idx}-expanded`} className="bg-gray-50">
                  <td colSpan={columns.length + 1} className="px-4 py-4">
                    <div className="space-y-3">
                      {expandableFields.map((field) => (
                        <div key={field}>
                          <div className="text-xs font-medium text-gray-500 uppercase mb-1">
                            {formatColumnName(field)}
                          </div>
                          <div className="text-sm prose prose-sm max-w-none">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                              {String(row[field])}
                            </ReactMarkdown>
                          </div>
                        </div>
                      ))}
                    </div>
                  </td>
                </tr>
              )}
            </>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// List renderer for items with long content (expandable cards)
function ExpandableListRenderer({
  data,
  displayHints,
}: {
  data: Record<string, unknown>[];
  displayHints?: { sort_by?: string; sort_order?: string };
}) {
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());

  // Apply sorting
  let sorted = [...data];
  if (displayHints?.sort_by) {
    sorted.sort((a, b) => {
      const aVal = a[displayHints.sort_by!];
      const bVal = b[displayHints.sort_by!];
      if (typeof aVal === "number" && typeof bVal === "number") {
        return displayHints.sort_order === "asc" ? aVal - bVal : bVal - aVal;
      }
      return 0;
    });
  }

  const toggleExpand = (idx: number) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) {
        next.delete(idx);
      } else {
        next.add(idx);
      }
      return next;
    });
  };

  return (
    <div className="space-y-3">
      {sorted.map((item, idx) => (
        <ExpandableCard
          key={idx}
          item={item}
          isExpanded={expandedItems.has(idx)}
          onToggle={() => toggleExpand(idx)}
        />
      ))}
    </div>
  );
}

function ExpandableCard({
  item,
  isExpanded,
  onToggle,
}: {
  item: Record<string, unknown>;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  // Determine title and summary fields
  const title = item.title || item.short || item.conversational_title || item.id || "Item";
  const summary = item.summary as string | undefined;

  // Long content fields (shown when expanded)
  const longFields = ["expanded", "deep", "revised", "counter"];
  const expandableContent = longFields
    .filter((f) => typeof item[f] === "string" && (item[f] as string).length > 0)
    .map((f) => ({ field: f, content: item[f] as string }));

  // Short metadata fields
  const metaFields = Object.entries(item).filter(
    ([k, v]) =>
      !["id", "title", "short", "conversational_title", "summary", "parentId", ...longFields].includes(k) &&
      typeof v !== "object" &&
      v !== null
  );

  const hasExpandableContent = expandableContent.length > 0;

  return (
    <div className="border rounded overflow-hidden">
      {/* Header - always visible */}
      <div
        onClick={hasExpandableContent ? onToggle : undefined}
        className={`p-4 ${hasExpandableContent ? "cursor-pointer hover:bg-gray-50" : ""}`}
      >
        <div className="flex items-start gap-3">
          {hasExpandableContent && (
            <span className={`text-gray-400 mt-1 transition-transform ${isExpanded ? "rotate-90" : ""}`}>
              ›
            </span>
          )}
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-gray-900">{String(title)}</h4>
            {summary && (
              <p className="mt-1 text-sm text-gray-600">{summary}</p>
            )}
            {metaFields.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                {metaFields.map(([key, value]) => (
                  <span key={key}>
                    <span className="font-medium">{formatColumnName(key)}:</span>{" "}
                    {typeof value === "number" ? value : String(value)}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Expanded content */}
      {isExpanded && expandableContent.length > 0 && (
        <div className="border-t bg-gray-50 p-4">
          {expandableContent.map(({ field, content }) => (
            <div key={field} className="prose prose-sm max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Renderer for structured objects (like score step with scores array + top5)
function StructuredObjectRenderer({ data }: { data: Record<string, unknown> }) {
  const sections: JSX.Element[] = [];

  for (const [key, value] of Object.entries(data)) {
    if (Array.isArray(value) && value.length > 0) {
      const isTableable = typeof value[0] === "object" && value[0] !== null;

      sections.push(
        <div key={key} className="mb-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">
            {formatColumnName(key)}
          </h3>
          {isTableable ? (
            key.includes("top") || key.includes("detail") ? (
              // Top selections - show as a nice list
              <TopSelectionsRenderer data={value as Record<string, unknown>[]} />
            ) : (
              // Scores - show as table
              <ScoresTableRenderer data={value as Record<string, unknown>[]} />
            )
          ) : (
            <ul className="list-disc list-inside text-sm">
              {value.map((item, i) => (
                <li key={i}>{String(item)}</li>
              ))}
            </ul>
          )}
        </div>
      );
    } else if (typeof value === "string" || typeof value === "number") {
      sections.push(
        <div key={key} className="mb-4">
          <span className="text-sm font-medium text-gray-500">{formatColumnName(key)}:</span>{" "}
          <span className="text-sm">{String(value)}</span>
        </div>
      );
    }
  }

  return <div className="p-4 border rounded">{sections}</div>;
}

// Compact scores table
function ScoresTableRenderer({ data }: { data: Record<string, unknown>[] }) {
  if (data.length === 0) return null;

  const columns = Object.keys(data[0]).filter((k) => k !== "id");

  return (
    <div className="border rounded overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-3 py-2 text-left font-medium text-gray-600">ID</th>
            {columns.map((col) => (
              <th key={col} className="px-3 py-2 text-left font-medium text-gray-600">
                {formatColumnName(col)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y">
          {data.map((row, idx) => (
            <tr key={idx} className="hover:bg-gray-50">
              <td className="px-3 py-2 font-mono text-xs">{String(row.id)}</td>
              {columns.map((col) => (
                <td key={col} className="px-3 py-2">
                  {typeof row[col] === "number" ? row[col] : String(row[col] ?? "—")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Top selections (like top5_details)
function TopSelectionsRenderer({ data }: { data: Record<string, unknown>[] }) {
  return (
    <ol className="space-y-2">
      {data.map((item, idx) => (
        <li key={idx} className="flex gap-3 p-3 bg-gray-50 rounded">
          <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
            {idx + 1}
          </span>
          <div className="flex-1 min-w-0">
            <div className="font-medium text-sm">
              {String(item.id || item.title || `Item ${idx + 1}`)}
            </div>
            {item.explanation && (
              <p className="mt-1 text-sm text-gray-600">{String(item.explanation)}</p>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}

function ArrayRenderer({ data }: { data: unknown[] }) {
  return (
    <ul className="p-4 border rounded space-y-2">
      {data.map((item, idx) => (
        <li key={idx} className="flex gap-2">
          <span className="text-gray-400">{idx + 1}.</span>
          <span>{typeof item === "object" ? JSON.stringify(item) : String(item)}</span>
        </li>
      ))}
    </ul>
  );
}

// Cell value with optional markdown rendering
function CellValue({ value }: { value: unknown }) {
  if (value === null || value === undefined) return <span className="text-gray-400">—</span>;
  if (typeof value === "boolean") return <span>{value ? "Yes" : "No"}</span>;
  if (typeof value === "number") return <span>{value.toLocaleString()}</span>;
  if (Array.isArray(value)) return <span>{value.join(", ")}</span>;
  if (typeof value === "object") return <span className="text-xs font-mono">{JSON.stringify(value)}</span>;

  // For strings, check if it looks like markdown
  const str = String(value);
  if (str.includes("**") || str.includes("*") || str.includes("`") || str.includes("#")) {
    return <InlineMarkdown content={str} />;
  }
  return <span>{str}</span>;
}

function formatColumnName(name: string): string {
  return name
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/^./, (s) => s.toUpperCase());
}
