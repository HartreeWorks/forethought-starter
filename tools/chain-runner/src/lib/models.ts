import { generateText, generateObject } from "ai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createOpenAI } from "@ai-sdk/openai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { z } from "zod";

// Model aliases for convenience
const MODEL_ALIASES: Record<string, string> = {
  // Claude models
  "claude-opus-4-5": "anthropic:claude-opus-4-5-20250514",
  "claude-sonnet-4": "anthropic:claude-sonnet-4-20250514",
  "claude-sonnet-3-5": "anthropic:claude-3-5-sonnet-20241022",
  "claude-haiku-3-5": "anthropic:claude-3-5-haiku-20241022",

  // OpenAI models
  "gpt-5-pro": "openai:gpt-5-pro",
  "gpt-4o": "openai:gpt-4o",
  "gpt-4o-mini": "openai:gpt-4o-mini",
  "o1": "openai:o1",
  "o1-mini": "openai:o1-mini",
  "o3-mini": "openai:o3-mini",

  // Google models
  "gemini-2-pro": "google:gemini-2.0-pro",
  "gemini-2-flash": "google:gemini-2.0-flash",
  "gemini-1-5-pro": "google:gemini-1.5-pro",
};

// Create provider instances
function getProviders() {
  const anthropic = createAnthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  const openai = createOpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const google = createGoogleGenerativeAI({
    apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
  });

  return { anthropic, openai, google };
}

// Resolve model ID to provider model
function resolveModel(modelId: string) {
  // Check aliases first
  const resolved = MODEL_ALIASES[modelId] || modelId;

  // Parse provider:model format
  const [provider, ...modelParts] = resolved.split(":");
  const model = modelParts.join(":");

  const providers = getProviders();

  switch (provider) {
    case "anthropic":
      return providers.anthropic(model);
    case "openai":
      return providers.openai(model);
    case "google":
      return providers.google(model);
    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}

export interface ModelCallOptions {
  model: string;
  prompt: string;
  maxTokens?: number;
  temperature?: number;
  outputType?: "text" | "json" | "prose";
  schema?: z.ZodType;
}

export interface ModelCallResult {
  output: unknown;
  text: string;
  usage?: {
    input: number;
    output: number;
  };
}

// Call a model with the given prompt
export async function callModel(
  options: ModelCallOptions
): Promise<ModelCallResult> {
  const { model: modelId, prompt, maxTokens, temperature, outputType } = options;

  const model = resolveModel(modelId);

  // For JSON output, try to use generateObject if we have a schema
  // Otherwise fall back to text generation with JSON parsing
  if (outputType === "json") {
    try {
      const result = await generateText({
        model,
        prompt,
        maxTokens: maxTokens || 4096,
        temperature: temperature ?? 0.7,
      });

      // Try to parse JSON from the response
      const text = result.text;
      let output: unknown;

      try {
        // Try to extract JSON from markdown code blocks or raw JSON
        const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/) || [
          null,
          text,
        ];
        const jsonStr = jsonMatch[1]?.trim() || text.trim();
        output = JSON.parse(jsonStr);
      } catch {
        // If JSON parsing fails, return the raw text
        output = text;
      }

      return {
        output,
        text,
        usage: result.usage
          ? {
              input: result.usage.promptTokens,
              output: result.usage.completionTokens,
            }
          : undefined,
      };
    } catch (error) {
      console.error("Model call failed:", error);
      throw error;
    }
  }

  // For text/prose output
  const result = await generateText({
    model,
    prompt,
    maxTokens: maxTokens || 4096,
    temperature: temperature ?? 0.7,
  });

  return {
    output: result.text,
    text: result.text,
    usage: result.usage
      ? {
          input: result.usage.promptTokens,
          output: result.usage.completionTokens,
        }
      : undefined,
  };
}

// Check if a model is available (API key is set)
export function isModelAvailable(modelId: string): boolean {
  const resolved = MODEL_ALIASES[modelId] || modelId;
  const [provider] = resolved.split(":");

  switch (provider) {
    case "anthropic":
      return !!process.env.ANTHROPIC_API_KEY;
    case "openai":
      return !!process.env.OPENAI_API_KEY;
    case "google":
      return !!process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    default:
      return false;
  }
}

// Get list of available models (with API keys set)
export function getAvailableModels(): string[] {
  const available: string[] = [];

  for (const alias of Object.keys(MODEL_ALIASES)) {
    if (isModelAvailable(alias)) {
      available.push(alias);
    }
  }

  return available;
}

// Get model display name
export function getModelDisplayName(modelId: string): string {
  const displayNames: Record<string, string> = {
    "claude-opus-4-5": "Claude Opus 4.5",
    "claude-sonnet-4": "Claude Sonnet 4",
    "claude-sonnet-3-5": "Claude Sonnet 3.5",
    "claude-haiku-3-5": "Claude Haiku 3.5",
    "gpt-5-pro": "GPT-5 Pro",
    "gpt-4o": "GPT-4o",
    "gpt-4o-mini": "GPT-4o Mini",
    "o1": "o1",
    "o1-mini": "o1 Mini",
    "o3-mini": "o3 Mini",
    "gemini-2-pro": "Gemini 2.0 Pro",
    "gemini-2-flash": "Gemini 2.0 Flash",
    "gemini-1-5-pro": "Gemini 1.5 Pro",
  };

  return displayNames[modelId] || modelId;
}
