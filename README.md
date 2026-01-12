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

### Forethought-specific skills

| Skill | Purpose |
|-------|---------|
| [forethought-diagrams](skills/forethought-diagrams) | Create Forethought-branded diagrams and flowcharts |
| [forethought-publish](skills/forethought-publish) | Guide papers through the full publication process |
| [forethought-style](skills/forethought-style) | Review content against Forethought style guidelines and writing examples |
| [prompt-chain-orchestrator](skills/prompt-chain-orchestrator) | Create and run multi-prompt AI workflows |

### General-purpose skills

| Skill | Purpose |
|-------|---------|
| [ask-many-models](https://github.com/HartreeWorks/skill--ask-many-models) | Query multiple AI models and synthesise responses |
| [lesswrong-and-ea-forum](https://github.com/HartreeWorks/claude-skill--lesswrong-and-ea-forum) | Track users/topics on LessWrong, EA Forum, Alignment Forum |
| [make-image](https://github.com/HartreeWorks/skill--make-image) | Generate, edit, or upscale images using Krea AI |
| [mochi-srs](https://github.com/HartreeWorks/skill--mochi-srs) | Create and review spaced repetition flashcards |
| [project-management](https://github.com/HartreeWorks/skill--project-management) | Create and manage research projects |
| [proofread](https://github.com/HartreeWorks/skill--proofread) | Check spelling, grammar, and style |
| [save-conversation](https://github.com/HartreeWorks/skill--save-conversation) | Export conversations to readable markdown |
| [schedule-task](https://github.com/HartreeWorks/skill--schedule-task) | macOS scheduled task management via launchd |
| [secure-mcp-install](https://github.com/HartreeWorks/skill--secure-mcp-install) | Security-focused MCP server installation |
| [send-email](https://github.com/HartreeWorks/skill--send-email) | Send emails via Gmail SMTP (no Google Cloud Console project required) |
| [slack](https://github.com/HartreeWorks/skill--slack) | Multi-workspace Slack messaging |
| [summarise-granola](https://github.com/HartreeWorks/skill--summarise-granola) | Summarise calls from Granola transcripts |
| [transcribe-audio](https://github.com/HartreeWorks/skill--transcribe-audio) | Transcribe audio files using Parakeet MLX |
| [youtube-download](https://github.com/HartreeWorks/skill--youtube-download) | Download YouTube videos and audio using yt-dlp |
| [youtube-transcribe](https://github.com/HartreeWorks/skill--youtube-transcribe) | Transcribe YouTube videos using Parakeet MLX |

### Tools

| Tool | Purpose |
|------|---------|
| prompt-chain-runner | Next.js app for executing multi-step AI chains with real-time UI |

To start the prompt-chain-runner: `cd tools/prompt-chain-runner && yarn dev` (runs on port 3456)

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
