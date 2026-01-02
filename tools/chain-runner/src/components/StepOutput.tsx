"use client";

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
  const outputType = step.output?.type || "text";
  const displayType = step.display?.type;

  // Render based on output type and display hints
  if (outputType === "prose" || (typeof output === "string" && !isJson(output))) {
    return <ProseRenderer content={String(output)} />;
  }

  if (Array.isArray(output)) {
    if (displayType === "table" || hasTableableItems(output)) {
      return <TableRenderer data={output} displayHints={step.display} />;
    }
    if (displayType === "cards") {
      return <CardsRenderer data={output} displayHints={step.display} />;
    }
    return <ArrayRenderer data={output} />;
  }

  if (typeof output === "object" && output !== null) {
    return <JsonRenderer data={output} />;
  }

  // Fallback: render as text
  return <ProseRenderer content={String(output)} />;
}

function isJson(str: string): boolean {
  try {
    JSON.parse(str);
    return true;
  } catch {
    return false;
  }
}

function hasTableableItems(arr: unknown[]): boolean {
  if (arr.length === 0) return false;
  const first = arr[0];
  return typeof first === "object" && first !== null && !Array.isArray(first);
}

function ProseRenderer({ content }: { content: string }) {
  return (
    <div className="prose max-w-none p-4 border rounded">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  );
}

function TableRenderer({
  data,
  displayHints,
}: {
  data: Record<string, unknown>[];
  displayHints?: { columns?: string[]; sort_by?: string; sort_order?: string };
}) {
  if (data.length === 0) {
    return <div className="p-4 border rounded text-gray-500">No data</div>;
  }

  // Get columns from hints or infer from first item
  const columns =
    displayHints?.columns || Object.keys(data[0]).filter((k) => k !== "id");

  // Apply sorting if specified
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
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
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
              <tr key={idx} className="hover:bg-gray-50">
                {columns.map((col) => (
                  <td key={col} className="px-4 py-3 text-sm">
                    {formatCellValue(row[col])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CardsRenderer({
  data,
  displayHints,
}: {
  data: Record<string, unknown>[];
  displayHints?: { group_by?: string; sort_by?: string; sort_order?: string };
}) {
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

  // Apply grouping
  const groups = displayHints?.group_by
    ? groupBy(sorted, displayHints.group_by)
    : { all: sorted };

  return (
    <div className="space-y-6">
      {Object.entries(groups).map(([group, items]) => (
        <div key={group}>
          {displayHints?.group_by && (
            <h3 className="text-lg font-semibold mb-3 capitalize">{group}</h3>
          )}
          <div className="grid gap-4 md:grid-cols-2">
            {items.map((item, idx) => (
              <div key={idx} className="p-4 border rounded hover:shadow-sm">
                <CardContent item={item} />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function CardContent({ item }: { item: Record<string, unknown> }) {
  const title =
    item.title || item.name || item.label || item.id || "Item";
  const entries = Object.entries(item).filter(
    ([k]) => !["id", "title", "name", "label"].includes(k)
  );

  return (
    <>
      <h4 className="font-medium mb-2">{String(title)}</h4>
      <div className="space-y-1 text-sm">
        {entries.slice(0, 4).map(([key, value]) => (
          <div key={key} className="flex justify-between">
            <span className="text-gray-500 capitalize">
              {formatColumnName(key)}:
            </span>
            <span className="text-right ml-2">{formatCellValue(value)}</span>
          </div>
        ))}
      </div>
    </>
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

function JsonRenderer({ data }: { data: unknown }) {
  return (
    <pre className="p-4 border rounded bg-gray-50 overflow-x-auto text-sm">
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}

function formatColumnName(name: string): string {
  return name
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/^./, (s) => s.toUpperCase());
}

function formatCellValue(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "number") return value.toLocaleString();
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function groupBy<T extends Record<string, unknown>>(
  arr: T[],
  key: string
): Record<string, T[]> {
  return arr.reduce(
    (acc, item) => {
      const group = String(item[key] || "other");
      if (!acc[group]) acc[group] = [];
      acc[group].push(item);
      return acc;
    },
    {} as Record<string, T[]>
  );
}
