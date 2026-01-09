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
  "version": "1.1",
  "steps": {
    "homebrew": {"complete": false},
    "git": {"complete": false},
    "github_cli": {"complete": false},
    "cursor": {"complete": false, "skipped": false},
    "warp_terminal": {"complete": false, "skipped": false},
    "typora": {"complete": false, "skipped": false},
    "terminal_notifier": {"complete": false},
    "notification_hooks": {"complete": false},
    "skills_symlinked": {"complete": false},
    "official_plugins": {"complete": false},
    "forethought_plugin": {"complete": false},
    "global_claude_md": {"complete": false},
    "slack_skill": {"complete": false, "skipped": false},
    "google_workspace_mcp": {"complete": false, "skipped": false}
  }
}
```

---

## Setup steps

Guide the user through each step conversationally. After completing each step, update `setup-state.json` and ask if they want to continue.

### Step 1: Homebrew

**Check:** `which brew`

**If missing:**
1. Explain: "Homebrew is a package manager for macOS. We'll use it to install the software we need."
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

### Step 2: Git

**Check:** `which git` and `git --version`

**If missing:**
```bash
brew install git
```

**Optional:** Configure Git identity if not set:
```bash
git config --global user.name "Their Name"
git config --global user.email "their.email@example.com"
```

### Step 3: GitHub CLI

**Check:** `which gh`

**If missing:**
```bash
brew install gh
```

Verify: `gh --version`

### Step 4: Cursor IDE (optional)

**Check:** `ls /Applications/Cursor.app`

This step is optional but strongly recommended. Ask the user:

> "Would you like to install Cursor? It's optional but strongly recommended to help with browsing and editing your project files.
>
> Would you like to install it?"

**If yes:**
```bash
brew install --cask cursor
```

**If no:** Mark as skipped and continue.

### Step 5: Warp terminal (optional)

**Check:** `ls /Applications/Warp.app`

This step is optional but strongly recommended. Ask the user:

> "Would you like to install Warp as an enhanced terminal? It's optional but strongly recommended because:
> 1. **Multiple Claude agents at once** — Press Cmd+D to split into columns, letting you run several Claude sessions side by side
> 2. **Quality of life features** — Ctrl-click to open files or links, built-in markdown viewer, and more
>
> Would you like to install it?"

**If yes:**
```bash
brew install --cask warp
```

**If no:** Mark as skipped and continue.

### Step 6: Typora (optional)

**Check:** `ls /Applications/Typora.app`

This step is optional but strongly recommended. Ask the user:

> "Would you like to install Typora? It's a Markdown file viewer and editor that makes reading and writing documentation much more pleasant. There's a 15-day free trial, then a one-time $15 purchase.
>
> Would you like to install it?"

**If yes:**
```bash
brew install --cask typora
```

**If no:** Mark as skipped and continue.

### Step 7: terminal-notifier

**Check:** `which terminal-notifier`

**If missing:**
```bash
brew install terminal-notifier
```

This enables native macOS notifications for Claude Code.

### Step 8: Notification hooks

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
   echo '{"cwd": "'$(pwd)'", "message": "Test notification from Forethought Starter"}' | python3 ~/.claude/scripts/notify.py Notification
   ```

### Step 9: Skills symlinked

**Check:** List all subdirectories in `skills/` and verify each has a corresponding symlink in `~/.claude/skills/`.

**If any are missing:**

Run from the forethought-starter directory:

```bash
mkdir -p ~/.claude/skills

for skill in skills/*/; do
  skill_name=$(basename "$skill")
  ln -sfn "$(pwd)/skills/$skill_name" ~/.claude/skills/"$skill_name"
done
```

### Step 10: Official plugins

**Check:** Run `/plugin` and check if `plugin-dev` and `frontend-design` appear in the Installed tab.

**If missing:**

Install from the official Anthropic marketplace:

```
/plugin install plugin-dev@claude-plugins-official
/plugin install frontend-design@claude-plugins-official
```

These provide:
- **plugin-dev**: Guided workflows for creating skills, commands, and agents
- **frontend-design**: Tools for designing and building user interfaces

### Step 11: Forethought Research plugin

Install the *Forethought Research* plugin from GitHub:

```bash
/plugin install forethought-research --from https://github.com/HartreeWorks/forethought-research
```

This provides:
- **Commands:** `/publish`, `/diagram`, `/proofread`
- **Skills:** Publication workflow, branded diagrams, writing style guide
- **Agent:** Style reviewer for checking documents

After installation, these commands will be available:
- `/publish` — Start or continue a publication workflow
- `/diagram` — Create a Forethought-branded diagram
- `/proofread` — Check a document against style guidelines

### Step 12: Global CLAUDE.md guidelines

**Check:** Read `~/.claude/CLAUDE.md` and check if it contains a "Skill creation" section.

**If missing:**

Append the following to `~/.claude/CLAUDE.md` (create the file if it doesn't exist):

```markdown
## Skill creation

When asked to create a skill, write a skill, or modify a skill:
1. **Always invoke the `plugin-dev:skill-development` skill first** before doing any work
2. This ensures the correct skill creation process and structure is followed

There are other `plugin-dev` skills for creating agents, commands, hooks, and plugins. Invoke them if appropriate.
```

This ensures the guided skill development workflow is used consistently.

---

## Optional integrations

These steps are optional. Offer them to the user after the core setup is complete.

### Step 13: Slack integration (optional, ~5 minutes)

**Check:** Check if `~/.claude/skills/slack/config.json` exists

Ask the user:

> "Would you like to set up Slack integration? This lets Claude send and read Slack messages. It takes about 5 minutes to set up. You can always do this later by asking me to 'set up Slack'."

**If yes:**

Guide them through the setup in `skills/slack/SKILL.md`:

1. Open Slack in a web browser and log in
2. Open Developer Tools (Cmd+Option+I)
3. Extract tokens as described in the skill documentation
4. Run the add-workspace command

**If no:** Mark as skipped and continue.

### Step 14: Google Workspace integration (optional, ~10-20 minutes)

**Check:** Read `~/.claude.json` and check if `mcpServers` contains a `google_workspace` or `google-workspace` entry

Ask the user:

> "Would you like to set up Google Workspace integration? This lets Claude read and write Google Docs, access Gmail, manage Calendar, and more. It takes about 10-20 minutes to set up. You can always do this later by asking me to 'set up Google Workspace'."

**If yes:**

Follow the secure-mcp-install workflow (see `skills/secure-mcp-install/SKILL.md`) to install `https://github.com/taylorwilsdon/google_workspace_mcp`.

After installation:
1. Claude Code must be restarted before the MCP server will work
2. On first use of any Google Workspace tool, a browser window will open for OAuth authentication
3. **Ask the user for their Google email address** (the one they'll authenticate with for Google Workspace):
   > "What Google email address will you use for Google Workspace integration? This will be set as your default for all Google Workspace commands."
4. **Write the email to their global `~/.claude/CLAUDE.md`**. Add or update a "Google Workspace" section:
   ```markdown
   ## Google Workspace
   - Always use `<their-email>@gmail.com` for Google Workspace MCP commands unless explicitly specified otherwise.
   ```
   If the file doesn't exist, create it. If the section already exists, update the email address.

**If no:** Mark as skipped and continue.

---

## Post-setup welcome

Once all steps are complete, welcome the user:

> **Your Claude Code environment is ready!**
>
> Here's what you can do next:

> **1. Start a research project:**
> Say "new project" and we can setup a new project with context, memory, and more.
>
> **2. Try the Forethought plugin commands:**
> - `/publish` — Start or continue a publication workflow
> - `/diagram` — Create a Forethought-branded diagram
> - `/proofread` — Check a document against style guidelines
>
> **3. Try other skills:**
> - `/youtube-transcribe` — Transcribe a YouTube video
> - `/forum-digest` — Track users/topics on LessWrong, EA Forum, Alignment Forum
> - `/slack` — Send or read Slack messages
> - `/schedule-task` — Schedule recurring tasks
>
> **4. Create a new skill:**
> See `guides/creating-a-skill.md` for a quick tutorial, or just tell me what you want to automate and we'll build it together.
>
> ## ⚠️ You must restart Claude Code before continuing ⚠️
>
> The new skills won't be available until you restart. To restart:
> 1. Press **Ctrl+C** (**Ctrl**, not Command) to exit Claude Code
> 2. Run `claude` again in your terminal

---

## Skills reference

To see available skills, list the `skills/` directory. Each skill folder contains a `SKILL.md` with its triggers and documentation.

```bash
ls skills/
```

Read individual skill docs for details:
```bash
cat skills/<skill-name>/SKILL.md
```

---

## Conventions

- Use British English
- Use sentence case for headings
