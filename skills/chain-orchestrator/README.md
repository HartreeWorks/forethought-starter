# Chain orchestrator skill

Claude Code skill for managing multi-prompt AI chains in the Forethought research workflow.

## What it does

This skill helps you:

1. **Create chains** — Define multi-step AI workflows in YAML with prompt templates
2. **Run chains** — Execute chains through the prompt-chain-runner web UI or API
3. **View results** — Monitor progress and inspect outputs

## Quick start

```bash
# Start the prompt-chain-runner server
cd forethought-starter/tools/prompt-chain-runner
yarn dev

# Open http://localhost:3456 to view the dashboard
```

## Example chain

The `paper-critique` chain demonstrates a 6-step workflow:

1. Brainstorm critiques (20+)
2. Score and select top 5
3. Develop each critique in detail
4. Generate counter-arguments
5. Revise critiques based on counters
6. Final selection and expansion (top 3)

## See also

- [SKILL.md](./SKILL.md) — Full skill documentation
- [prompt-chain-runner README](../../tools/prompt-chain-runner/README.md) — Application documentation
