---
name: diagram
description: Create a Forethought-branded diagram using Canva
arguments:
  - name: description
    description: "Brief description of the diagram to create"
    required: false
allowed_tools:
  - Bash
  - Read
  - Write
  - Edit
  - mcp__canva__*
---

# Create Forethought diagram

Help the user create an on-brand diagram using the Canva AI Connector.

## Steps

1. **Load the forethought-diagrams skill** — Read `~/.claude/skills/forethought-diagrams/SKILL.md` for brand specifications and workflow

2. **Determine diagram type:**
   - **Flowchart**: Processes, decision trees, workflows
   - **Concept diagram**: Relationships, systems, abstract ideas
   - **Data visualisation**: Charts, graphs, infographics

3. **If no description provided**, ask:
   > What kind of diagram would you like to create? Please describe:
   > - What it should show (the content)
   > - What type (flowchart, concept diagram, chart, etc.)

4. **Check Canva connection:**
   - Try a simple Canva operation
   - If unavailable, guide through setup as documented in the skill

5. **Generate Canva prompt** using the brand specifications:
   - Background: #FBFAF4 (MANDATORY)
   - Text: Charcoal #2F2A26
   - Accent: Orange #FA7248
   - Fonts: Cormorant Garamond (headings), Inter (body)

6. **Create in Canva** and iterate based on user feedback

7. **Export and save:**
   - PNG format, high quality (Size x = 3)
   - Verify solid background (not transparent)
   - Save to appropriate project folder

## Brand quick reference

See `~/.claude/skills/forethought-diagrams/references/brand-colors.md` for full palette.
