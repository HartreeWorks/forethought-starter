# Forethought Research — Claude Code starter

This repository helps Forethought researchers get started with Claude Code. It provides curated skills and guided setup for a powerful AI-assisted research environment.

## On conversation start

1. Read `setup-state.json` in this directory (create if missing — see template below)
2. Check each step in order; if any are incomplete, guide the user through the next one
3. If all steps are complete, show the welcome message with suggested next actions

### setup-state.json template

If the file doesn't exist, create it:

```json
{
  "version": "1.0",
  "steps": {
    "xcode_cli_tools": {"complete": false},
    "git": {"complete": false},
    "homebrew": {"complete": false},
    "github_cli": {"complete": false},
    "cursor": {"complete": false},
    "terminal_notifier": {"complete": false},
    "notification_hooks": {"complete": false},
    "google_workspace_mcp": {"complete": false},
    "slack_skill": {"complete": false},
    "skills_symlinked": {"complete": false}
  }
}
```

---

## Setup steps

Guide the user through each step conversationally. After completing each step, update `setup-state.json` and ask if they want to continue.

### Step 1: Xcode Command Line Tools

**Check:** `xcode-select -p` (returns a path if installed)

**If missing:**
1. Explain: "Xcode Command Line Tools provides essential developer tools like Git and compilers. This is the minimal version — not the full Xcode app."
2. Run:
   ```bash
   xcode-select --install
   ```
3. A dialog will appear. Click "Install" and wait (usually 5-10 minutes).
4. Verify: `xcode-select -p` returns `/Library/Developer/CommandLineTools` or similar

### Step 2: Git

**Check:** `which git` and `git --version`

Git is included with Xcode Command Line Tools. If step 1 completed, this should work.

**If missing after Xcode CLI tools:**
```bash
brew install git
```

**Optional:** Configure Git identity if not set:
```bash
git config --global user.name "Their Name"
git config --global user.email "their.email@example.com"
```

### Step 3: Homebrew

**Check:** `which brew`

**If missing:**
1. Explain: "Homebrew is a package manager for macOS. We'll use it to install other dependencies."
2. Run the installer:
   ```bash
   /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
   ```
3. This is interactive (requires password). Wait for confirmation.
4. On Apple Silicon, may need to add to PATH:
   ```bash
   echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
   eval "$(/opt/homebrew/bin/brew shellenv)"
   ```
5. Verify: `which brew` returns a path

### Step 4: GitHub CLI

**Check:** `which gh`

**If missing:**
```bash
brew install gh
```

Verify: `gh --version`

### Step 5: Cursor IDE

**Check:** `ls /Applications/Cursor.app` or `which cursor`

**If missing:**
1. Guide the user to download Cursor from https://cursor.com
2. It's an AI-enhanced code editor built on VS Code
3. After installing, they may need to run: "Install 'cursor' command" from Cursor's command palette

### Step 6: terminal-notifier

**Check:** `which terminal-notifier`

**If missing:**
```bash
brew install terminal-notifier
```

This enables native macOS notifications for Claude Code.

### Step 7: Notification hooks

**Check:** Read `~/.claude/settings.json` and check if `hooks.Notification` and `hooks.Stop` arrays exist

**If missing:**

1. Copy the notification script:
   ```bash
   mkdir -p ~/.claude/scripts
   cp scripts/notify.py ~/.claude/scripts/notify.py
   ```

2. Add hooks to `~/.claude/settings.json`. The file may not exist or may have other content. Merge these hooks:
   ```json
   {
     "hooks": {
       "Notification": [
         {
           "matcher": "",
           "hooks": [
             {
               "type": "command",
               "command": "python3 ~/.claude/scripts/notify.py Notification"
             }
           ]
         }
       ],
       "Stop": [
         {
           "matcher": "",
           "hooks": [
             {
               "type": "command",
               "command": "python3 ~/.claude/scripts/notify.py Stop"
             }
           ]
         }
       ]
     }
   }
   ```

3. Test by sending a notification:
   ```bash
   echo '{"cwd": "'$(pwd)'", "message": "Test notification"}' | python3 ~/.claude/scripts/notify.py Notification
   ```

### Step 8: Google Workspace MCP

**Check:** Read `~/.claude.json` and check if `mcpServers` contains a `google_workspace` or `google-workspace` entry

**If missing:**

Follow the secure-mcp-install workflow (see `skills/secure-mcp-install/SKILL.md`):

1. Clone the repository:
   ```bash
   mkdir -p ~/.claude/mcp-audits
   cd ~/.claude/mcp-audits
   git clone https://github.com/taylorwilsdon/google_workspace_mcp google_workspace_mcp
   cd google_workspace_mcp
   ```

2. Run the audit script:
   ```bash
   ~/.claude/skills/secure-mcp-install/scripts/audit-mcp-server.sh ~/.claude/mcp-audits/google_workspace_mcp
   ```

3. Create venv and install:
   ```bash
   cd ~/.claude/mcp-audits/google_workspace_mcp
   python3 -m venv .venv
   source .venv/bin/activate
   pip install -e .
   ```

4. Register with Claude Code:
   ```bash
   claude mcp add-json google_workspace '{
     "type": "stdio",
     "command": "'$HOME'/.claude/mcp-audits/google_workspace_mcp/.venv/bin/python",
     "args": ["-m", "google_workspace_mcp"],
     "cwd": "'$HOME'/.claude/mcp-audits/google_workspace_mcp"
   }'
   ```

5. **Important:** Claude Code must be restarted after adding an MCP server.

6. After restart, the user needs to authenticate with Google. This happens on first use of any Google Workspace tool — a browser window will open for OAuth.

7. Ask the user for their Google email address (needed for MCP tool calls). Store it somewhere they can reference.

### Step 9: Slack skill

**Check:** Check if `~/.claude/skills/slack/config.json` exists

**If not configured:**

Ask: "Would you like to set up Slack integration now? This lets Claude send and read Slack messages."

If yes, guide them through the setup in `skills/slack/SKILL.md`:

1. Open Slack in a web browser and log in
2. Open Developer Tools (Cmd+Option+I)
3. Extract tokens as described in the skill documentation
4. Run the add-workspace command

If they want to skip, that's fine — mark as complete and note they can set it up later with `/slack`.

### Step 10: Skills symlinked

**Check:** Check if symlinks exist in `~/.claude/skills/` for each skill:
- `~/.claude/skills/project-management`
- `~/.claude/skills/slack`
- `~/.claude/skills/schedule-task`
- `~/.claude/skills/secure-mcp-install`

**If missing:**

```bash
mkdir -p ~/.claude/skills

# Get the absolute path to this repo's skills folder
STARTER_DIR="$(cd "$(dirname "$0")" && pwd)"

ln -sfn "$STARTER_DIR/skills/project-management" ~/.claude/skills/project-management
ln -sfn "$STARTER_DIR/skills/slack" ~/.claude/skills/slack
ln -sfn "$STARTER_DIR/skills/schedule-task" ~/.claude/skills/schedule-task
ln -sfn "$STARTER_DIR/skills/secure-mcp-install" ~/.claude/skills/secure-mcp-install
```

Note: Run these from the forethought-starter directory so the paths resolve correctly. Use `$(pwd)` to get the current directory.

---

## Post-setup welcome

Once all steps are complete, welcome the user:

> **Your Claude Code environment is ready!**
>
> Here's what you can do next:
>
> **1. Try one of your skills:**
> - `/new-project` — Create a new research project with scaffolding
> - `/slack` — Send or read Slack messages
> - `/schedule-task` — Schedule recurring tasks
>
> **2. Create a new skill:**
> See `learning/creating-a-skill.md` for a quick tutorial. Tell me what you want to automate and we'll build it together.
>
> **3. Start a research project:**
> Say "new project" and I'll walk you through creating a folder structure with CLAUDE.md, MEMORY.md, and more.

---

## Skills reference

| Skill | Trigger | Purpose |
|-------|---------|---------|
| project-management | `/new-project`, "new project", "create project" | Create and manage research projects |
| slack | `/slack`, "send Slack message", "Slack digest" | Multi-workspace Slack messaging |
| schedule-task | `/schedule-task`, "schedule a task", "run daily" | macOS launchd scheduling |
| secure-mcp-install | "install MCP server", "add MCP" | Security-focused MCP installation |

---

## Conventions

- Use British English
- Use sentence case for headings
