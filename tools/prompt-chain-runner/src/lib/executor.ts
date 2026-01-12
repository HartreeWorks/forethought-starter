import Handlebars from "handlebars";
import { exec } from "child_process";
import { promisify } from "util";
import { Chain, ChainStep, RunState, StepRunState, InstanceRunState, SSEEvent } from "./types";
import { getChain, getPromptTemplate } from "./chains";
import { createRun, saveRunState, saveStepOutput, saveForEachStepOutput } from "./persistence";
import { callModel } from "./models";

const execAsync = promisify(exec);

// Context for for_each iteration
interface ForEachContext {
  item: unknown;
  index: number;
}

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

// Apply pipe operators to a value (e.g., "| flatten", "| top(10)")
function applyPipeOperators(value: unknown, operators: string[]): unknown {
  let result = value;

  for (const op of operators) {
    const trimmed = op.trim();

    if (trimmed === "flatten") {
      // Flatten nested arrays
      if (Array.isArray(result)) {
        result = result.flat();
      }
    } else if (trimmed.startsWith("top(") && trimmed.endsWith(")")) {
      // Get top N items (assumes array is already sorted by 'overall' score desc)
      const n = parseInt(trimmed.slice(4, -1), 10);
      if (Array.isArray(result)) {
        // Sort by 'overall' field if present, then take top N
        const sorted = [...result].sort((a: any, b: any) => {
          const aScore = a?.overall ?? a?.score ?? 0;
          const bScore = b?.overall ?? b?.score ?? 0;
          return bScore - aScore;
        });
        result = sorted.slice(0, n);
      }
    }
  }

  return result;
}

// Resolve variable references like $inputs.paper or $steps.brainstorm.output
// Also supports $item and $index within for_each context
// Supports pipe operators: $steps.generate.output | flatten | top(10)
function resolveVariable(
  path: string,
  context: {
    inputs: Record<string, unknown>;
    steps: Record<string, { output?: unknown }>;
  },
  forEachContext?: ForEachContext
): unknown {
  if (!path.startsWith("$")) {
    return path; // Literal value
  }

  // Parse pipe operators
  const pipeIndex = path.indexOf("|");
  let variablePath: string;
  let operators: string[] = [];

  if (pipeIndex !== -1) {
    variablePath = path.slice(0, pipeIndex).trim();
    operators = path.slice(pipeIndex + 1).split("|").map(s => s.trim());
  } else {
    variablePath = path;
  }

  const parts = variablePath.slice(1).split(".");
  let result: unknown;

  if (parts[0] === "inputs") {
    result = getNestedValue(context.inputs, parts.slice(1));
  } else if (parts[0] === "item") {
    // $item or $item.fieldName for for_each context
    if (!forEachContext) {
      throw new Error("$item is only valid inside a for_each step");
    }
    result = parts.length > 1
      ? getNestedValue(forEachContext.item, parts.slice(1))
      : forEachContext.item;
  } else if (parts[0] === "index") {
    // $index for for_each context
    if (!forEachContext) {
      throw new Error("$index is only valid inside a for_each step");
    }
    result = forEachContext.index;
  } else if (parts[0] === "steps") {
    const stepId = parts[1];
    const stepData = context.steps[stepId];
    if (!stepData) {
      throw new Error(`Step "${stepId}" not found or not completed yet`);
    }
    result = getNestedValue(stepData, parts.slice(2));
  } else {
    throw new Error(`Unknown variable prefix: ${parts[0]}`);
  }

  // Apply pipe operators
  if (operators.length > 0) {
    result = applyPipeOperators(result, operators);
  }

  return result;
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
  },
  forEachContext?: ForEachContext
): Record<string, unknown> {
  // Always include chain inputs so templates can access them via {{inputs.xyz}}
  const resolved: Record<string, unknown> = {
    inputs: context.inputs,
  };

  if (!step.input) {
    // Default: also spread chain inputs at top level for backward compat
    return { ...resolved, ...context.inputs };
  }

  for (const [key, value] of Object.entries(step.input)) {
    resolved[key] = resolveVariable(value, context, forEachContext);
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

// Execute a single step (or a single instance within a for_each)
async function executeStep(
  chain: Chain,
  step: ChainStep,
  run: RunState,
  forEachContext?: ForEachContext
): Promise<{ output: unknown; text: string; usage: { input: number; output: number }; durationMs: number }> {
  const startTime = Date.now();

  // Resolve inputs
  const stepInputs = resolveStepInputs(step, {
    inputs: run.inputs,
    steps: run.steps,
  }, forEachContext);

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

  return {
    output: result.output,
    text: result.text,
    usage: result.usage ?? { input: 0, output: 0 },
    durationMs: Date.now() - startTime,
  };
}

// Execute a regular (non-for_each) step
async function executeRegularStep(
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

  try {
    const result = await executeStep(chain, step, run);

    // Update step state
    stepState.status = "completed";
    stepState.completedAt = new Date().toISOString();
    stepState.output = result.output;
    stepState.outputText = result.text;
    stepState.durationMs = result.durationMs;
    stepState.tokens = result.usage;

    await saveRunState(run);
    await saveStepOutput(run, step.id, result.output, step);

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
    stepState.durationMs = Date.now() - new Date(stepState.startedAt!).getTime();

    await saveRunState(run);

    emitEvent(run.id, "step:failed", {
      stepId: step.id,
      stepName: step.name,
      error: stepState.error,
    });

    throw error;
  }
}

// Execute a for_each step (iterates over an array, optionally in parallel)
async function executeForEachStep(
  chain: Chain,
  step: ChainStep,
  run: RunState
): Promise<void> {
  // Resolve the array to iterate over
  const forEachValue = step.for_each!;
  const itemsArray = resolveVariable(forEachValue, {
    inputs: run.inputs,
    steps: run.steps,
  });

  if (!Array.isArray(itemsArray)) {
    throw new Error(`for_each value "${forEachValue}" did not resolve to an array`);
  }

  const totalInstances = itemsArray.length;
  const maxConcurrency = step.max_concurrency ?? 5;
  const runParallel = step.parallel ?? false;

  // Initialize step state for for_each
  const stepState: StepRunState = {
    status: "running",
    startedAt: new Date().toISOString(),
    isForEach: true,
    instances: [],
    completedInstances: 0,
    totalInstances,
  };

  run.steps[step.id] = stepState;
  run.currentStep = step.id;
  await saveRunState(run);

  emitEvent(run.id, "step:started", {
    stepId: step.id,
    stepName: step.name,
    isForEach: true,
    totalInstances,
  });

  const instanceOutputs: unknown[] = new Array(totalInstances);
  let totalTokensInput = 0;
  let totalTokensOutput = 0;

  // Execute instance
  const executeInstance = async (index: number): Promise<void> => {
    const item = itemsArray[index];
    const instanceState: InstanceRunState = {
      index,
      status: "running",
      startedAt: new Date().toISOString(),
    };
    stepState.instances![index] = instanceState;

    emitEvent(run.id, "step:instance:started", {
      stepId: step.id,
      instanceIndex: index,
      totalInstances,
    });

    try {
      const forEachContext: ForEachContext = { item, index };
      const result = await executeStep(chain, step, run, forEachContext);

      instanceState.status = "completed";
      instanceState.completedAt = new Date().toISOString();
      instanceState.output = result.output;
      instanceState.durationMs = result.durationMs;
      instanceState.tokens = result.usage;

      instanceOutputs[index] = result.output;
      totalTokensInput += result.usage.input;
      totalTokensOutput += result.usage.output;

      stepState.completedInstances = (stepState.completedInstances ?? 0) + 1;

      emitEvent(run.id, "step:instance:completed", {
        stepId: step.id,
        instanceIndex: index,
        totalInstances,
        completedInstances: stepState.completedInstances,
        output: result.output,
        durationMs: result.durationMs,
      });
    } catch (error) {
      instanceState.status = "failed";
      instanceState.completedAt = new Date().toISOString();
      instanceState.error = error instanceof Error ? error.message : String(error);

      emitEvent(run.id, "step:instance:failed", {
        stepId: step.id,
        instanceIndex: index,
        error: instanceState.error,
      });

      throw error;
    }
  };

  try {
    if (runParallel) {
      // Execute in parallel with concurrency limit
      const chunks: number[][] = [];
      for (let i = 0; i < totalInstances; i += maxConcurrency) {
        chunks.push(
          Array.from({ length: Math.min(maxConcurrency, totalInstances - i) }, (_, j) => i + j)
        );
      }

      for (const chunk of chunks) {
        await Promise.all(chunk.map(executeInstance));
        await saveRunState(run); // Save progress after each chunk
      }
    } else {
      // Execute sequentially
      for (let i = 0; i < totalInstances; i++) {
        await executeInstance(i);
        await saveRunState(run);
      }
    }

    // All instances completed successfully
    stepState.status = "completed";
    stepState.completedAt = new Date().toISOString();
    stepState.output = instanceOutputs;
    stepState.tokens = { input: totalTokensInput, output: totalTokensOutput };
    stepState.durationMs = Date.now() - new Date(stepState.startedAt!).getTime();

    await saveRunState(run);
    await saveForEachStepOutput(run, step.id, instanceOutputs, stepState.instances!, step);

    emitEvent(run.id, "step:completed", {
      stepId: step.id,
      stepName: step.name,
      isForEach: true,
      totalInstances,
      output: instanceOutputs,
      durationMs: stepState.durationMs,
      tokens: stepState.tokens,
    });
  } catch (error) {
    stepState.status = "failed";
    stepState.completedAt = new Date().toISOString();
    stepState.error = error instanceof Error ? error.message : String(error);
    stepState.durationMs = Date.now() - new Date(stepState.startedAt!).getTime();

    await saveRunState(run);

    emitEvent(run.id, "step:failed", {
      stepId: step.id,
      stepName: step.name,
      isForEach: true,
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
      if (step.for_each) {
        await executeForEachStep(chain, step, run);
      } else {
        await executeRegularStep(chain, step, run);
      }
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
        `Prompt chain completed: ${chain.meta.name}`,
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
        `Prompt chain failed: ${chain.meta.name}`,
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
