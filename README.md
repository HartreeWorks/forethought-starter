# Forethought Research — Claude Code starter

A curated set of Claude Code skills and guided onboarding for Forethought researchers.

## Quick start

### 1. Install Claude Code

Open Terminal and run:

```bash
curl -fsSL https://claude.ai/install.sh | bash
```

Then start Claude Code:

```bash
claude
```

Log in when prompted.

### 2. Ask Claude to set you up

Once logged in, tell Claude:

> "I want to set up the Forethought starter. Clone the repo from github.com/HartreeWorks/forethought-starter and walk me through the setup."

Claude will:
- Install Git if needed (via Xcode Command Line Tools)
- Clone this repository
- Initialise the skill submodules
- Guide you through the rest of the setup

## What's included

### Skills

| Skill | Purpose |
|-------|---------|
| project-management | Create and manage research projects |
| slack | Multi-workspace Slack messaging |
| schedule-task | macOS scheduled task management |
| secure-mcp-install | Security-focused MCP server installation |
| youtube-transcribe | Transcribe YouTube videos using Parakeet MLX |
| youtube-download | Download YouTube videos and audio using yt-dlp |
| transcribe-audio | Transcribe audio files using Parakeet MLX |

### Learning resources

| File | Purpose |
|------|---------|
| `learning/creating-a-skill.md` | How to create your own skills |
| `learning/skill-anatomy.md` | Reference for skill structure |

## Updating

Pull the latest changes and update submodules:

```bash
git pull
git submodule update --remote --merge
```

## Support

Contact Peter Hartree for assistance.
