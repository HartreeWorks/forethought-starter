# Skill anatomy

A skill is a folder containing documentation and (optionally) code that Claude uses to perform a specific task.

## Folder structure

```
skill-name/
├── SKILL.md              # Required: describes the skill
├── scripts/              # Optional: implementation code
│   └── main.py
├── config.json           # Optional: user-specific settings
├── config.example.json   # Optional: template for config
└── references/           # Optional: detailed procedures
```

## SKILL.md format

The SKILL.md file has YAML frontmatter followed by markdown documentation:

```markdown
---
name: skill-name
description: When Claude should use this skill. Include trigger phrases.
---

# Skill Name

Documentation for Claude on how to use this skill.

## Commands

| Command | Purpose |
|---------|---------|
| `/command` | What it does |

## How it works

Step-by-step instructions...
```

### The description field

The `description` in the frontmatter tells Claude when to invoke this skill. Be specific:

```yaml
description: This skill should be used when the user says "transcribe podcast",
  "get transcript", or mentions processing audio files.
```

## Scripts

Scripts are typically Python or shell. Claude executes them via the command line.

Common patterns:
- `scripts/client.py` — main implementation
- Accept arguments: `python3 script.py <args>`
- Return results to stdout for Claude to read

## Configuration

Use `config.json` for user-specific settings (API keys, preferences). Keep a `config.example.json` as a template and add `config.json` to `.gitignore`.

## Examples

Browse the skills in this starter for patterns:
- `skills/slack/` — complex skill with multi-workspace support
- `skills/project-management/` — documentation-only skill (no scripts)
- `skills/schedule-task/` — system integration (macOS launchd)
