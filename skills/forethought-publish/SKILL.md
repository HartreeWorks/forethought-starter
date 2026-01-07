---
name: forethought-publish
description: This skill should be used when the user says "start publication", "publish my paper", "publication checklist", "publish blog post", "publish research note", "resume publication", "where was I with publishing", "generate abstract", "draft social thread", "adversarial quoting check", or mentions the Forethought publication process.
---

# Forethought publication workflow

Guide researchers through the full publication process — from draft to published piece. The workflow branches based on publication type and tracks progress across sessions.

## Quick start

**New publication:**
1. Ask for publication title, Google Doc URL, and type
2. Run: `python scripts/publication_manager.py new --title "Title" --type paper --doc "URL"`
3. Present Stage 0 steps

**Resume existing:**
1. Run: `python scripts/publication_manager.py status`
2. Show current progress and next step

**Check active publication:**
```bash
python scripts/publication_manager.py active
```

## Publication types

| Type | Description | Process time |
|------|-------------|--------------|
| **Blog post** | Quick, informal takes for Substack | ~20 mins after Max signoff |
| **Research note** | Lower-effort pieces for website, citeable but less formal | Medium |
| **Paper** | Polished, formal pieces with full review | Full process |

Blog posts use a shorter checklist. Papers and research notes use the same detailed checklist (papers get additional signoff from Will/Tom).

## Workflow stages

### Blog posts
1. **Review**: Max signoff
2. **Prep**: Spellcheck, preview image, optional social/Forum
3. **Upload**: To Substack (self or Lorie)
4. **Post**: Publish on platforms

### Papers & research notes
1. **Stage 0**: Setup, decide type
2. **Stage 1a**: Get reviews from Max, collaborators, optionally Justis/experts
3. **Stage 1b**: Prep — drafts for Forum/Substack, social thread, diagrams, abstract
4. **Stage 2**: Final signoff (Max + Will/Tom for papers), proofread, pass to Lorie
5. **Stage 3**: Publication day — publish on all platforms

## Walking through steps

Present progress like this:
```
Stage 1a: Getting review/input

Completed:
✓ Send to Max for initial review

Current step:
→ Share with #forethought-research-collaborators

To do:
○ Consider external expert review (optional)
○ Send to Justis for early feedback (optional)
○ Finalise draft after input

When done with #research-collaborators, say "done" or "skip".
```

Mark steps complete:
```bash
python scripts/publication_manager.py complete --step "1a.collaborators"
```

Skip optional steps:
```bash
python scripts/publication_manager.py skip --step "1a.external"
```

## Decisions to record

For papers/research notes, record these decisions:
```bash
python scripts/publication_manager.py decision --key podcast --value "no"
python scripts/publication_manager.py decision --key lw_forum --value "yes"
python scripts/publication_manager.py decision --key forum_content --value "custom_summary"
python scripts/publication_manager.py decision --key forum_title --value "question_style"
python scripts/publication_manager.py decision --key link_strategy --value "social_substack_website"
```

**Content strategy options:**
- `intro_only`: Forum/Substack contain just the introduction + link (low effort)
- `custom_summary`: Custom-drafted informal summary (better)
- `full_text`: Full text on all platforms (acceptable but not preferred for SEO)

**Title strategy:**
- `summary_prefix`: "Summary: [short title]" (low effort)
- `question_style`: Attention-grabbing question (better)

**Link strategy:**
- `social_substack_website`: Social → Substack → Website (default)
- `forum_direct`: Forum/LW → Website directly (if Forum has same content as Substack)

## What Claude can generate

Generate content at any point in the workflow. Save with:
```bash
echo "content" | python scripts/publication_manager.py save --type abstract --content -
```

### Abstract (~80 words)
Read the Google Doc content, then generate an abstract:
- Short and punchy, not academic
- Several short paragraphs better than one block
- ~Half context/hook, ~half key results
- Use US English

### Social media thread
Generate based on the doc and link strategy decision:
- Can be as short as one sentence + link
- Or a proper thread summarising key points
- Link to Substack or website per strategy

### Forum/LW summary
If `forum_content` is `custom_summary`:
- More informal than the paper
- Different title than website version
- Include link per strategy

### Adversarial quoting check
Paste the article and flag passages that could be twisted to make Forethought look bad:
- Anything that could sound discriminatory
- Party political stances
- Naive or dismissive of concerns

Prompt: "Read this article. Which bits, if quoted out of context, could be twisted to make us look bad? Only flag significant issues."

### Preview image prompts
Generate 3 image prompts for Gemini based on the paper content. The researcher picks one and generates the image.

## Key people

- **Max**: Reviews all pieces, gives final signoff
- **Will/Tom**: Additional signoff for papers
- **Lorie**: Uploads to website, Substack, Forum, LW (eirol1221@gmail.com)
- **Justis**: Copyediting, proofreading, upload review (on Slack)
- **Amrit**: Ops support, platform access issues
- **Fin**: Podcasts

## Commands reference

```bash
# Create new publication
python scripts/publication_manager.py new --title "Title" --type paper --doc "URL"

# List all publications
python scripts/publication_manager.py list

# Show status (current or specific)
python scripts/publication_manager.py status
python scripts/publication_manager.py status --id pub-001

# Mark step complete
python scripts/publication_manager.py complete --step "1a.max_review"

# Skip optional step
python scripts/publication_manager.py skip --step "1a.external"

# Record decision
python scripts/publication_manager.py decision --key podcast --value "no"

# Save generated content
echo "Abstract text" | python scripts/publication_manager.py save --type abstract --content -

# Switch active publication
python scripts/publication_manager.py resume --id pub-002

# Show active
python scripts/publication_manager.py active

# Archive completed publication
python scripts/publication_manager.py archive
```

## Additional resources

### Reference files
- **`references/blog-post-checklist.md`** — Detailed blog post steps
- **`references/paper-checklist.md`** — Full paper/research note checklist
- **`references/platforms-and-tools.md`** — Contentful, Typefully, Substack, LW, Forum guides
- **`references/contractors.md`** — Working with Lorie and Justis

### Source documentation
The original Forethought publication process documentation lives in Notion. These reference files are adapted from that source.
