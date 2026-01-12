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

> "Please install Homebrew, Git, and GitHub CLI if they're not already installed. Then clone https://github.com/HartreeWorks/forethought-starter and walk me through the setup."

## What's included

### Skills

| Skill | Purpose |
|-------|---------|
| [ask-many-models](skills/ask-many-models) | Query multiple AI models and synthesise responses |
| [chain-orchestrator](skills/chain-orchestrator) | Create and run multi-prompt AI workflows |
| [forethought-diagrams](skills/forethought-diagrams) | Create Forethought-branded diagrams and flowcharts |
| [forethought-publish](skills/forethought-publish) | Guide papers through the full publication process |
| [forethought-style](skills/forethought-style) | Review content against Forethought style guidelines |
| [lesswrong-and-ea-forum](skills/lesswrong-and-ea-forum) | Track users/topics on LessWrong, EA Forum, Alignment Forum |
| [make-image](skills/make-image) | Generate, edit, or upscale images using Krea AI |
| [mochi-srs](skills/mochi-srs) | Create and review spaced repetition flashcards |
| [project-management](skills/project-management) | Create and manage research projects |
| [proofread](skills/proofread) | Check spelling, grammar, and style |
| [save-conversation](skills/save-conversation) | Export conversations to readable markdown |
| [schedule-task](skills/schedule-task) | macOS scheduled task management via launchd |
| [secure-mcp-install](skills/secure-mcp-install) | Security-focused MCP server installation |
| [send-email](skills/send-email) | Send emails via Gmail with preview and confirmation |
| [slack](skills/slack) | Multi-workspace Slack messaging |
| [summarise-granola](skills/summarise-granola) | Summarise calls from Granola transcripts |
| [transcribe-audio](skills/transcribe-audio) | Transcribe audio files using Parakeet MLX |
| [youtube-download](skills/youtube-download) | Download YouTube videos and audio using yt-dlp |
| [youtube-transcribe](skills/youtube-transcribe) | Transcribe YouTube videos using Parakeet MLX |

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
