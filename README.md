# Forethought Research — Claude Code starter

A curated set of Claude Code skills and guided onboarding for Forethought researchers.

## Quick start

1. **Clone the repository:**
   ```bash
   git clone <repo-url> ~/forethought-starter
   cd ~/forethought-starter
   ```

2. **Initialise the skill submodules:**
   ```bash
   git submodule update --init --recursive
   ```

3. **Open Claude Code:**
   ```bash
   claude
   ```

4. **Follow the guided setup.** Claude will detect incomplete setup and walk you through:
   - Installing Homebrew (if needed)
   - Installing GitHub CLI
   - Installing Cursor IDE
   - Setting up notifications
   - Configuring Google Workspace integration
   - Configuring Slack integration
   - Linking skills for global availability

## What's included

### Skills

| Skill | Purpose |
|-------|---------|
| project-management | Create and manage research projects |
| slack | Multi-workspace Slack messaging |
| schedule-task | macOS scheduled task management |
| secure-mcp-install | Security-focused MCP server installation |

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
