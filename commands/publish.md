---
name: publish
description: Start or continue a Forethought publication workflow
arguments:
  - name: action
    description: "Action: 'new' to start a publication, 'status' to check progress, 'resume' to continue (default: status)"
    required: false
allowed_tools:
  - Bash
  - Read
  - Write
  - Edit
  - Task
  - mcp__google_workspace__*
---

# Publication workflow

Guide the user through the Forethought publication process.

## Steps

1. **Load the forethought-publish skill** — Read `~/.claude/skills/forethought-publish/SKILL.md` to understand the full workflow

2. **Determine action:**
   - If argument is "new": Start a new publication
   - If argument is "resume" or no argument: Check current status first

3. **For status/resume:**
   ```bash
   python ~/.claude/skills/forethought-publish/scripts/publication_manager.py status
   ```

4. **For new:**
   - Ask user for the Google Doc URL
   - Get document metadata using `mcp__google_workspace__get_drive_file_permissions`
   - Ask user to confirm title and publication type (paper/research note/blog post)
   - Create the publication:
     ```bash
     python ~/.claude/skills/forethought-publish/scripts/publication_manager.py new --title "Title" --type paper --doc "URL"
     ```

5. **Walk through steps** as described in the skill, presenting progress and offering to help with each step

## Important notes

- Always load the full skill documentation before proceeding
- For document ingestion, use sub-agents to avoid loading large documents into main context
- Track progress using the publication_manager.py script
- Consult the forethought-style skill when generating content (abstracts, threads, summaries)
