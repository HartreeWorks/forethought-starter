import { getChain } from "@/lib/chains";
import { getChainRuns } from "@/lib/persistence";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ChainInputForm } from "@/components/ChainInputForm";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ChainDetailPage({ params }: Props) {
  const { id } = await params;
  const chain = await getChain(id);

  if (!chain) {
    notFound();
  }

  const runs = await getChainRuns(id, 10);

  return (
    <div className="space-y-8">
      <div>
        <Link href="/" className="text-sm text-blue-600 hover:underline">
          &larr; Back to dashboard
        </Link>
      </div>

      <header>
        <h1 className="text-2xl font-bold mb-2">{chain.meta.name}</h1>
        {chain.meta.description && (
          <p className="text-gray-600">{chain.meta.description}</p>
        )}
        <div className="flex gap-2 mt-2">
          {chain.meta.tags?.map((tag) => (
            <span
              key={tag}
              className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded"
            >
              {tag}
            </span>
          ))}
        </div>
      </header>

      <section>
        <h2 className="text-lg font-semibold mb-3">Steps</h2>
        <div className="space-y-2">
          {chain.steps.map((step, index) => (
            <div
              key={step.id}
              className="flex items-center gap-3 p-3 border rounded"
            >
              <span className="w-6 h-6 flex items-center justify-center bg-gray-100 rounded-full text-sm font-medium">
                {index + 1}
              </span>
              <div>
                <div className="font-medium">{step.name}</div>
                <div className="text-sm text-gray-500">
                  {step.model || chain.config?.default_model || "claude-sonnet-4"}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-3">Start a new run</h2>
        <ChainInputForm chain={chain} />
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-3">Recent runs</h2>
        {runs.length === 0 ? (
          <p className="text-gray-500">No runs yet.</p>
        ) : (
          <div className="space-y-2">
            {runs.map((run) => (
              <Link
                key={run.id}
                href={`/runs/${run.id}`}
                className="flex items-center justify-between p-3 border rounded hover:border-blue-500 transition-colors"
              >
                <div>
                  <span className="font-mono text-sm">{run.id}</span>
                  <span className="text-gray-400 mx-2">·</span>
                  <span className="text-sm text-gray-500">
                    {new Date(run.startedAt).toLocaleString()}
                  </span>
                </div>
                <StatusBadge status={run.status} />
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: "bg-gray-100 text-gray-700",
    running: "bg-blue-100 text-blue-700",
    completed: "bg-green-100 text-green-700",
    failed: "bg-red-100 text-red-700",
  };

  return (
    <span
      className={`px-2 py-1 text-xs font-medium rounded ${styles[status] || styles.pending}`}
    >
      {status}
    </span>
  );
}
