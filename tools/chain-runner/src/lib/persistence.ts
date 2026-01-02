import fs from "fs/promises";
import path from "path";
import { RunState, StepRunState } from "./types";

// Get default runs directory path
function getDefaultRunsDir(): string {
  const envDir = process.env.RUNS_DIR;
  if (envDir) {
    return path.isAbsolute(envDir)
      ? envDir
      : path.resolve(process.cwd(), envDir);
  }
  // Default: runs/ inside chain-runner directory
  return path.resolve(process.cwd(), "runs");
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

// Save step output
export async function saveStepOutput(
  run: RunState,
  stepId: string,
  output: unknown,
  outputText?: string
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

  // Save markdown output if available
  if (outputText) {
    await fs.writeFile(
      path.join(runDir, "steps", `${prefix}-${stepId}.md`),
      outputText,
      "utf-8"
    );
  }
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
