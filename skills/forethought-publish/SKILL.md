---
name: forethought-publish
description: This skill should be used when the user says "start publication", "publish my paper", "publication checklist", "publish blog post", "publish research note", "resume publication", "where was I with publishing", "generate abstract", "draft social thread", "adversarial quoting check", or mentions the Forethought publication process.
---

# Forethought publication workflow

Guide researchers through the full publication process — from draft to published piece. The workflow branches based on publication type and tracks progress across sessions.

## Quick start

**New publication:**
1. Ask for publication title, document source (Google Doc URL or local markdown path), and type
2. Run: `python .claude/skills/forethought-publish/scripts/publication_manager.py new --title "Title" --type paper --doc "URL or path"`
3. Ingest the document (see Document ingestion section below)
4. Present Stage 0 steps

**Resume existing:**
1. Run: `python .claude/skills/forethought-publish/scripts/publication_manager.py status`
2. Show current progress and next step

**Check active publication:**
```bash
python .claude/skills/forethought-publish/scripts/publication_manager.py active
```

## Document ingestion

To avoid filling context with large documents, use a sub-agent for Google Docs ingestion.

**For Google Docs:**

Spawn a haiku sub-agent to fetch and store the document:
```
Task tool:
  subagent_type: "general-purpose"
  model: "haiku"
  prompt: |
    Ingest Google Doc for publication {pub_id}:
    1. Extract doc ID from URL (the part after /d/ and before /edit)
    2. Fetch content: use mcp__google_workspace__get_doc_content with:
       - file_id: {doc_id}
       - user_google_email: pete.hartree@gmail.com
    3. Create directory: .claude/skills/forethought-publish/docs/{pub_id}/
    4. Write content to: .claude/skills/forethought-publish/docs/{pub_id}/source.md
    5. Run: python .claude/skills/forethought-publish/scripts/publication_manager.py generate-manifest --id {pub_id}
    6. Return ONLY the manifest JSON output (not the document content)
```

The full document stays in the sub-agent's context (discarded after), keeping the main conversation lean.

**For local markdown files:**

1. Read the file and write to `.claude/skills/forethought-publish/docs/{pub_id}/source.md`
2. Run: `python .claude/skills/forethought-publish/scripts/publication_manager.py generate-manifest --id {pub_id}`

**Refreshing a document:**

If the source document has been edited:
```bash
python .claude/skills/forethought-publish/scripts/publication_manager.py refresh --id {pub_id}
```
This shows instructions for re-ingesting. Use the same sub-agent pattern as above.

## Working with ingested documents

The manifest at `docs/{pub_id}/manifest.json` contains section info:
```json
{
  "total_chars": 85000,
  "total_lines": 1200,
  "sections": [
    {"heading": "Introduction", "level": 1, "start_line": 1, "end_line": 45, "chars": 3200},
    {"heading": "Background", "level": 2, "start_line": 46, "end_line": 120, "chars": 5800}
  ]
}
```

**Task-specific loading strategies:**

| Task | Strategy |
|------|----------|
| Proofreading | Invoke `/proofread` with the source.md path |
| Abstract generation | Read manifest, then use Read tool with offset/limit for intro + conclusion sections |
| Forum/Substack summary | Read manifest for structure, selectively load key sections |
| Adversarial check | Process sections sequentially using manifest |
| Social thread | Work from already-generated abstract + key sections |

**Loading specific sections:**
```
Read the manifest first, then use Read tool:
  file_path: .claude/skills/forethought-publish/docs/{pub_id}/source.md
  offset: {section.start_line}
  limit: {section.end_line - section.start_line}
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
python .claude/skills/forethought-publish/scripts/publication_manager.py complete --step "1a.collaborators"
```

Skip optional steps:
```bash
python .claude/skills/forethought-publish/scripts/publication_manager.py skip --step "1a.external"
```

## Decisions to record

For papers/research notes, record these decisions:
```bash
python .claude/skills/forethought-publish/scripts/publication_manager.py decision --key podcast --value "no"
python .claude/skills/forethought-publish/scripts/publication_manager.py decision --key lw_forum --value "yes"
python .claude/skills/forethought-publish/scripts/publication_manager.py decision --key forum_content --value "custom_summary"
python .claude/skills/forethought-publish/scripts/publication_manager.py decision --key forum_title --value "question_style"
python .claude/skills/forethought-publish/scripts/publication_manager.py decision --key link_strategy --value "social_substack_website"
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
echo "content" | python .claude/skills/forethought-publish/scripts/publication_manager.py save --type abstract --content -
```

**Before generating any content**, read the style guide and relevant examples:
```
/Users/ph/Documents/Projects/2025-09-forethought-ai-uplift/assets/writing-style-examples/
├── style-guide.md          # Comprehensive instructions for each content type
├── abstracts/              # 10 example abstracts
├── substack/               # 7 example Substack posts
└── tweets/                 # 15 example tweet threads
```

### Abstract (~80-150 words)

**Read first:** `style-guide.md` § Abstracts + 2-3 files from `abstracts/`

Read the Google Doc content, then generate an abstract:
- **Structure:** ~40% hook/context, ~60% key findings
- Open with a punchy claim or question (often in quotes)
- Several short paragraphs better than one block
- Use specific numbers and concrete scenarios
- Active voice, confident tone
- Use US English

**Example opening lines from real abstracts:**
- "AI that can accelerate research could drive a century of technological progress over just a few years."
- "Once AI systems can design and build increasingly capable AI systems, we could witness an intelligence explosion..."

**Don't:** Start with "This paper examines..." or similar academic throat-clearing.

### Social media thread (6-12 tweets)

**Read first:** `style-guide.md` § Tweet threads + 2-3 files from `tweets/`

Generate based on the doc and link strategy decision:
- **Tweet 1:** Hook question or provocative claim + 🧵
- **Middle tweets:** Walk through argument with numbered points, include images
- **Final tweet:** Link to full piece
- Number explicitly: "1/11:", "2/11:" etc.
- Each tweet should be interesting on its own
- Include your actual opinion, acknowledge uncertainty

**Example hooks from real threads:**
- "Could one country (or company!) outgrow the rest of the world during an AI-powered growth explosion?"
- "📄New paper! Once we automate AI R&D, there could be an intelligence explosion..."

### Uploading to Typefully

After generating and saving the social thread, offer to upload it to Typefully:

> "Would you like me to upload this draft to Typefully?"

**If yes, check MCP availability:**
1. Try using any Typefully MCP tool (e.g. list drafts)
2. If it fails or isn't found, guide user through installation

**MCP installation (if needed):**
```bash
claude mcp add typefully --transport http --url "https://mcp.typefully.com/mcp?TYPEFULLY_API_KEY=<API_KEY>" --scope user
```

Tell the user:
- Get your API key from Typefully → Settings → Integrations
- The `--scope user` flag makes it available across all projects

**Creating the draft:**
- Use the Typefully MCP to create a draft
- Upload as draft (not scheduled) so the user can review before posting
- Select all platforms (Twitter, LinkedIn, Bluesky, Threads) by default

### Forum/LW summary (500-1500 words)

**Read first:** `style-guide.md` § Forum/Substack posts + 2-3 files from `substack/`

If `forum_content` is `custom_summary`:
- More informal than the paper
- Title as a question (different from paper title)
- Subheaded sections walking through key arguments
- Use bold for key terms, bullet points for lists
- Include direct quotes from the paper
- Link to full paper at end

### Adversarial quoting check
Paste the article and flag passages that could be twisted to make Forethought look bad:
- Anything that could sound discriminatory
- Party political stances
- Naive or dismissive of concerns

Prompt: "Read this article. Which bits, if quoted out of context, could be twisted to make us look bad? Only flag significant issues."

### Preview image prompts
Generate 3 image prompts for Gemini based on the paper content. The researcher picks one and generates the image.

## Slack integration

The Slack skill is available for communication steps in the publication workflow. Use it to draft and send messages to people or channels.

**Critical rule:** Never send a Slack message without showing the draft first and getting explicit user confirmation.

### Workflow pattern

When a step involves messaging someone:

1. **Offer to help:**
   > "Would you like me to draft a Slack message to [person/channel]?"

2. **If yes, draft and show:**
   > "Here's a draft message:
   >
   > ---
   > [Draft message content]
   > ---
   >
   > Ready to send this?"

3. **Only send on explicit confirmation** (e.g., "yes", "send it", "looks good")

4. **Send using the Slack skill:**
   ```bash
   SCRIPT=~/.claude/skills/slack/scripts/slack_client.py
   python3 $SCRIPT send "CHANNEL_ID" "Message content"
   ```

### Key Slack channels

| Channel | Workspace | Purpose |
|---------|-----------|---------|
| #forethought-research-collaborators | Forethought | Share drafts for feedback |
| #forethought-and-friends | Forethought | Announce publications |
| #open-dms-support-team | Forethought | Tag Lorie, Justis, Amrit |

### Key people on Slack

| Person | When to message |
|--------|-----------------|
| Max | Initial review, final signoff |
| Will/Tom | Paper signoff |
| Lorie | Upload requests (cc Amrit, Justis) |
| Justis | Copyediting, proofreading |
| Amrit | Ops support, access issues |
| Fin | Podcast coordination |

### Example messages

**Requesting review from Max:**
> Hi Max, I have a new [paper/research note/blog post] ready for your review: "[Title]"
>
> [Google Doc link]
>
> Let me know if anything is blocking or if you have feedback.

**Sharing with #forethought-research-collaborators:**
> New draft for feedback: "[Title]"
>
> [Google Doc link]
>
> Would appreciate any input, especially on [specific areas if relevant].

**Requesting upload from Lorie:**
> Hi Lorie, this piece is ready for upload: "[Title]"
>
> • Doc: [Google Doc link]
> • Type: [Paper/Research note]
> • Platforms: [Website, Substack, Forum, LW]
> • Images: [Attached/in doc]
> • Abstract: [Included/separate]
> • Preview image: [Decision]
>
> cc @Amrit @Justis

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
python .claude/skills/forethought-publish/scripts/publication_manager.py new --title "Title" --type paper --doc "URL"

# List all publications
python .claude/skills/forethought-publish/scripts/publication_manager.py list

# Show status (current or specific)
python .claude/skills/forethought-publish/scripts/publication_manager.py status
python .claude/skills/forethought-publish/scripts/publication_manager.py status --id pub-001

# Mark step complete
python .claude/skills/forethought-publish/scripts/publication_manager.py complete --step "1a.max_review"

# Skip optional step
python .claude/skills/forethought-publish/scripts/publication_manager.py skip --step "1a.external"

# Record decision
python .claude/skills/forethought-publish/scripts/publication_manager.py decision --key podcast --value "no"

# Save generated content
echo "Abstract text" | python .claude/skills/forethought-publish/scripts/publication_manager.py save --type abstract --content -

# Switch active publication
python .claude/skills/forethought-publish/scripts/publication_manager.py resume --id pub-002

# Show active
python .claude/skills/forethought-publish/scripts/publication_manager.py active

# Archive completed publication
python .claude/skills/forethought-publish/scripts/publication_manager.py archive
```

## Additional resources

### Style examples (for content generation)
Located at `/Users/ph/Documents/Projects/2025-09-forethought-ai-uplift/assets/writing-style-examples/`:
- **`style-guide.md`** — Comprehensive writing guide derived from real examples
- **`abstracts/`** — 10 example abstracts from forethought.org/research
- **`substack/`** — 7 example posts from newsletter.forethought.org
- **`tweets/`** — 15 example announcement threads from Forethought researchers

### Reference files
- **`references/blog-post-checklist.md`** — Detailed blog post steps
- **`references/paper-checklist.md`** — Full paper/research note checklist
- **`references/platforms-and-tools.md`** — Contentful, Typefully, Substack, LW, Forum guides
- **`references/social-media-accounts.md`** — Usernames, profile links, login info for all platforms
- **`references/contractors.md`** — Working with Lorie and Justis

### Source documentation
The original Forethought publication process documentation lives in Notion. These reference files are adapted from that source.
