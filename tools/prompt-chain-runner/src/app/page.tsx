import { getChains } from "@/lib/chains";
import { getRecentRuns } from "@/lib/persistence";
import Link from "next/link";
import { RunListItem } from "@/components/RunListItem";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const chains = await getChains();
  const recentRuns = await getRecentRuns(10);

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-xl font-bold mb-4">Prompt chains</h1>
        {chains.length === 0 ? (
          <p className="text-gray-500">
            No prompt chains defined yet. Create one in the{" "}
            <code className="bg-gray-100 px-1 rounded">prompt-chains/chains/</code> directory.
          </p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {chains.map((chain) => (
              <Link
                key={chain.meta.id}
                href={`/chains/${chain.meta.id}`}
                className="block p-4 border rounded-lg bg-white hover:border-blue-500 hover:shadow-sm transition-all"
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
        <h2 className="text-lg font-bold mb-4">Recent runs</h2>
        {recentRuns.length === 0 ? (
          <p className="text-gray-500 text-sm">No runs yet. Start a prompt chain to create one.</p>
        ) : (
          <div className="space-y-2">
            {recentRuns.map((run) => (
              <RunListItem
                key={run.id}
                runId={run.id}
                chainId={run.chainId}
                title={run.chainId}
                dateTime={formatDateTime(run.startedAt)}
                status={run.status}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function formatDateTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}
