"use client";

import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { ChainStep, StepRunState } from "@/lib/types";

// Critique lookup type for resolving IDs to human-readable titles
type CritiqueLookup = Map<string, { title: string; category?: string }>;

interface Props {
  step: ChainStep;
  stepState?: StepRunState;
  allSteps?: Record<string, StepRunState>;
}

export function StepOutput({ step, stepState, allSteps }: Props) {
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

  // Build critique lookup from brainstorm step if available
  const critiqueLookup = buildCritiqueLookup(allSteps);

  const output = stepState.output;
  const displayType = step.display?.type;
  const stepId = step.id;

  // Special handling for brainstorm step (step 1)
  if (stepId === "brainstorm" && Array.isArray(output)) {
    return <BrainstormRenderer data={output as Record<string, unknown>[]} />;
  }

  // Special handling for score step (step 2)
  if (stepId === "score" && typeof output === "object" && output !== null) {
    return <ScoreStepRenderer data={output as Record<string, unknown>} critiqueLookup={critiqueLookup} />;
  }

  // Handle arrays
  if (Array.isArray(output)) {
    // Flatten nested arrays from for_each steps: [[...], [...], ...] -> [...]
    let items = output;
    if (items.length > 0 && Array.isArray(items[0])) {
      items = items.flat();
    }

    // Check if items have long text fields that need expandable treatment
    const hasLongContent = items.length > 0 && hasLongTextFields(items[0]);

    if (hasLongContent || displayType === "cards") {
      return <ExpandableListRenderer data={items} displayHints={step.display} critiqueLookup={critiqueLookup} />;
    }

    if (displayType === "table" || hasTableableItems(items)) {
      return <ExpandableTableRenderer data={items} displayHints={step.display} />;
    }

    return <ArrayRenderer data={items} />;
  }

  // Handle objects with nested arrays
  if (typeof output === "object" && output !== null) {
    return <StructuredObjectRenderer data={output as Record<string, unknown>} critiqueLookup={critiqueLookup} />;
  }

  // Fallback: render as prose
  return <ProseRenderer content={String(output)} />;
}

// Build lookup from brainstorm step output
function buildCritiqueLookup(allSteps?: Record<string, StepRunState>): CritiqueLookup {
  const lookup: CritiqueLookup = new Map();
  if (!allSteps) return lookup;

  // Look for brainstorm step
  const brainstormState = allSteps["brainstorm"];
  if (brainstormState?.status === "completed" && Array.isArray(brainstormState.output)) {
    for (const item of brainstormState.output) {
      if (typeof item === "object" && item !== null) {
        const record = item as Record<string, unknown>;
        const id = record.id as string;
        const title = (record.short || record.title || record.conversational_title) as string;
        const category = record.category as string | undefined;
        if (id && title) {
          lookup.set(id, { title, category });
        }
      }
    }
  }

  return lookup;
}

// Check if an object has fields with long text content
function hasLongTextFields(obj: unknown): boolean {
  if (typeof obj !== "object" || obj === null) return false;

  // Handle nested arrays from for_each steps: [[...], [...], ...]
  if (Array.isArray(obj)) {
    const first = obj[0];
    if (Array.isArray(first) && first.length > 0) {
      // It's a nested array - check the first item of the first inner array
      return hasLongTextFields(first[0]);
    }
    return false;
  }

  const record = obj as Record<string, unknown>;
  // Include common long text fields from moral philosophy chains
  const longFields = ["expanded", "deep", "revised", "counter", "rationale", "objection", "argument", "reasoning", "assessment_summary", "ranking_rationale"];
  return longFields.some(
    (field) => typeof record[field] === "string" && (record[field] as string).length > 100
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
    <div className="prose prose-sm max-w-none p-4 border rounded [&_h2]:text-base [&_h2]:mt-4 [&_h2]:mb-2 [&_h3]:text-sm [&_h3]:mt-3 [&_h3]:mb-1">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  );
}

// Brainstorm step - custom layout with category pills
function BrainstormRenderer({ data }: { data: Record<string, unknown>[] }) {
  return (
    <div className="space-y-3">
      {data.map((item, idx) => (
        <BrainstormCard key={idx} item={item} />
      ))}
    </div>
  );
}

function BrainstormCard({ item }: { item: Record<string, unknown> }) {
  const title = (item.short || item.title) as string;
  const category = item.category as string | undefined;
  const rationale = item.rationale as string | undefined;
  const novelty = item.novelty as number | undefined;
  const risk = item.risk as number | undefined;

  return (
    <div className="border rounded p-4">
      {/* Header with title and category pill */}
      <div className="flex items-start justify-between gap-3 mb-2">
        <h4 className="font-semibold text-gray-900">{title}</h4>
        {category && (
          <span className="flex-shrink-0 px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 rounded">
            {category}
          </span>
        )}
      </div>

      {/* Rationale - directly beneath title */}
      {rationale && (
        <p className="text-sm text-gray-800 mb-3">{rationale}</p>
      )}

      {/* Novelty and Risk - smaller, muted */}
      {(novelty !== undefined || risk !== undefined) && (
        <div className="flex gap-4 text-xs text-gray-500">
          {novelty !== undefined && (
            <span>Novelty: <span className="font-medium text-gray-600">{novelty}</span></span>
          )}
          {risk !== undefined && (
            <span>Risk: <span className="font-medium text-gray-600">{risk}</span></span>
          )}
        </div>
      )}
    </div>
  );
}

// Score step - custom renderer with critique title lookup
function ScoreStepRenderer({
  data,
  critiqueLookup
}: {
  data: Record<string, unknown>;
  critiqueLookup: CritiqueLookup;
}) {
  const scores = data.scores as Record<string, unknown>[] | undefined;
  const top5 = data.top5 as string[] | undefined;
  const top5Details = data.top5_details as Record<string, unknown>[] | undefined;

  return (
    <div className="p-4 border rounded space-y-6">
      {/* Scores table */}
      {scores && scores.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">
            Scores
          </h3>
          <ScoresTableWithTitles data={scores} critiqueLookup={critiqueLookup} />
        </div>
      )}

      {/* Top 5 selections */}
      {(top5Details || top5) && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">
            Top 5
          </h3>
          {top5Details ? (
            <TopSelectionsWithTitles data={top5Details} critiqueLookup={critiqueLookup} />
          ) : top5 ? (
            <TopSelectionsSimple ids={top5} critiqueLookup={critiqueLookup} />
          ) : null}
        </div>
      )}
    </div>
  );
}

// Scores table with critique titles and sortable columns
function ScoresTableWithTitles({
  data,
  critiqueLookup
}: {
  data: Record<string, unknown>[];
  critiqueLookup: CritiqueLookup;
}) {
  const columns = Object.keys(data[0] || {}).filter((k) => k !== "id");

  // Default sort: "overall" descending if present, otherwise first numeric column
  const defaultSortCol = columns.includes("overall") ? "overall" : columns.find(c => typeof data[0]?.[c] === "number") || null;

  const [sortCol, setSortCol] = useState<string | null>(defaultSortCol);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  if (data.length === 0) return null;

  // Sort data
  const sorted = [...data].sort((a, b) => {
    if (!sortCol) return 0;
    const aVal = a[sortCol];
    const bVal = b[sortCol];

    // Handle critique title sorting
    if (sortCol === "_title") {
      const aTitle = critiqueLookup.get(String(a.id))?.title || String(a.id);
      const bTitle = critiqueLookup.get(String(b.id))?.title || String(b.id);
      return sortDir === "asc"
        ? aTitle.localeCompare(bTitle)
        : bTitle.localeCompare(aTitle);
    }

    if (typeof aVal === "number" && typeof bVal === "number") {
      return sortDir === "asc" ? aVal - bVal : bVal - aVal;
    }
    if (typeof aVal === "string" && typeof bVal === "string") {
      return sortDir === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    }
    return 0;
  });

  const handleSort = (col: string) => {
    if (sortCol === col) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortCol(col);
      // Default to desc for numbers, asc for strings
      const firstVal = data[0]?.[col];
      setSortDir(typeof firstVal === "number" ? "desc" : "asc");
    }
  };

  const SortIndicator = ({ col }: { col: string }) => {
    if (sortCol !== col) return <span className="text-gray-300 ml-1">↕</span>;
    return <span className="text-blue-500 ml-1">{sortDir === "asc" ? "↑" : "↓"}</span>;
  };

  return (
    <div className="border rounded overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th
              className="px-3 py-2 text-left font-medium text-gray-700 cursor-pointer hover:bg-gray-100 select-none"
              onClick={() => handleSort("_title")}
            >
              Critique <SortIndicator col="_title" />
            </th>
            {columns.map((col) => (
              <th
                key={col}
                className="px-3 py-2 text-left font-medium text-gray-700 cursor-pointer hover:bg-gray-100 select-none"
                onClick={() => handleSort(col)}
              >
                {formatColumnName(col)} <SortIndicator col={col} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y">
          {sorted.map((row, idx) => {
            const id = String(row.id);
            const critique = critiqueLookup.get(id);
            return (
              <tr key={idx} className="hover:bg-gray-50">
                <td className="px-3 py-2">
                  <span className="text-gray-900">{critique?.title || id}</span>
                </td>
                {columns.map((col) => (
                  <td key={col} className="px-3 py-2 text-gray-700">
                    {typeof row[col] === "number" ? row[col] : String(row[col] ?? "—")}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// Top selections with critique titles (from top5_details)
function TopSelectionsWithTitles({
  data,
  critiqueLookup
}: {
  data: Record<string, unknown>[];
  critiqueLookup: CritiqueLookup;
}) {
  return (
    <ol className="space-y-2">
      {data.map((item, idx) => {
        const id = String(item.id);
        const critique = critiqueLookup.get(id);
        return (
          <li key={idx} className="flex gap-3 p-3 bg-gray-50 rounded">
            <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
              {idx + 1}
            </span>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm text-gray-900">
                {critique?.title || id}
              </div>
              {typeof item.explanation === "string" && item.explanation && (
                <p className="mt-1 text-sm text-gray-600">{item.explanation}</p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

// Simple top5 list (just IDs)
function TopSelectionsSimple({
  ids,
  critiqueLookup
}: {
  ids: string[];
  critiqueLookup: CritiqueLookup;
}) {
  return (
    <ol className="space-y-2">
      {ids.map((id, idx) => {
        const critique = critiqueLookup.get(id);
        return (
          <li key={idx} className="flex gap-3 p-3 bg-gray-50 rounded">
            <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
              {idx + 1}
            </span>
            <div className="font-medium text-sm text-gray-900">
              {critique?.title || id}
            </div>
          </li>
        );
      })}
    </ol>
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

  // Long text fields that should go in expandable section, not columns
  const longTextFields = ["reasoning", "assessment_summary", "ranking_rationale", "objection", "argument"];

  // Filter out long text fields from columns
  const columns = (displayHints?.columns || allKeys.filter((k) => k !== "id"))
    .filter(k => !longTextFields.includes(k));

  // Fields that are shown on expand (including long text fields)
  const expandableFields = allKeys.filter(
    (k) => !columns.includes(k) && k !== "id" &&
    (longTextFields.includes(k) || (typeof data[0][k] === "string" && !columns.includes(k)))
  );

  // Apply sorting - default to "overall" descending if present
  let sorted = [...data];
  const sortBy = displayHints?.sort_by || (allKeys.includes("overall") ? "overall" : null);
  const sortOrder = displayHints?.sort_order || "desc";
  if (sortBy) {
    sorted.sort((a, b) => {
      const aVal = a[sortBy];
      const bVal = b[sortBy];
      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortOrder === "asc" ? aVal - bVal : bVal - aVal;
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
                  <td key={col} className="px-4 py-3 text-sm text-gray-800">
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
                          <div className="text-xs font-medium text-gray-600 uppercase mb-1">
                            {formatColumnName(field)}
                          </div>
                          <div className="text-sm prose prose-sm max-w-none text-gray-800">
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
  critiqueLookup,
}: {
  data: Record<string, unknown>[];
  displayHints?: { sort_by?: string; sort_order?: string };
  critiqueLookup?: CritiqueLookup;
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
          critiqueLookup={critiqueLookup}
        />
      ))}
    </div>
  );
}

function ExpandableCard({
  item,
  isExpanded,
  onToggle,
  critiqueLookup,
}: {
  item: Record<string, unknown>;
  isExpanded: boolean;
  onToggle: () => void;
  critiqueLookup?: CritiqueLookup;
}) {
  // Determine title - look up from critiqueLookup if we have an id/parentId
  let title: string;
  const id = (item.id || item.parentId) as string | undefined;

  if (id && critiqueLookup?.has(id)) {
    title = critiqueLookup.get(id)!.title;
  } else {
    // view_name is used by evaluate_views step
    title = (item.view_name || item.name || item.title || item.short || item.conversational_title || id || "Item") as string;
  }

  // For objection/argument cards, use the "objection" or "argument" field as summary
  const summary = (item.summary || item.objection || item.argument) as string | undefined;

  // Long content fields (shown when expanded)
  const longFields = ["expanded", "deep", "revised", "counter", "reasoning", "assessment_summary", "ranking_rationale"];
  const expandableContent = longFields
    .filter((f) => typeof item[f] === "string" && (item[f] as string).length > 0)
    .map((f) => ({ field: f, content: item[f] as string }));

  // Fields to exclude from metadata display
  const excludeFromMeta = ["id", "name", "title", "short", "conversational_title", "summary", "parentId", "objection", "argument", ...longFields];

  // Short metadata fields
  const metaFields = Object.entries(item).filter(
    ([k, v]) =>
      !excludeFromMeta.includes(k) &&
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
            <span className={`text-gray-500 text-lg leading-none mt-px transition-transform ${isExpanded ? "rotate-90" : ""}`}>
              ›
            </span>
          )}
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-gray-900">{String(title)}</h4>
            {summary && (
              <p className="mt-1 text-sm text-gray-700">{summary}</p>
            )}
            {metaFields.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                {metaFields.map(([key, value]) => (
                  <span key={key}>
                    <span className="font-medium text-gray-600">{formatColumnName(key)}:</span>{" "}
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
            <div key={field} className="prose prose-sm max-w-none text-gray-800 [&_h2]:text-base [&_h2]:mt-4 [&_h2]:mb-2 [&_h3]:text-sm [&_h3]:mt-3 [&_h3]:mb-1">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Renderer for structured objects (like score step with scores array + top5)
function StructuredObjectRenderer({
  data,
  critiqueLookup
}: {
  data: Record<string, unknown>;
  critiqueLookup?: CritiqueLookup;
}) {
  const sections: React.ReactNode[] = [];

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
              <TopSelectionsWithTitles data={value as Record<string, unknown>[]} critiqueLookup={critiqueLookup || new Map()} />
            ) : (
              <ScoresTableWithTitles data={value as Record<string, unknown>[]} critiqueLookup={critiqueLookup || new Map()} />
            )
          ) : (
            <ul className="list-disc list-inside text-sm text-gray-800">
              {value.map((item, i) => {
                const itemStr = String(item);
                const critique = critiqueLookup?.get(itemStr);
                return (
                  <li key={i}>{critique?.title || itemStr}</li>
                );
              })}
            </ul>
          )}
        </div>
      );
    } else if (typeof value === "string" || typeof value === "number") {
      sections.push(
        <div key={key} className="mb-4">
          <span className="text-sm font-medium text-gray-600">{formatColumnName(key)}:</span>{" "}
          <span className="text-sm text-gray-800">{String(value)}</span>
        </div>
      );
    }
  }

  return <div className="p-4 border rounded">{sections}</div>;
}

function ArrayRenderer({ data }: { data: unknown[] }) {
  return (
    <ul className="p-4 border rounded space-y-2">
      {data.map((item, idx) => (
        <li key={idx} className="flex gap-2">
          <span className="text-gray-500">{idx + 1}.</span>
          <span className="text-gray-800">{typeof item === "object" ? JSON.stringify(item) : String(item)}</span>
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

  // Handle arrays of objects (like applicable_objections)
  if (Array.isArray(value)) {
    // Check if array contains objects with name/id fields
    if (value.length > 0 && typeof value[0] === "object" && value[0] !== null) {
      const names = value.map((item: any) => item.name || item.id || "—").slice(0, 5);
      const suffix = value.length > 5 ? `, +${value.length - 5} more` : "";
      return <span className="text-sm">{names.join(", ")}{suffix}</span>;
    }
    // Simple array of primitives
    return <span>{value.join(", ")}</span>;
  }

  // Handle single objects
  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;
    // If object has a name or id, show that
    if (obj.name || obj.id) {
      return <span>{String(obj.name || obj.id)}</span>;
    }
    // Otherwise show a compact JSON representation
    return <span className="text-xs font-mono text-gray-500">{JSON.stringify(value)}</span>;
  }

  // For strings, check if it looks like markdown
  const str = String(value);
  if (str.includes("**") || str.includes("*") || str.includes("`") || str.includes("#")) {
    return <InlineMarkdown content={str} />;
  }
  return <span>{str}</span>;
}

// Inline markdown for shorter text
function InlineMarkdown({ content }: { content: string }) {
  return (
    <span className="prose prose-sm max-w-none [&>p]:inline [&>p]:m-0 text-gray-800">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </span>
  );
}

function formatColumnName(name: string): string {
  return name
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/^./, (s) => s.toUpperCase());
}
