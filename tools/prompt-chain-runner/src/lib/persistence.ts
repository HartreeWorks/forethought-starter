import fs from "fs/promises";
import path from "path";
import Handlebars from "handlebars";
import { RunState, StepRunState, InstanceRunState, Chain, ChainStep } from "./types";
import { getChain, getOutputTemplate } from "./chains";

// Get default runs directory path
function getDefaultRunsDir(): string {
  const envDir = process.env.RUNS_DIR;
  if (envDir) {
    return path.isAbsolute(envDir)
      ? envDir
      : path.resolve(process.cwd(), envDir);
  }
  // Default: prompt-chains/runs/ relative to forethought-starter root
  return path.resolve(process.cwd(), "../../prompt-chains/runs");
}

// Get runs directory for a specific chain (supports per-chain output_dir)
function getRunsDir(chainOutputDir?: string): string {
  if (chainOutputDir) {
    return path.isAbsolute(chainOutputDir)
      ? chainOutputDir
      : path.resolve(process.cwd(), chainOutputDir);
  }
  return getDefaultRunsDir();
}

// Generate a unique run ID
export function generateRunId(): string {
  const now = new Date();
  const timestamp = now.toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const random = Math.random().toString(36).slice(2, 8);
  return `${timestamp}-${random}`;
}

// Get run directory path
export function getRunDir(chainId: string, runId: string, outputDir?: string): string {
  return path.join(getRunsDir(outputDir), chainId, runId);
}

// Create a new run
export async function createRun(
  chainId: string,
  inputs: Record<string, unknown>,
  outputDir?: string
): Promise<RunState> {
  const runId = generateRunId();
  const runDir = getRunDir(chainId, runId, outputDir);

  // Create directory
  await fs.mkdir(runDir, { recursive: true });
  await fs.mkdir(path.join(runDir, "steps"), { recursive: true });

  const run: RunState = {
    id: runId,
    chainId,
    status: "pending",
    startedAt: new Date().toISOString(),
    inputs,
    steps: {},
    outputDir, // Store for later lookups
  };

  // Save run state
  await saveRunState(run);

  // Save inputs as markdown
  await fs.writeFile(
    path.join(runDir, "input.md"),
    formatInputsAsMarkdown(inputs),
    "utf-8"
  );

  return run;
}

// Save run state to disk
export async function saveRunState(run: RunState): Promise<void> {
  const runDir = getRunDir(run.chainId, run.id, run.outputDir);
  await fs.writeFile(
    path.join(runDir, "run.json"),
    JSON.stringify(run, null, 2),
    "utf-8"
  );
}

// Load run state from disk
export async function loadRunState(
  chainId: string,
  runId: string
): Promise<RunState | null> {
  const runDir = getRunDir(chainId, runId);

  try {
    const content = await fs.readFile(path.join(runDir, "run.json"), "utf-8");
    return JSON.parse(content) as RunState;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return null;
    }
    throw error;
  }
}

// Load run state by run ID (searches all chains)
export async function loadRunById(runId: string): Promise<RunState | null> {
  const runsDir = getRunsDir();

  try {
    const chainDirs = await fs.readdir(runsDir, { withFileTypes: true });

    for (const chainDir of chainDirs) {
      if (!chainDir.isDirectory()) continue;

      const runPath = path.join(runsDir, chainDir.name, runId, "run.json");
      try {
        const content = await fs.readFile(runPath, "utf-8");
        return JSON.parse(content) as RunState;
      } catch {
        // Run not in this chain directory
        continue;
      }
    }

    return null;
  } catch {
    return null;
  }
}

// Register Handlebars helpers for markdown output
function registerMarkdownHelpers(): void {
  // JSON stringify helper
  Handlebars.registerHelper("json", (context) => JSON.stringify(context, null, 2));

  // Escape markdown special characters in a string
  Handlebars.registerHelper("escape", (text: string) => {
    if (typeof text !== "string") return text;
    return text
      .replace(/\\/g, "\\\\")
      .replace(/\*/g, "\\*")
      .replace(/_/g, "\\_")
      .replace(/\[/g, "\\[")
      .replace(/\]/g, "\\]");
  });

  // Format field name (snake_case to Title Case)
  Handlebars.registerHelper("fieldName", (name: string) => {
    if (typeof name !== "string") return name;
    return name
      .replace(/_/g, " ")
      .replace(/([a-z])([A-Z])/g, "$1 $2")
      .replace(/\b\w/g, (c) => c.toUpperCase());
  });

  // Conditional equality helper
  Handlebars.registerHelper("if_eq", function (this: unknown, a, b, options) {
    return a === b ? (options as any).fn(this) : (options as any).inverse(this);
  });

  // Check if value is long text (>100 chars)
  Handlebars.registerHelper("isLongText", function (this: unknown, value, options) {
    const isLong = typeof value === "string" && value.length > 100;
    return isLong ? (options as any).fn(this) : (options as any).inverse(this);
  });
}

// Save step output
export async function saveStepOutput(
  run: RunState,
  stepId: string,
  output: unknown,
  step?: ChainStep
): Promise<void> {
  const runDir = getRunDir(run.chainId, run.id, run.outputDir);
  const stepIndex = Object.keys(run.steps).indexOf(stepId) + 1;
  const prefix = String(stepIndex).padStart(2, "0");

  // Save JSON output
  await fs.writeFile(
    path.join(runDir, "steps", `${prefix}-${stepId}.json`),
    JSON.stringify(output, null, 2),
    "utf-8"
  );

  // Save markdown output using template if available
  let markdown: string;

  if (step?.display?.template) {
    // Use Handlebars template
    const templateContent = await getOutputTemplate(run.chainId, step.display.template);
    if (templateContent) {
      registerMarkdownHelpers();
      const template = Handlebars.compile(templateContent);
      markdown = template({ items: output, output, stepId, stepName: step.name });
    } else {
      // Template not found, fall back to default formatting
      markdown = formatOutputAsMarkdown(stepId, output);
    }
  } else {
    // No template specified, use default formatting
    markdown = formatOutputAsMarkdown(stepId, output);
  }

  await fs.writeFile(
    path.join(runDir, "steps", `${prefix}-${stepId}.md`),
    markdown,
    "utf-8"
  );
}

// Format output as readable markdown
function formatOutputAsMarkdown(stepId: string, output: unknown): string {
  // Handle arrays of objects (most common case for critique chains)
  if (Array.isArray(output)) {
    return formatArrayAsMarkdown(stepId, output);
  }

  // Handle single objects with specific structures
  if (output && typeof output === "object") {
    return formatObjectAsMarkdown(stepId, output as Record<string, unknown>);
  }

  // Handle plain text/prose
  if (typeof output === "string") {
    return output;
  }

  // Fallback: JSON
  return "```json\n" + JSON.stringify(output, null, 2) + "\n```";
}

// Format array of items as markdown
function formatArrayAsMarkdown(stepId: string, items: unknown[]): string {
  const lines: string[] = [];
  const titleCase = stepId.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  lines.push(`# ${titleCase}\n`);

  for (let i = 0; i < items.length; i++) {
    const item = items[i] as Record<string, unknown>;
    if (!item || typeof item !== "object") {
      lines.push(`## Item ${i + 1}\n`);
      lines.push(String(item));
      lines.push("");
      continue;
    }

    // Use title/short/id for heading
    const heading = item.title || item.short || item.conversational_title || item.id || `Item ${i + 1}`;
    lines.push(`## ${heading}\n`);

    // Format known fields nicely
    for (const [key, value] of Object.entries(item)) {
      // Skip fields used in heading
      if (key === "title" || key === "short" || key === "conversational_title") continue;
      // Skip id if it's just a reference
      if (key === "id" && typeof value === "string" && value.match(/^c?\d+$/)) continue;
      if (key === "parentId") continue;

      if (typeof value === "string" && value.length > 100) {
        // Long text fields - render as content
        lines.push(value);
        lines.push("");
      } else if (typeof value === "string") {
        // Short text fields - render as metadata
        lines.push(`**${formatFieldName(key)}:** ${value}\n`);
      } else if (typeof value === "number") {
        lines.push(`**${formatFieldName(key)}:** ${value}\n`);
      } else if (Array.isArray(value)) {
        lines.push(`**${formatFieldName(key)}:**`);
        for (const v of value) {
          lines.push(`- ${v}`);
        }
        lines.push("");
      }
    }

    lines.push("---\n");
  }

  return lines.join("\n");
}

// Format object as markdown
function formatObjectAsMarkdown(stepId: string, obj: Record<string, unknown>): string {
  const lines: string[] = [];
  const titleCase = stepId.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  lines.push(`# ${titleCase}\n`);

  for (const [key, value] of Object.entries(obj)) {
    if (Array.isArray(value)) {
      lines.push(`## ${formatFieldName(key)}\n`);
      lines.push(formatArrayAsMarkdown(key, value).replace(/^# .*\n/, ""));
    } else if (value && typeof value === "object") {
      lines.push(`## ${formatFieldName(key)}\n`);
      lines.push("```json");
      lines.push(JSON.stringify(value, null, 2));
      lines.push("```\n");
    } else if (typeof value === "string" && value.length > 100) {
      lines.push(`## ${formatFieldName(key)}\n`);
      lines.push(value);
      lines.push("");
    } else {
      lines.push(`**${formatFieldName(key)}:** ${value}\n`);
    }
  }

  return lines.join("\n");
}

// Format field name for display
function formatFieldName(name: string): string {
  return name
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

// Get recent runs across all chains
export async function getRecentRuns(limit: number = 10): Promise<RunState[]> {
  const runsDir = getRunsDir();
  const runs: RunState[] = [];

  try {
    const chainDirs = await fs.readdir(runsDir, { withFileTypes: true });

    for (const chainDir of chainDirs) {
      if (!chainDir.isDirectory()) continue;
      if (chainDir.name.startsWith(".")) continue;

      const chainRunsPath = path.join(runsDir, chainDir.name);
      const runDirs = await fs.readdir(chainRunsPath, { withFileTypes: true });

      for (const runDir of runDirs) {
        if (!runDir.isDirectory()) continue;

        try {
          const runPath = path.join(chainRunsPath, runDir.name, "run.json");
          const content = await fs.readFile(runPath, "utf-8");
          runs.push(JSON.parse(content) as RunState);
        } catch {
          // Skip invalid runs
          continue;
        }
      }
    }

    // Sort by startedAt descending and limit
    runs.sort(
      (a, b) =>
        new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
    );

    return runs.slice(0, limit);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return [];
    }
    throw error;
  }
}

// Get runs for a specific chain
export async function getChainRuns(
  chainId: string,
  limit: number = 20
): Promise<RunState[]> {
  const chainRunsDir = path.join(getRunsDir(), chainId);
  const runs: RunState[] = [];

  try {
    const runDirs = await fs.readdir(chainRunsDir, { withFileTypes: true });

    for (const runDir of runDirs) {
      if (!runDir.isDirectory()) continue;

      try {
        const runPath = path.join(chainRunsDir, runDir.name, "run.json");
        const content = await fs.readFile(runPath, "utf-8");
        runs.push(JSON.parse(content) as RunState);
      } catch {
        continue;
      }
    }

    runs.sort(
      (a, b) =>
        new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
    );

    return runs.slice(0, limit);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return [];
    }
    throw error;
  }
}

// Delete a run by ID
export async function deleteRun(runId: string): Promise<boolean> {
  const runsDir = getRunsDir();

  try {
    const chainDirs = await fs.readdir(runsDir, { withFileTypes: true });

    for (const chainDir of chainDirs) {
      if (!chainDir.isDirectory()) continue;

      const runPath = path.join(runsDir, chainDir.name, runId);
      try {
        await fs.access(runPath);
        // Run directory exists, delete it
        await fs.rm(runPath, { recursive: true, force: true });
        return true;
      } catch {
        // Run not in this chain directory
        continue;
      }
    }

    return false; // Run not found
  } catch (error) {
    console.error("Error deleting run:", error);
    return false;
  }
}

// Format inputs as markdown
function formatInputsAsMarkdown(inputs: Record<string, unknown>): string {
  const lines = ["# Run Inputs\n"];

  for (const [key, value] of Object.entries(inputs)) {
    lines.push(`## ${key}\n`);

    if (typeof value === "string") {
      lines.push(value);
    } else {
      lines.push("```json");
      lines.push(JSON.stringify(value, null, 2));
      lines.push("```");
    }

    lines.push("\n");
  }

  return lines.join("\n");
}

// Save for_each step output (multiple instances)
export async function saveForEachStepOutput(
  run: RunState,
  stepId: string,
  outputs: unknown[],
  instances: InstanceRunState[],
  step?: ChainStep
): Promise<void> {
  const runDir = getRunDir(run.chainId, run.id, run.outputDir);
  const stepIndex = Object.keys(run.steps).indexOf(stepId) + 1;
  const prefix = String(stepIndex).padStart(2, "0");

  // Save combined JSON output (array of all outputs)
  await fs.writeFile(
    path.join(runDir, "steps", `${prefix}-${stepId}.json`),
    JSON.stringify(outputs, null, 2),
    "utf-8"
  );

  // Save individual instance outputs
  for (let i = 0; i < outputs.length; i++) {
    await fs.writeFile(
      path.join(runDir, "steps", `${prefix}-${stepId}_${i}.json`),
      JSON.stringify(outputs[i], null, 2),
      "utf-8"
    );
  }

  // Generate combined markdown
  const markdown = formatForEachOutputAsMarkdown(stepId, outputs, instances, step);
  await fs.writeFile(
    path.join(runDir, "steps", `${prefix}-${stepId}.md`),
    markdown,
    "utf-8"
  );
}

// Format for_each output as markdown
function formatForEachOutputAsMarkdown(
  stepId: string,
  outputs: unknown[],
  instances: InstanceRunState[],
  step?: ChainStep
): string {
  const lines: string[] = [];
  const titleCase = stepId.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  lines.push(`# ${titleCase}\n`);
  lines.push(`*${outputs.length} instances completed*\n`);

  for (let i = 0; i < outputs.length; i++) {
    const output = outputs[i];
    const instance = instances[i];
    const durationSec = instance?.durationMs ? (instance.durationMs / 1000).toFixed(1) : "?";
    const tokens = instance?.tokens
      ? `${instance.tokens.input} in / ${instance.tokens.output} out`
      : "";

    lines.push(`## Instance ${i + 1}`);
    if (tokens) {
      lines.push(`*Duration: ${durationSec}s | Tokens: ${tokens}*\n`);
    }

    // Format the output
    if (Array.isArray(output)) {
      // If output is an array, show count and first few items
      lines.push(`**${output.length} items generated**\n`);
      for (let j = 0; j < Math.min(3, output.length); j++) {
        const item = output[j] as Record<string, unknown>;
        if (item && typeof item === "object") {
          const preview = item.short || item.title || item.objection || item.argument || item.id || JSON.stringify(item).slice(0, 100);
          lines.push(`- ${preview}`);
        } else {
          lines.push(`- ${String(item).slice(0, 100)}`);
        }
      }
      if (output.length > 3) {
        lines.push(`- ... and ${output.length - 3} more`);
      }
      lines.push("");
    } else if (output && typeof output === "object") {
      // Format object
      for (const [key, value] of Object.entries(output)) {
        if (typeof value === "string" && value.length > 200) {
          lines.push(`**${formatFieldName(key)}:** ${value.slice(0, 200)}...`);
        } else if (typeof value === "string" || typeof value === "number") {
          lines.push(`**${formatFieldName(key)}:** ${value}`);
        }
      }
      lines.push("");
    } else {
      lines.push(String(output).slice(0, 500));
      lines.push("");
    }

    lines.push("---\n");
  }

  return lines.join("\n");
}
