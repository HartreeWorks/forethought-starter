# Creating a skill

Skills are reusable tools that Claude can invoke when you need them. Creating one takes minutes, not hours.

## The quick version

1. Tell Claude: *"I want to create a skill that [does X]"*
2. Claude will create a folder in `~/.claude/skills/` with:
   - `SKILL.md` — describes when and how to use the skill
   - `scripts/` — any code needed
   - `config.json` — user-specific settings (if needed)
3. Test it by asking Claude to use your new skill

## Example conversation

> **You:** I want to create a skill that summarises YouTube videos
>
> **Claude:** I'll create a skill for that. It will download the transcript and summarise it. Let me set that up...
>
> [Claude creates the skill files]
>
> **You:** Summarise this video: https://youtube.com/watch?v=...
>
> [Claude uses your new skill]

## When to create a skill

Create a skill when you find yourself:
- Asking Claude to do the same thing repeatedly
- Wanting a consistent workflow for a task
- Needing to integrate with an external service (Slack, email, APIs)

## Learning more

- See `skill-anatomy.md` for the structure of a skill
- Browse existing skills in `~/.claude/skills/` for examples
- The Slack skill (`skills/slack/SKILL.md`) is a comprehensive example
