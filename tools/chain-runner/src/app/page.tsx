import { getChains } from "@/lib/chains";
import { getRecentRuns } from "@/lib/persistence";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const chains = await getChains();
  const recentRuns = await getRecentRuns(10);

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-2xl font-bold mb-4">Chains</h1>
        {chains.length === 0 ? (
          <p className="text-gray-500">
            No chains defined yet. Create a chain in the{" "}
            <code className="bg-gray-100 px-1 rounded">chains/</code> directory.
          </p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {chains.map((chain) => (
              <Link
                key={chain.meta.id}
                href={`/chains/${chain.meta.id}`}
                className="block p-4 border rounded-lg hover:border-blue-500 hover:shadow-sm transition-all"
              >
                <h2 className="font-semibold mb-1">{chain.meta.name}</h2>
                <p className="text-sm text-gray-600 mb-2">
                  {chain.meta.description}
                </p>
                <p className="text-xs text-gray-400">
                  {chain.steps.length} steps
                </p>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-xl font-bold mb-4">Recent runs</h2>
        {recentRuns.length === 0 ? (
          <p className="text-gray-500">No runs yet. Start a chain to create one.</p>
        ) : (
          <div className="space-y-2">
            {recentRuns.map((run) => (
              <Link
                key={run.id}
                href={`/runs/${run.id}`}
                className="flex items-center justify-between p-3 border rounded hover:border-blue-500 transition-colors"
              >
                <div>
                  <span className="font-medium">{run.chainId}</span>
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
