---
name: forethought-diagrams
description: This skill should be used when the user asks to "create a diagram", "make a flowchart", "design a chart", "create a Forethought-branded visual", "generate an infographic", "create a graph", "make a matplotlib chart", "plot data", or mentions needing branded diagrams, figures, or data visualisations for research papers or presentations.
---

# Forethought branded diagrams and figures

Create on-brand diagrams and figures using Forethought's brand colours, typography, and style.

## Code-based charts (matplotlib)

For data visualisations and publication figures, use Python with the Forethought style module.

### Environment setup (run once per machine)

Install `matplotlib` and `numpy` into a dedicated virtual environment — do not install them globally.

```bash
python3 -m venv ~/.local/share/forethought-diagrams/.venv
~/.local/share/forethought-diagrams/.venv/bin/pip install matplotlib numpy
```

**Check if already set up:** `~/.local/share/forethought-diagrams/.venv/bin/python -c "import matplotlib; print('ok')"` — if this prints `ok`, skip ahead.

When running chart scripts, always use the venv Python:

```bash
~/.local/share/forethought-diagrams/.venv/bin/python my_chart.py
```

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
from forethought_style import COLORS, FONTS, apply_style, savefig

# Create figure with correct background
fig, ax = plt.subplots(figsize=(12, 4), facecolor=COLORS['background'])

# Plot data
x = np.linspace(0, 10, 100)
y = np.sin(x)
ax.fill_between(x, y, alpha=0.25, color=COLORS['highlight'])
ax.plot(x, y, color=COLORS['highlight'], linewidth=1.5)

# Apply Forethought style
apply_style(ax, title='Example Chart', xlabel='X values', ylabel='Y values')

# Save (produces chart.png + chart.svg with correct settings)
savefig('chart')
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

**`savefig(path, dpi=300, formats=('png', 'svg'))`** — Save with correct Forethought settings:
- `savefig('chart')` → saves `chart.png` + `chart.svg` with brand background, 300 dpi, tight bbox
- `savefig('chart.png')` → saves only PNG

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

**Multi-panel with suptitle (use GridSpec for complex layouts):**
```python
fig = plt.figure(figsize=(12, 6), facecolor=COLORS['background'])
gs = fig.add_gridspec(2, 2, hspace=0.4, wspace=0.3)
ax1 = fig.add_subplot(gs[0, 0])
ax2 = fig.add_subplot(gs[0, 1])
ax3 = fig.add_subplot(gs[1, :])
# ... plot on each ax, then apply_style() ...
# Place suptitle high enough to clear panel titles
fig.suptitle('Overall Title', fontsize=26, fontproperties=FONTS['label_medium'],
             color=COLORS['text'], y=0.98)
fig.subplots_adjust(top=0.88)  # make room for suptitle
```

**Subtitle / caption below title:**
```python
ax.text(0.5, 1.05, 'Main Title', transform=ax.transAxes, ha='center',
        fontsize=24, color=COLORS['text'], fontproperties=FONTS['label_medium'])
ax.text(0.5, 1.01, 'Illustrative data only', transform=ax.transAxes, ha='center',
        fontsize=13, color=COLORS['dark_grey'], fontproperties=FONTS['body'])
```

**Bar charts — hide bottom spine:**
```python
# apply_style() keeps left + bottom spines by default. For bar charts,
# remove the bottom spine and x-ticks for a cleaner look:
apply_style(ax, ylabel='Count')
ax.spines['bottom'].set_visible(False)
ax.tick_params(axis='x', length=0)
```

**Log-scale y-axis:**
```python
# apply_style() sets minimal ticks (3–5), which looks odd on log axes.
# Set the scale *before* apply_style, then restore matplotlib's log ticks after:
ax.set_yscale('log')
apply_style(ax, xlabel='X', ylabel='Y')
from matplotlib.ticker import LogLocator, LogFormatterSciNotation
ax.yaxis.set_major_locator(LogLocator(base=10))
ax.yaxis.set_major_formatter(LogFormatterSciNotation())
```

### Sizing and readability

These figures will appear inline in articles surrounded by body text, typically at ~700px content width. Everything must be legible at that size.

**Minimum font sizes:**
- Titles: 22–26pt
- Axis labels: 14–18pt
- Tick labels: 13–16pt
- Annotations/legends: 12–14pt

**Figure dimensions:**
- Standard single chart: `(12, 4)` — wide and short works best inline
- Side-by-side panels: `(12, 3.5)`
- Square charts (contours, heatmaps): `(6, 5)` or `(8, 6)`

**Padding:**
- Use `bbox_inches='tight'` when saving to trim excess whitespace
- Use `labelpad=8` (x-axis) and `labelpad=10` (y-axis) for breathing room between labels and axes
- For subplots, use `fig.subplots_adjust(wspace=0.3)` minimum — tighter than this and labels overlap
- Leave space above the plot for titles: `ax.text(..., y=1.05, ...)` or `top=0.88` in `subplots_adjust`

**Rule of thumb:** If you squint at the figure and can't read the labels, the font is too small.

### Saving figures

Use the `savefig()` helper — it handles background colour, DPI, and tight bbox automatically:
```python
savefig('figure')          # → figure.png + figure.svg
savefig('figure.png')      # → just PNG
savefig('figure', dpi=600) # → higher DPI for print
```

See `references/matplotlib-patterns.md` for detailed examples of different chart types.

### Previewing in article context

There is a script that previews a figure in a mock Forethought article layout, so the user can check sizing and readability at the actual content width (~720px).

```bash
python3 ~/.claude/skills/forethought-diagrams/scripts/preview_in_article.py figure.png
python3 ~/.claude/skills/forethought-diagrams/scripts/preview_in_article.py figure.png "Figure 1: Description here."
```

**When to offer this:**
- After generating the **first** figure in a conversation, mention it: "I can preview this in a mock article layout if you'd like to check sizing."
- If the user declines, don't offer again unless they ask, or unless the figure has unusual sizing (very tall, very small text, many panels).
- If the user accepts once, offer it again only for significantly different figure types (e.g. switching from a single chart to a multi-panel layout).
- Never run the preview automatically — always ask first.

---

## Brand specifications (quick reference)

### Background (CRITICAL)

**Every figure must have `#FBFAF4` (Off-white) as its background — both the figure and all axes.**

- `apply_style()` handles this automatically for both figure and axes facecolor.
- Never use transparent backgrounds. Never use pure white (#FFFFFF).
- When creating figures, always pass `facecolor=COLORS['background']` to `plt.subplots()` as a safeguard.
- The `savefig()` helper also enforces this at save time.

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
- **`scripts/forethought_style.py`** — Python style module with colours, fonts, apply_style(), and savefig() helpers
- **`scripts/preview_in_article.py`** — Preview a figure in a mock article layout in the browser

### Brand assets
The Forethought brand guidelines PDF and graphic assets are stored in the shared Google Drive. Ask your team for access if needed. These include SVG illustrations in the distinctive orange line-art style that can be used as reference or incorporated into designs.
