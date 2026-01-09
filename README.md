# Forethought Research — Claude Code starter

A curated set of Claude Code skills and guided onboarding for Forethought researchers.

## Quick start

### 1. Install Claude Code

Open Terminal and run:

```bash
curl -fsSL https://claude.ai/install.sh | bash
```

### 2. Start Claude Code

In Terminal, run:
```bash
claude
```

Log in when prompted.

### 3. Ask Claude to set you up

Ask Claude:

> "Please install Homebrew, Git, and GitHub CLI, then clone https://github.com/HartreeWorks/forethought-starter and walk me through the setup."

## What's included

### Skills

| Skill | Purpose |
|-------|---------|
| chain-orchestrator | Create and run multi-prompt AI workflows |
| forum-digest | Track users/topics on LessWrong, EA Forum, Alignment Forum |
| project-management | Create and manage research projects |
| schedule-task | macOS scheduled task management |
| secure-mcp-install | Security-focused MCP server installation |
| slack | Multi-workspace Slack messaging |
| transcribe-audio | Transcribe audio files using Parakeet MLX |
| youtube-download | Download YouTube videos and audio using yt-dlp |
| youtube-transcribe | Transcribe YouTube videos using Parakeet MLX |

### Tools

| Tool | Purpose |
|------|---------|
| chain-runner | Next.js app for executing multi-step AI chains with real-time UI |

To start the chain-runner: `cd tools/chain-runner && yarn dev` (runs on port 3456)

### Guides

| File | Purpose |
|------|---------|
| `guides/creating-a-skill.md` | How to create your own skills |
| `guides/skill-anatomy.md` | Reference for skill structure |

## Updating

Pull the latest changes and update submodules:

```bash
git pull
git submodule update --remote --merge
```

## Support

Contact Peter Hartree for assistance.
