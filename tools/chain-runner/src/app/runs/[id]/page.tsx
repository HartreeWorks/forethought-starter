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

      <header className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-1">
            {chain?.meta.name || run.chainId}
          </h1>
          <p className="text-sm text-gray-500 font-mono">{run.id}</p>
          <p className="text-sm text-gray-500">
            Started {new Date(run.startedAt).toLocaleString()}
          </p>
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
