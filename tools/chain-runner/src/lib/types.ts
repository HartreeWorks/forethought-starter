import { z } from "zod";

// Chain input definition
export const ChainInputSchema = z.object({
  id: z.string(),
  name: z.string().optional(),
  type: z.enum(["text", "file", "url", "choice", "number", "boolean"]).default("text"),
  description: z.string().optional(),
  required: z.boolean().default(true),
  placeholder: z.string().optional(),
  default: z.unknown().optional(),
  options: z
    .array(
      z.object({
        id: z.string(),
        label: z.string(),
      })
    )
    .optional(),
  multiple: z.boolean().optional(),
});

// Chain step output definition
export const StepOutputSchema = z.object({
  type: z.enum(["json", "text", "prose"]).default("text"),
  schema: z.record(z.unknown()).optional(),
});

// Chain step input mapping
export const StepInputSchema = z.record(z.string());

// Chain step configuration
export const StepConfigSchema = z.object({
  max_tokens: z.number().optional(),
  temperature: z.number().min(0).max(2).optional(),
  timeout_minutes: z.number().optional(),
});

// Chain step display hints
export const StepDisplaySchema = z.object({
  type: z.enum(["table", "cards", "list", "prose"]).optional(),
  columns: z.array(z.string()).optional(),
  sort_by: z.string().optional(),
  sort_order: z.enum(["asc", "desc"]).optional(),
  group_by: z.string().optional(),
});

// Chain step definition
export const ChainStepSchema = z.object({
  id: z.string(),
  name: z.string(),
  model: z.string().optional(),
  prompt: z.string(), // Path to prompt file
  input: StepInputSchema.optional(),
  output: StepOutputSchema.optional(),
  display: StepDisplaySchema.optional(),
  config: StepConfigSchema.optional(),
});

// Chain metadata
export const ChainMetaSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  version: z.number().default(1),
  author: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

// Chain configuration
export const ChainConfigSchema = z.object({
  default_model: z.string().default("claude-sonnet-4"),
  timeout_minutes: z.number().default(30),
  notify_on_complete: z.boolean().default(true),
  persist_intermediate: z.boolean().default(true),
  output_dir: z.string().optional(), // Custom runs directory (relative to chain-runner or absolute)
});

// Full chain definition
export const ChainSchema = z.object({
  meta: ChainMetaSchema,
  config: ChainConfigSchema.optional(),
  inputs: z.array(ChainInputSchema).optional(),
  steps: z.array(ChainStepSchema),
});

export type ChainInput = z.infer<typeof ChainInputSchema>;
export type ChainStep = z.infer<typeof ChainStepSchema>;
export type ChainMeta = z.infer<typeof ChainMetaSchema>;
export type ChainConfig = z.infer<typeof ChainConfigSchema>;
export type Chain = z.infer<typeof ChainSchema>;

// Run status
export type RunStatus = "pending" | "running" | "completed" | "failed";

// Step run state
export interface StepRunState {
  status: RunStatus;
  startedAt?: string;
  completedAt?: string;
  output?: unknown;
  outputText?: string;
  error?: string;
  tokens?: {
    input: number;
    output: number;
  };
  durationMs?: number;
}

// Full run state
export interface RunState {
  id: string;
  chainId: string;
  status: RunStatus;
  startedAt: string;
  completedAt?: string;
  inputs: Record<string, unknown>;
  steps: Record<string, StepRunState>;
  currentStep?: string;
  error?: string;
  outputDir?: string; // Custom output directory (stored for run lookups)
}

// SSE event types
export type SSEEventType =
  | "run:started"
  | "step:started"
  | "step:progress"
  | "step:completed"
  | "step:failed"
  | "run:completed"
  | "run:failed"
  | "ping";

export interface SSEEvent {
  type: SSEEventType;
  data: unknown;
  timestamp: number;
}
