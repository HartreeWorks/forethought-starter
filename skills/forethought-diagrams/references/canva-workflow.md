# Canva-based diagrams (not yet active)

> **Status:** This workflow is not yet available. The Canva MCP connection has not been set up on team accounts. When it comes online, reintegrate this into the main SKILL.md.

For flowcharts, concept diagrams, and quick visuals, use the Canva AI Connector.

## Prerequisites: Canva MCP connection

**Check if connected:**
Try any Canva operation (e.g. "search my Canva designs"). If it fails or Canva tools aren't available, proceed with setup.

**Setup for Claude Desktop:**
1. Open Claude Desktop and go to **Settings**
2. Select **Connectors**
3. Find **Canva** in the list and select it
4. Follow the prompts to connect your Canva account
5. In a new chat, select the settings icon and toggle **Canva** on in the Connectors section

**Setup for Claude Code:**
1. Open Claude Code settings (Cmd+, on macOS)
2. Navigate to the **Developer** tab
3. Click **Edit Config** and add the Canva MCP configuration
4. Restart Claude Code to apply the new settings

**Verification:**
After setup, ask Claude to "list my recent Canva designs" to confirm the connection works.

## Quick start

1. Describe the diagram needed
2. Claude generates a Canva prompt with brand specs embedded
3. Canva creates the design
4. Export as high-quality PNG
5. Save to the project assets folder

Example: "Create a flowchart showing the publication workflow for Forethought papers"

## Workflow

**Step 1: Determine diagram type**

| Type | Best for | Canva template |
|------|----------|----------------|
| **Flowchart** | Processes, decision trees, workflows | Flow diagram |
| **Concept diagram** | Relationships, systems thinking, abstract ideas | Mind map or custom |
| **Data visualisation** | Charts, graphs, timeline infographics | Chart or infographic |

**Step 2: Generate Canva prompt**

Construct a prompt that includes:
- Diagram description
- Forethought brand specifications (see below)
- Specific content requirements

**Prompt template:**
```
Create a [diagram type] for Forethought Research showing [content description].

Brand requirements:
- Background colour: #FBFAF4 (Off-white) - MANDATORY
- Primary text: Charcoal #2F2A26
- Accent colour: Orange #FA7248
- Font: Cormorant Garamond for headings, Inter for body text
- Style: Clean, minimal, professional research aesthetic

[Specific content details]
```

**Step 3: Create in Canva**

Use the Canva AI Connector to:
1. Create a new design with the prompt
2. Review the generated design
3. Request adjustments if needed (e.g. "make the background exactly #FBFAF4")

**Step 4: Export as PNG**

**Export requirements (MANDATORY):**
- Format: PNG
- Quality: High resolution (in Canva: Download > PNG > "Size x" = 3)
- Background: Verify it's solid #FBFAF4, NOT transparent

**Why this matters:** Transparent backgrounds display poorly in dark mode. Mismatched background colours look unprofessional on the website.

**Step 5: Save to project**

Save the exported PNG to:
```
assets/diagrams/[descriptive-filename].png
```

Or for paper-specific diagrams:
```
work/[paper-name]/diagrams/[figure-number]-[description].png
```

## Canva prompt templates

**Flowchart:**

```
Create a flowchart for Forethought Research showing [process name].

Brand requirements:
- Background colour: #FBFAF4 (Off-white) - MANDATORY
- Box borders and arrows: Charcoal #2F2A26
- Decision diamonds: Orange #FA7248 accent
- Text: Charcoal #2F2A26
- Font: Cormorant Garamond for box text, Inter for labels
- Style: Clean lines, minimal, no shadows or gradients

Steps:
1. [Step 1]
2. [Step 2]
...
```

**Concept diagram:**

```
Create a concept diagram for Forethought Research illustrating [concept].

Brand requirements:
- Background colour: #FBFAF4 (Off-white) - MANDATORY
- Lines and connections: Charcoal #2F2A26 or Orange #FA7248
- Text: Charcoal #2F2A26
- Font: Cormorant Garamond for main concepts, Inter for annotations
- Style: Abstract, clean, inspired by historical perspective diagrams

Elements:
- [Central concept]
- [Related concept 1]
...
```

**Data visualisation:**

```
Create a [bar chart/line graph/pie chart] for Forethought Research showing [data description].

Brand requirements:
- Background colour: #FBFAF4 (Off-white) - MANDATORY
- Axis lines and labels: Charcoal #2F2A26
- Data colours (in order): Blue #4988A9, Green #43B85D, Purple #8B61A6, Yellow #E6C90A
- Font: Inter for all text
- Style: Clean, no 3D effects, minimal gridlines

Data:
- [Series 1]: [values]
...
```

## Export checklist

Before finalising any Canva diagram:

- [ ] Background is solid #FBFAF4 (not transparent, not white)
- [ ] Exported as PNG format
- [ ] High quality (Canva "Size x" = 3)
- [ ] Text is legible at intended display size
- [ ] Colours match brand palette
- [ ] Saved to appropriate project folder

## Typography in Canva

Use Cormorant Garamond and Inter as the brand fonts (Signifier and TT Hoves) aren't available in Canva. These are approved fallbacks from the brand guidelines.
