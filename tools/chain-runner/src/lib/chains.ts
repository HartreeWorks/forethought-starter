import fs from "fs/promises";
import path from "path";
import YAML from "yaml";
import { Chain, ChainSchema } from "./types";

// Get chains directory path
function getChainsDir(): string {
  const envDir = process.env.CHAINS_DIR;
  if (envDir) {
    return path.isAbsolute(envDir)
      ? envDir
      : path.resolve(process.cwd(), envDir);
  }
  // Default: look for prompt-chains/chains/ relative to forethought-starter root
  const candidates = [
    path.resolve(process.cwd(), "../../prompt-chains/chains"),
    path.resolve(process.cwd(), "prompt-chains/chains"),
  ];
  return candidates[0];
}

// Load a single chain by ID
export async function getChain(chainId: string): Promise<Chain | null> {
  const chainsDir = getChainsDir();
  const chainDir = path.join(chainsDir, chainId);

  try {
    const chainYamlPath = path.join(chainDir, "chain.yaml");
    const content = await fs.readFile(chainYamlPath, "utf-8");
    const parsed = YAML.parse(content);

    // Validate with Zod
    const result = ChainSchema.safeParse(parsed);
    if (!result.success) {
      console.error(`Invalid chain ${chainId}:`, result.error.format());
      return null;
    }

    return result.data;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return null;
    }
    throw error;
  }
}

// Load all chains
export async function getChains(): Promise<Chain[]> {
  const chainsDir = getChainsDir();

  try {
    const entries = await fs.readdir(chainsDir, { withFileTypes: true });
    const chains: Chain[] = [];

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      if (entry.name.startsWith(".")) continue;

      const chain = await getChain(entry.name);
      if (chain) {
        chains.push(chain);
      }
    }

    return chains;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return [];
    }
    throw error;
  }
}

// Load prompt template for a step
export async function getPromptTemplate(
  chainId: string,
  promptPath: string
): Promise<string> {
  const chainsDir = getChainsDir();
  const fullPath = path.join(chainsDir, chainId, promptPath);
  return fs.readFile(fullPath, "utf-8");
}

// Load output template for a step (returns null if not found)
export async function getOutputTemplate(
  chainId: string,
  templatePath: string
): Promise<string | null> {
  const chainsDir = getChainsDir();
  const fullPath = path.join(chainsDir, chainId, templatePath);
  try {
    return await fs.readFile(fullPath, "utf-8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return null;
    }
    throw error;
  }
}

// Get chain directory path
export function getChainDir(chainId: string): string {
  return path.join(getChainsDir(), chainId);
}
