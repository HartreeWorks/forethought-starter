import Handlebars from "handlebars";
import { exec } from "child_process";
import { promisify } from "util";
import { Chain, ChainStep, RunState, StepRunState, SSEEvent } from "./types";
import { getChain, getPromptTemplate } from "./chains";
import { createRun, saveRunState, saveStepOutput } from "./persistence";
import { callModel } from "./models";

const execAsync = promisify(exec);

// Event emitter for SSE
type EventCallback = (event: SSEEvent) => void;
const runSubscribers = new Map<string, Set<EventCallback>>();

// Subscribe to run events
export function subscribeToRun(runId: string, callback: EventCallback): () => void {
  if (!runSubscribers.has(runId)) {
    runSubscribers.set(runId, new Set());
  }
  runSubscribers.get(runId)!.add(callback);

  return () => {
    runSubscribers.get(runId)?.delete(callback);
    if (runSubscribers.get(runId)?.size === 0) {
      runSubscribers.delete(runId);
    }
  };
}

// Emit event to subscribers
function emitEvent(runId: string, type: SSEEvent["type"], data: unknown): void {
  const event: SSEEvent = {
    type,
    data,
    timestamp: Date.now(),
  };

  runSubscribers.get(runId)?.forEach((callback) => {
    try {
      callback(event);
    } catch (error) {
      console.error("Error in SSE callback:", error);
    }
  });
}

// Resolve variable references like $inputs.paper or $steps.brainstorm.output
function resolveVariable(
  path: string,
  context: {
    inputs: Record<string, unknown>;
    steps: Record<string, { output?: unknown }>;
  }
): unknown {
  if (!path.startsWith("$")) {
    return path; // Literal value
  }

  const parts = path.slice(1).split(".");

  if (parts[0] === "inputs") {
    return getNestedValue(context.inputs, parts.slice(1));
  }

  if (parts[0] === "steps") {
    const stepId = parts[1];
    const stepData = context.steps[stepId];
    if (!stepData) {
      throw new Error(`Step "${stepId}" not found or not completed yet`);
    }
    return getNestedValue(stepData, parts.slice(2));
  }

  throw new Error(`Unknown variable prefix: ${parts[0]}`);
}

// Get nested value from object
function getNestedValue(obj: unknown, path: string[]): unknown {
  let current = obj;

  for (const key of path) {
    if (current === null || current === undefined) {
      return undefined;
    }
    if (typeof current !== "object") {
      return undefined;
    }
    current = (current as Record<string, unknown>)[key];
  }

  return current;
}

// Resolve all input mappings for a step
function resolveStepInputs(
  step: ChainStep,
  context: {
    inputs: Record<string, unknown>;
    steps: Record<string, { output?: unknown }>;
  }
): Record<string, unknown> {
  const resolved: Record<string, unknown> = {};

  if (!step.input) {
    // Default: pass all chain inputs
    return { ...context.inputs };
  }

  for (const [key, value] of Object.entries(step.input)) {
    resolved[key] = resolveVariable(value, context);
  }

  return resolved;
}

// Render prompt template with Handlebars
async function renderPrompt(
  chainId: string,
  step: ChainStep,
  variables: Record<string, unknown>
): Promise<string> {
  const templateContent = await getPromptTemplate(chainId, step.prompt);

  // Register Handlebars helpers
  Handlebars.registerHelper("json", (context) => JSON.stringify(context, null, 2));
  Handlebars.registerHelper("if_eq", function (this: unknown, a, b, options) {
    return a === b ? (options as any).fn(this) : (options as any).inverse(this);
  });

  const template = Handlebars.compile(templateContent);
  return template(variables);
}

// Execute a single step
async function executeStep(
  chain: Chain,
  step: ChainStep,
  run: RunState
): Promise<void> {
  const stepState: StepRunState = {
    status: "running",
    startedAt: new Date().toISOString(),
  };

  run.steps[step.id] = stepState;
  run.currentStep = step.id;
  await saveRunState(run);

  emitEvent(run.id, "step:started", {
    stepId: step.id,
    stepName: step.name,
  });

  const startTime = Date.now();

  try {
    // Resolve inputs
    const stepInputs = resolveStepInputs(step, {
      inputs: run.inputs,
      steps: run.steps,
    });

    // Render prompt
    const prompt = await renderPrompt(chain.meta.id, step, stepInputs);

    // Determine model
    const model = step.model || chain.config?.default_model || "claude-sonnet-4";

    // Call model
    const result = await callModel({
      model,
      prompt,
      maxTokens: step.config?.max_tokens,
      temperature: step.config?.temperature,
      outputType: step.output?.type || "text",
    });

    // Update step state
    stepState.status = "completed";
    stepState.completedAt = new Date().toISOString();
    stepState.output = result.output;
    stepState.outputText = result.text;
    stepState.durationMs = Date.now() - startTime;
    stepState.tokens = result.usage;

    await saveRunState(run);
    await saveStepOutput(run, step.id, result.output, result.text);

    emitEvent(run.id, "step:completed", {
      stepId: step.id,
      stepName: step.name,
      output: result.output,
      durationMs: stepState.durationMs,
      tokens: result.usage,
    });
  } catch (error) {
    stepState.status = "failed";
    stepState.completedAt = new Date().toISOString();
    stepState.error = error instanceof Error ? error.message : String(error);
    stepState.durationMs = Date.now() - startTime;

    await saveRunState(run);

    emitEvent(run.id, "step:failed", {
      stepId: step.id,
      stepName: step.name,
      error: stepState.error,
    });

    throw error;
  }
}

// Send desktop notification
async function sendNotification(
  title: string,
  message: string
): Promise<void> {
  try {
    // Use terminal-notifier on macOS
    await execAsync(
      `terminal-notifier -title "${title.replace(/"/g, '\\"')}" -message "${message.replace(/"/g, '\\"')}" -sound default`
    );
  } catch (error) {
    console.warn("Failed to send notification:", error);
  }
}

// Execute a full chain
export async function executeChain(
  chainId: string,
  inputs: Record<string, unknown>
): Promise<RunState> {
  // Load chain
  const chain = await getChain(chainId);
  if (!chain) {
    throw new Error(`Chain "${chainId}" not found`);
  }

  // Create run (pass chain's output_dir if configured)
  const outputDir = chain.config?.output_dir;
  const run = await createRun(chainId, inputs, outputDir);

  emitEvent(run.id, "run:started", {
    runId: run.id,
    chainId,
    chainName: chain.meta.name,
    stepCount: chain.steps.length,
  });

  run.status = "running";
  await saveRunState(run);

  try {
    // Execute each step in sequence
    for (const step of chain.steps) {
      await executeStep(chain, step, run);
    }

    // Mark run as completed
    run.status = "completed";
    run.completedAt = new Date().toISOString();
    run.currentStep = undefined;
    await saveRunState(run);

    emitEvent(run.id, "run:completed", {
      runId: run.id,
      chainId,
      chainName: chain.meta.name,
    });

    // Send notification
    if (chain.config?.notify_on_complete !== false) {
      await sendNotification(
        `Chain completed: ${chain.meta.name}`,
        `Finished ${chain.steps.length} steps successfully`
      );
    }

    return run;
  } catch (error) {
    run.status = "failed";
    run.completedAt = new Date().toISOString();
    run.error = error instanceof Error ? error.message : String(error);
    await saveRunState(run);

    emitEvent(run.id, "run:failed", {
      runId: run.id,
      chainId,
      error: run.error,
    });

    // Send failure notification
    if (chain.config?.notify_on_complete !== false) {
      await sendNotification(
        `Chain failed: ${chain.meta.name}`,
        run.error || "Unknown error"
      );
    }

    return run;
  }
}

// Get current run state (for polling)
export function getRunState(runId: string): RunState | null {
  // This is a simplified version - in practice we'd track active runs
  return null;
}
