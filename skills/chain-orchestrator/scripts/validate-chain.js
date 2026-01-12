#!/usr/bin/env node

/**
 * Validate a chain definition and its prompt files
 * Usage: node validate-chain.js <chain-id>
 *
 * Run from forethought-starter/tools/prompt-chain-runner to use its yaml dependency:
 *   node ../../skills/chain-orchestrator/scripts/validate-chain.js paper-critique
 */

const fs = require("fs");
const path = require("path");

// Try to load yaml from prompt-chain-runner's node_modules
let yaml;
const chainRunnerYaml = path.resolve(__dirname, "../../../tools/prompt-chain-runner/node_modules/yaml");
try {
  yaml = require(chainRunnerYaml);
} catch {
  try {
    yaml = require("yaml");
  } catch {
    console.error("Error: yaml module not found.");
    console.error("Run 'yarn install' in tools/prompt-chain-runner first.");
    process.exit(1);
  }
}

const chainsDir = path.resolve(__dirname, "../../../chains");

function validateChain(chainId) {
  const chainDir = path.join(chainsDir, chainId);
  const chainFile = path.join(chainDir, "chain.yaml");

  console.log(`Validating chain: ${chainId}\n`);

  // Check chain.yaml exists
  if (!fs.existsSync(chainFile)) {
    console.error(`✗ Chain file not found: ${chainFile}`);
    process.exit(1);
  }
  console.log(`✓ Found chain.yaml`);

  // Parse YAML
  let chain;
  try {
    const content = fs.readFileSync(chainFile, "utf-8");
    chain = yaml.parse(content);
  } catch (error) {
    console.error(`✗ Failed to parse chain.yaml: ${error.message}`);
    process.exit(1);
  }
  console.log(`✓ YAML syntax valid`);

  // Validate structure
  const errors = [];

  if (!chain.meta?.id) errors.push("Missing meta.id");
  if (!chain.meta?.name) errors.push("Missing meta.name");
  if (!chain.inputs || !Array.isArray(chain.inputs))
    errors.push("Missing or invalid inputs array");
  if (!chain.steps || !Array.isArray(chain.steps))
    errors.push("Missing or invalid steps array");

  if (errors.length > 0) {
    errors.forEach((e) => console.error(`✗ ${e}`));
    process.exit(1);
  }
  console.log(`✓ Chain structure valid`);

  // Validate inputs
  console.log(`\nInputs (${chain.inputs.length}):`);
  for (const input of chain.inputs) {
    if (!input.id) {
      console.error(`  ✗ Input missing id`);
    } else {
      console.log(`  - ${input.id} (${input.type || "text"})`);
    }
  }

  // Validate steps and prompt files
  console.log(`\nSteps (${chain.steps.length}):`);
  let stepErrors = 0;

  for (const step of chain.steps) {
    if (!step.id) {
      console.error(`  ✗ Step missing id`);
      stepErrors++;
      continue;
    }

    const promptPath = path.join(chainDir, step.prompt);
    if (!fs.existsSync(promptPath)) {
      console.error(`  ✗ ${step.id}: Prompt file missing (${step.prompt})`);
      stepErrors++;
    } else {
      const size = fs.statSync(promptPath).size;
      console.log(`  ✓ ${step.id}: ${step.prompt} (${size} bytes)`);
    }
  }

  // Check for variable references
  console.log(`\nVariable references:`);
  const stepIds = new Set(chain.steps.map((s) => s.id));
  const inputIds = new Set(chain.inputs.map((i) => i.id));

  for (const step of chain.steps) {
    if (step.input) {
      for (const [key, ref] of Object.entries(step.input)) {
        if (typeof ref === "string" && ref.startsWith("$steps.")) {
          const refStepId = ref.split(".")[1];
          if (!stepIds.has(refStepId)) {
            console.error(`  ✗ ${step.id}: References unknown step "${refStepId}"`);
            stepErrors++;
          } else {
            console.log(`  ✓ ${step.id}.${key} -> ${ref}`);
          }
        } else if (typeof ref === "string" && ref.startsWith("$inputs.")) {
          const refInputId = ref.split(".")[1];
          if (!inputIds.has(refInputId)) {
            console.error(`  ✗ ${step.id}: References unknown input "${refInputId}"`);
            stepErrors++;
          } else {
            console.log(`  ✓ ${step.id}.${key} -> ${ref}`);
          }
        }
      }
    }
  }

  // Summary
  console.log();
  if (stepErrors > 0) {
    console.error(`✗ Validation failed with ${stepErrors} error(s)`);
    process.exit(1);
  } else {
    console.log(`✓ Chain "${chainId}" is valid`);
    console.log(`\nTo run: cd tools/prompt-chain-runner && yarn dev`);
  }
}

// Main
const chainId = process.argv[2];
if (!chainId) {
  console.log("Usage: node validate-chain.js <chain-id>");
  console.log("\nAvailable chains:");
  if (fs.existsSync(chainsDir)) {
    const chains = fs.readdirSync(chainsDir).filter((f) => {
      const stat = fs.statSync(path.join(chainsDir, f));
      return stat.isDirectory() && fs.existsSync(path.join(chainsDir, f, "chain.yaml"));
    });
    chains.forEach((c) => console.log(`  - ${c}`));
  }
  process.exit(0);
}

validateChain(chainId);
