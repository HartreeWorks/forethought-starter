---
name: forethought-diagrams
description: This skill should be used when the user asks to "create a diagram", "make a flowchart", "design a chart", "create a Forethought-branded visual", "generate an infographic", "create a graph", "make a matplotlib chart", "plot data", or mentions needing branded diagrams, figures, or data visualisations for research papers or presentations.
---

# Forethought branded diagrams and figures

Create on-brand diagrams and figures using Forethought's brand colours, typography, and style.

## Code-based charts (matplotlib)

For data visualisations and publication figures, use Python with the Forethought style module.

### Font check (run before generating any chart)

Before creating any matplotlib figure, check that the Forethought brand fonts are installed:

```bash
fc-list | grep -i "signifier" && fc-list | grep -i "TT Hoves"
```

If either font is missing:

1. Open the Forethought brand fonts folder:
   ```bash
   open "https://drive.google.com/drive/folders/11txBmBt-Wwzg1ENjzkKT1PcBnNdyPo15"
   ```
2. Tell the user: "The Forethought brand fonts aren't installed. I've opened the Google Drive folder — please download the .otf files and double-click each one to install."
3. Wait for the user to confirm they've installed the fonts.
4. Clear matplotlib's font cache so it picks them up:
   ```python
   import matplotlib.font_manager as fm
   fm.cache_clear()
   fm._load_fontmanager(try_read_cache=False)
   ```
5. Then proceed with chart generation.

### Quick start

```python
import matplotlib.pyplot as plt
import numpy as np
import os, sys
sys.path.append(os.path.expanduser('~/.claude/skills/forethought-diagrams/scripts'))
from forethought_style import COLORS, FONTS, apply_style

# Create figure with correct background
fig, ax = plt.subplots(figsize=(12, 4), facecolor=COLORS['background'])

# Plot data
x = np.linspace(0, 10, 100)
y = np.sin(x)
ax.fill_between(x, y, alpha=0.25, color=COLORS['highlight'])
ax.plot(x, y, color=COLORS['highlight'], linewidth=1.5)

# Apply Forethought style
apply_style(ax, title='Example Chart', xlabel='X values', ylabel='Y values')

# Save with correct settings
plt.savefig('chart.png', dpi=300, facecolor=COLORS['background'], bbox_inches='tight')
plt.savefig('chart.svg', facecolor=COLORS['background'], bbox_inches='tight')
```

### Style module exports

The style module (`scripts/forethought_style.py`) provides:

**`COLORS`** — Dictionary of brand colours:
- `background` (#FBFAF4) — Always use for figure background
- `text` (#2F2A26) — Primary text and lines
- `highlight` (#FA7248) — Primary accent (orange)
- `blue`, `green`, `purple`, `yellow`, `orange`, `red` — Data series colours

**`DATA_COLORS`** — List of data colours in recommended order for multi-series charts.

**`FONTS`** — Dictionary of font properties:
- `body` — Signifier Light (axis labels, tick labels)
- `label_medium` — TT Hoves Medium (titles)

**`apply_style(ax, ...)`** — Apply Tufte-style formatting to an axes:
- Removes top and right spines
- Sets correct colours and fonts
- Optional: `title`, `xlabel`, `ylabel`, `hide_y_labels`

### Tufte style conventions

- No top/right spines (only left + bottom)
- Thin spines (0.5px)
- Minimal ticks (3–5 max)
- Y-axis tick labels hidden (marks kept)
- Generous padding and whitespace
- Fill with low alpha (0.25) + line overlay

### Fonts

- **Signifier Light/Medium** (.otf) — Serif, used for axis labels and tick labels
- **TT Hoves Pro Regular/Medium** (.otf) — Sans-serif, used for titles

### Key patterns

**Area under curve (distributions):**
```python
ax.fill_between(x, y, alpha=0.25, color=COLORS['highlight'], linewidth=0)
ax.plot(x, y, color=COLORS['highlight'], linewidth=1.5, alpha=0.9)
```

**Multiple data series:**
```python
for i, (data, label) in enumerate(datasets):
    ax.plot(x, data, color=DATA_COLORS[i], label=label)
```

**Contour/heatmap:**
```python
from matplotlib.colors import LinearSegmentedColormap
cmap = LinearSegmentedColormap.from_list('ft', [COLORS['background'], COLORS['highlight']])
ax.contourf(X, Y, Z, cmap=cmap)
```

**Side-by-side subplots:**
```python
fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(12, 3.5), facecolor=COLORS['background'])
# ... plot on each ax ...
for ax in [ax1, ax2]:
    apply_style(ax)
fig.subplots_adjust(wspace=0.3)
```

### Saving figures

Always save with:
```python
plt.savefig('figure.png', dpi=300, facecolor=COLORS['background'], bbox_inches='tight')
plt.savefig('figure.svg', facecolor=COLORS['background'], bbox_inches='tight')
```

See `references/matplotlib-patterns.md` for detailed examples of different chart types.

---

## Brand specifications (quick reference)

### Background (REQUIRED)

**Always use:** `#FBFAF4` (Off-white)

Never use transparent backgrounds. Never use pure white (#FFFFFF).

### Colours

| Colour | Hex | Use |
|--------|-----|-----|
| Off-white | #FBFAF4 | Background (REQUIRED) |
| Charcoal | #2F2A26 | Primary text, lines |
| Orange | #FA7248 | Accents, highlights |
| Dark Off-white | #EEECE4 | Secondary panels |

**For data visualisations (charts, graphs):**

| Colour | Hex | Use |
|--------|-----|-----|
| Blue | #4988A9 | Data series 1 |
| Green | #43B85D | Data series 2 |
| Purple | #8B61A6 | Data series 3 |
| Yellow | #E6C90A | Data series 4 |
| Red | #A7313E | Data series 5 |

See `references/brand-colors.md` for the complete palette including accessibility variants.

### Typography

| Element | Font | Weight | Fallback |
|---------|------|--------|----------|
| Headings | Signifier | Extralight | Cormorant Garamond Light |
| Body text | Signifier | Light | Cormorant Garamond Regular |
| Labels/annotations | TT Hoves | Regular | Inter Regular |
| Navigation/tags | TT Hoves | Medium | Inter Medium |

See `references/typography.md` for full specifications.

### Alternative: Irina (contractor)

For complex diagrams that are hard to produce in code, Forethought has a diagrams contractor:

**Irina Titkova** <irina.titkova90@gmail.com>

- Tell her you're from Forethought
- She knows the brand style guidelines
- CC Amrit if you haven't worked with her before
- Send her a rough sketch or description

## Additional resources

### Reference files
- **`references/brand-colors.md`** — Complete colour palette with all hex codes and usage guidelines
- **`references/typography.md`** — Full typography specifications and fallback fonts
- **`references/matplotlib-patterns.md`** — Detailed matplotlib examples for different chart types
- **`references/canva-workflow.md`** — Canva-based diagram workflow (not yet active — pending MCP setup)

### Scripts
- **`scripts/forethought_style.py`** — Python style module with colours, fonts, and apply_style() helper

### Brand assets
The Forethought brand guidelines PDF and graphic assets are stored in the shared Google Drive. Ask your team for access if needed. These include SVG illustrations in the distinctive orange line-art style that can be used as reference or incorporated into designs.
