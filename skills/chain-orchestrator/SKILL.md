---
name: chain-orchestrator
description: This skill should be used when the user asks to "run a chain", "create a chain", "define a chain", "execute a chain", "chain run", "start chain-runner", "view chain results", or mentions multi-step AI workflows, prompt chains, or multi-model orchestration. Manages the creation, execution, and viewing of multi-prompt AI chains.
---

# Chain orchestrator

Orchestrate multi-prompt AI workflows using the chain-runner application. This skill helps you create, run, and monitor chains of AI model calls.

## Core concepts

- **Chain**: A YAML file defining a sequence of AI model calls, where each step can use output from previous steps
- **Run**: A single execution of a chain with specific inputs, persisted to the filesystem
- **Step**: One model call in a chain, with its own prompt template and output type

## Directory structure

```
forethought-starter/
├── chains/              # Chain definitions
│   └── paper-critique/
│       ├── chain.yaml   # Chain configuration
│       └── prompts/     # Prompt templates (Handlebars)
└── tools/
    └── chain-runner/    # Next.js web application
        └── runs/        # Default execution outputs (gitignored)
```

Chains can specify a custom `config.output_dir` to save runs elsewhere (e.g., in a project directory).

## Capabilities

### 1. Create a chain

When the user wants to create a new chain:

1. **Gather requirements**: Ask about the workflow steps, what models to use, and what the inputs/outputs are
2. **Create chain.yaml**: Define the chain structure with:
   - `meta.id`, `meta.name`, `meta.description`
   - `inputs[]` — what the chain needs to run
   - `steps[]` — the sequence of model calls
3. **Create prompt templates**: Write Handlebars templates in `prompts/` that use `{{variable}}` syntax
4. **Validate**: Run the validation script to check for errors

**Chain YAML structure**:
```yaml
meta:
  id: my-chain
  name: My chain
  description: What this chain does

config:
  output_dir: /path/to/project/runs  # Optional: where to save run outputs

inputs:
  - id: document
    type: text
    label: Document text
    required: true

steps:
  - id: analyse
    name: Analyse document
    model: claude-sonnet-4
    prompt: prompts/01-analyse.md
    output:
      type: json
    display:
      type: table
      columns: [field1, field2]

  - id: summarise
    name: Create summary
    model: claude-sonnet-4
    prompt: prompts/02-summarise.md
    input:
      analysis: $steps.analyse.output
    output:
      type: prose
```

**Output directory options**:
- Default: `tools/chain-runner/runs/` (inside chain-runner)
- Custom: Set `config.output_dir` in chain.yaml to save runs elsewhere
- Absolute paths work: `/Users/you/project/runs`
- Relative paths resolve from chain-runner directory

**Available models**:
- `claude-opus-4-5` — Anthropic Claude Opus 4.5
- `claude-sonnet-4` — Anthropic Claude Sonnet 4
- `gpt-5-pro` — OpenAI GPT-5 Pro (reasoning mode)
- `gemini-2-pro` — Google Gemini 2.0 Pro

**Variable references**:
- `$inputs.fieldname` — Reference a chain input
- `$steps.stepid.output` — Reference output from a previous step
- `$steps.stepid.output.field` — Reference a nested field

### 2. Run a chain

To execute a chain:

1. **Start the chain-runner server** (if not already running):
   ```bash
   cd /path/to/forethought-starter/tools/chain-runner
   yarn dev
   ```
   The server runs on port 3456.

2. **Open the UI**: Navigate to http://localhost:3456

3. **Execute via API** (alternative):
   ```bash
   curl -X POST http://localhost:3456/api/runs \
     -H "Content-Type: application/json" \
     -d '{"chainId": "paper-critique", "inputs": {"paper": "..."}}'
   ```

4. **Monitor progress**: The UI shows real-time step progress via SSE

### 3. View results

**Via UI**:
- Dashboard at http://localhost:3456 shows recent runs
- Click a run to see step-by-step outputs with schema-aware rendering

**Via filesystem**:
```bash
# List recent runs (default location)
ls -la tools/chain-runner/runs/paper-critique/

# View run metadata
cat tools/chain-runner/runs/paper-critique/run_xxx/run.json

# View step outputs
cat tools/chain-runner/runs/paper-critique/run_xxx/steps/brainstorm.md
```

If the chain uses a custom `output_dir`, look there instead.

## Workflow for creating a new chain

1. Ask user what they want the chain to do
2. Break it into discrete steps
3. For each step, determine:
   - What model should run it
   - What prompt it needs
   - What inputs it requires (from chain inputs or previous steps)
   - What output format (json, prose, text)
4. Create the directory structure:
   ```bash
   mkdir -p chains/my-chain/prompts
   ```
5. Write chain.yaml
6. Write each prompt template
7. Validate with a test run

## Environment setup

The chain-runner needs API keys in `tools/chain-runner/.env`:

```
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
GOOGLE_GENERATIVE_AI_API_KEY=...
```

Copy from `.env.example` if starting fresh.

## Available chains

Current chains in this project:

| Chain ID | Name | Steps | Description |
|----------|------|-------|-------------|
| paper-critique | Paper critique | 6 | Dialectical critique of philosophy papers |

## Troubleshooting

**Server won't start**:
```bash
cd forethought-starter/tools/chain-runner
yarn install
yarn dev
```

**Chain not loading**:
- Check YAML syntax with a validator
- Ensure all prompt files exist
- Check the console for parsing errors

**Step failing**:
- Check API key is set for the model being used
- Look at the run's step output for error details
- Try running with a simpler prompt first

## Prompt template tips

Use Handlebars syntax:
- `{{variable}}` — Insert variable value
- `{{json array}}` — JSON stringify for arrays/objects
- `{{#if condition}}...{{/if}}` — Conditional content

Example template:
```markdown
Analyse the following document and extract key themes.

{{document}}

Return JSON array: [{"theme": "...", "evidence": "..."}]
```
