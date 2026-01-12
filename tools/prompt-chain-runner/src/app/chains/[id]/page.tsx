import { getChain, getPromptTemplate } from "@/lib/chains";
import { getChainRuns } from "@/lib/persistence";
import { notFound } from "next/navigation";
import { ChainInputForm } from "@/components/ChainInputForm";
import { Breadcrumb } from "@/components/Breadcrumb";
import { StepViewer } from "@/components/StepViewer";
import { RunListItem } from "@/components/RunListItem";

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

  // Load prompts for all steps
  const stepsWithPrompts = await Promise.all(
    chain.steps.map(async (step) => {
      const prompt = await getPromptTemplate(id, step.prompt);
      return { ...step, promptContent: prompt };
    })
  );

  return (
    <div className="space-y-6">
      <Breadcrumb
        items={[
          { label: "Dashboard", href: "/" },
          { label: chain.meta.name },
        ]}
      />

      <header>
        <h1 className="text-xl font-bold">{chain.meta.name}</h1>
        {chain.meta.description && (
          <p className="text-gray-600 text-sm mt-1">{chain.meta.description}</p>
        )}
      </header>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Recent runs + New run */}
        <div className="lg:col-span-2 space-y-6">
          {/* Recent runs */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                Recent runs
              </h2>
            </div>
            {runs.length === 0 ? (
              <p className="text-gray-500 text-sm">No runs yet.</p>
            ) : (
              <div className="space-y-2">
                {runs.map((run) => (
                  <RunListItem
                    key={run.id}
                    runId={run.id}
                    chainId={run.chainId}
                    title={extractRunTitle(run) || run.id}
                    dateTime={formatDateTime(run.startedAt)}
                    status={run.status}
                  />
                ))}
              </div>
            )}
          </section>

          {/* Start new run */}
          <section>
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
              Start new run
            </h2>
            <ChainInputForm chain={chain} />
          </section>
        </div>

        {/* Right column: Steps */}
        <div className="space-y-6">
          <section>
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
              Steps ({chain.steps.length})
            </h2>
            <StepViewer
              steps={stepsWithPrompts}
              defaultModel={chain.config?.default_model || "claude-sonnet-4"}
            />
          </section>
        </div>
      </div>
    </div>
  );
}

// Extract title from run inputs
function extractRunTitle(run: { inputs: Record<string, unknown> }): string | null {
  const titleFields = ["title", "paper_title", "name", "subject", "topic"];
  for (const field of titleFields) {
    const value = run.inputs[field];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  // Try to extract from markdown content
  const contentFields = ["paper", "content", "text", "markdown"];
  for (const field of contentFields) {
    const value = run.inputs[field];
    if (typeof value === "string") {
      const match = value.match(/^#\s+(.+?)(?:\n|$)/m);
      if (match) {
        return match[1].trim();
      }
    }
  }

  return null;
}

// Format datetime compactly
function formatDateTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}
