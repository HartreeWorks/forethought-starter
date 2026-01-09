---
name: proofread
description: Proofread a document against Forethought style guidelines
arguments:
  - name: file
    description: "Path to the file to proofread (markdown or Google Doc URL)"
    required: false
allowed_tools:
  - Bash
  - Read
  - Edit
  - Task
  - mcp__google_workspace__*
---

# Proofread for Forethought style

Check a document for spelling, grammar, and adherence to Forethought writing style.

## Steps

1. **Load the forethought-style skill** — Read `~/.claude/skills/forethought-style/SKILL.md` for style guidelines

2. **Get the document:**
   - If `file` argument provided and is a local path: Read the file
   - If `file` argument is a Google Doc URL: Use `mcp__google_workspace__get_doc_content`
   - If no argument: Ask user for the file path or URL

3. **For large documents**, use a sub-agent:
   - Spawn a general-purpose agent with haiku model
   - Have it fetch and analyse the document section by section
   - Return only the issues found

4. **Check for:**

   **Spelling & Grammar:**
   - Typos and misspellings
   - Grammatical errors
   - Consistent UK/US English (US for abstracts)

   **Forethought Style:**
   - Sentence case in headings (not title case)
   - Active voice preferred
   - Concrete language (not vague abstractions)
   - Appropriate hedging (not over-hedging)
   - No academic throat-clearing ("This paper examines...")

   **Structure:**
   - Clear logical flow
   - Short paragraphs
   - Use of subheadings, lists, bullet points

5. **Report issues** in a clear format:
   ```
   ## Spelling & Grammar
   - Line 42: "accomodate" → "accommodate"
   - Line 67: "their" should be "there"

   ## Style
   - Line 12: Heading "How To Read A Book" should be "How to read a book" (sentence case)
   - Line 34: Consider active voice: "The experiment was conducted" → "We conducted the experiment"

   ## Structure
   - Paragraph at line 89 is 15 sentences; consider breaking up
   ```

6. **Offer to fix** issues directly if the user wants
