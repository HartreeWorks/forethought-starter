import { loadRunById } from "@/lib/persistence";
import { getChain } from "@/lib/chains";
import { notFound } from "next/navigation";
import Link from "next/link";
import { RunViewer } from "@/components/RunViewer";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function RunDetailPage({ params }: Props) {
  const { id } = await params;
  const run = await loadRunById(id);

  if (!run) {
    notFound();
  }

  const chain = await getChain(run.chainId);

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/chains/${run.chainId}`}
          className="text-sm text-blue-600 hover:underline"
        >
          &larr; Back to {chain?.meta.name || run.chainId}
        </Link>
      </div>

      <header className="flex items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-bold truncate">
            {getRunTitle(run.inputs) || chain?.meta.name || run.chainId}
          </h1>
          <div className="flex items-center gap-3 text-sm text-gray-500 mt-0.5">
            {getRunTitle(run.inputs) && (
              <span>{chain?.meta.name || run.chainId}</span>
            )}
            <span>{formatDateTime(run.startedAt)}</span>
            {getInputUrl(run.inputs) && (
              <a
                href={getInputUrl(run.inputs)!}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                View source
              </a>
            )}
          </div>
        </div>
        <StatusBadge status={run.status} />
      </header>

      <RunViewer
        runId={run.id}
        chainId={run.chainId}
        initialRun={run}
        steps={chain?.steps || []}
      />
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: "bg-gray-100 text-gray-700",
    running: "bg-blue-100 text-blue-700 animate-pulse",
    completed: "bg-green-100 text-green-700",
    failed: "bg-red-100 text-red-700",
  };

  return (
    <span
      className={`px-3 py-1.5 text-sm font-medium rounded ${styles[status] || styles.pending}`}
    >
      {status}
    </span>
  );
}

// Extract a human-readable title from run inputs
function getRunTitle(inputs: Record<string, unknown>): string | null {
  // Check explicit title fields first
  const titleFields = ["title", "paper_title", "name", "subject", "topic"];
  for (const field of titleFields) {
    const value = inputs[field];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  // Try to extract title from markdown content (look for first H1)
  const contentFields = ["paper", "content", "text", "markdown"];
  for (const field of contentFields) {
    const value = inputs[field];
    if (typeof value === "string") {
      // Match # Title at start of line
      const match = value.match(/^#\s+(.+?)(?:\n|$)/m);
      if (match) {
        return match[1].trim();
      }
    }
  }

  return null;
}

// Extract URL from inputs if available
function getInputUrl(inputs: Record<string, unknown>): string | null {
  const urlFields = ["url", "source_url", "paper_url", "link"];
  for (const field of urlFields) {
    const value = inputs[field];
    if (typeof value === "string" && value.startsWith("http")) {
      return value;
    }
  }
  return null;
}

// Format datetime in a compact, readable way
function formatDateTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
