# Matplotlib patterns for Forethought figures

Detailed examples for common chart types using the Forethought style.

## Setup

All examples assume this import block:

```python
import numpy as np
import matplotlib.pyplot as plt
import matplotlib.font_manager as fm
from matplotlib.colors import LinearSegmentedColormap
import os, sys

sys.path.append(os.path.expanduser('~/.claude/skills/forethought-diagrams/scripts'))
from forethought_style import COLORS, FONTS, DATA_COLORS, apply_style
```

## Distribution / area chart

The most common pattern: a filled area under a curve.

```python
from scipy.stats import beta

fig, ax = plt.subplots(figsize=(12, 4), facecolor=COLORS['background'])

# Generate data
x = np.linspace(0.001, 0.999, 1000)
y = beta.pdf(x, 5, 5)

# Plot with fill
ax.fill_between(x, y, alpha=0.25, color=COLORS['highlight'], linewidth=0)
ax.plot(x, y, color=COLORS['highlight'], linewidth=1.5, alpha=0.9)

# Apply style
apply_style(ax, xlabel='Probability', ylabel='Density', hide_y_labels=True)

# Minimal x-ticks
ax.set_xlim(0, 1)
ax.set_xticks([0, 0.5, 1])

plt.tight_layout()
plt.savefig('distribution.png', dpi=300, facecolor=COLORS['background'], bbox_inches='tight')
```

## Side-by-side comparison

Two panels showing different views of the same data.

```python
fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(12, 3.5), facecolor=COLORS['background'])

x = np.linspace(0.001, 0.999, 1000)

# Left: Beta(5,5) - unimodal
y1 = beta.pdf(x, 5, 5)
ax1.fill_between(x, y1, alpha=0.25, color=COLORS['highlight'], linewidth=0)
ax1.plot(x, y1, color=COLORS['highlight'], linewidth=1.5, alpha=0.9)

# Right: Beta(0.5,0.5) - bimodal
y2 = beta.pdf(x, 0.5, 0.5)
ax2.fill_between(x, y2, alpha=0.25, color=COLORS['highlight'], linewidth=0)
ax2.plot(x, y2, color=COLORS['highlight'], linewidth=1.5, alpha=0.9)

# Match y-axis limits
max_y = max(y1.max(), y2.max())

for ax in [ax1, ax2]:
    apply_style(ax, xlabel='Value', hide_y_labels=True)
    ax.set_xlim(0, 1)
    ax.set_ylim(0, max_y * 1.05)
    ax.set_xticks([0, 0.5, 1])

# Titles above plots (using TT Hoves)
ax1.text(0.5, 1.05, 'Concentrated', transform=ax1.transAxes, ha='center',
         fontsize=24, color=COLORS['text'], fontproperties=FONTS['label_medium'])
ax2.text(0.5, 1.05, 'Polarised', transform=ax2.transAxes, ha='center',
         fontsize=24, color=COLORS['text'], fontproperties=FONTS['label_medium'])

# Only left plot gets y-label
ax1.set_ylabel('Density', fontsize=16, color=COLORS['text'],
               fontproperties=FONTS['body'], labelpad=10)

# Adjust spacing
plt.tight_layout(pad=1.5)
fig.subplots_adjust(wspace=0.3, bottom=0.15, top=0.88)

plt.savefig('comparison.png', dpi=300, facecolor=COLORS['background'], bbox_inches='tight')
```

## Overlaid distributions

Two distributions on the same axes (primary + secondary).

```python
fig, ax = plt.subplots(figsize=(12, 4), facecolor=COLORS['background'])

x = np.linspace(0.001, 0.999, 1000)

# Secondary distribution (background, muted)
y1 = beta.pdf(x, 2, 5)
ax.fill_between(x, y1, alpha=0.15, color=COLORS['grey'], linewidth=0)
ax.plot(x, y1, color=COLORS['grey'], linewidth=1.2, alpha=0.6)

# Primary distribution (foreground, highlighted)
y2 = beta.pdf(x, 5, 2)
ax.fill_between(x, y2, alpha=0.25, color=COLORS['highlight'], linewidth=0)
ax.plot(x, y2, color=COLORS['highlight'], linewidth=1.5, alpha=0.9)

apply_style(ax, xlabel='Probability', hide_y_labels=True)
ax.set_xlim(0, 1)
ax.set_xticks([0, 0.5, 1])

plt.tight_layout()
plt.savefig('overlay.png', dpi=300, facecolor=COLORS['background'], bbox_inches='tight')
```

## Mean/reference lines with labels

Adding vertical lines to mark important values.

```python
fig, ax = plt.subplots(figsize=(12, 4), facecolor=COLORS['background'])

x = np.linspace(0.001, 0.999, 1000)
alpha_param, beta_param = 3, 7
y = beta.pdf(x, alpha_param, beta_param)

ax.fill_between(x, y, alpha=0.25, color=COLORS['highlight'], linewidth=0)
ax.plot(x, y, color=COLORS['highlight'], linewidth=1.5, alpha=0.9)

# Calculate and plot mean
mean_value = alpha_param / (alpha_param + beta_param)
ax.axvline(mean_value, color=COLORS['highlight'], linewidth=1, linestyle='--', alpha=0.7)

# Label with background box
ax.text(mean_value, 0.98, f'Mean = {mean_value:.2f}',
        ha='center', va='top', transform=ax.get_xaxis_transform(),
        fontsize=13, color=COLORS['highlight'], fontproperties=FONTS['body'],
        bbox=dict(boxstyle='round,pad=0.3', facecolor=COLORS['background'], edgecolor='none'))

apply_style(ax, xlabel='Probability', hide_y_labels=True)
ax.set_xlim(0, 1)

plt.tight_layout()
plt.savefig('mean_line.png', dpi=300, facecolor=COLORS['background'], bbox_inches='tight')
```

## Contour / heatmap

For 2D data visualisation.

```python
fig, ax = plt.subplots(figsize=(6, 5), facecolor=COLORS['background'])

# Create grid
resolution = 500
x = np.linspace(0, 1, resolution)
y = np.linspace(0, 1, resolution)
X, Y = np.meshgrid(x, y)

# Example function: f(x,y) = xy(1-y)
Z = X * Y * (1 - Y)

# Custom colormap: background -> highlight
cmap = LinearSegmentedColormap.from_list('forethought',
    [COLORS['background'], COLORS['highlight']], N=256)

# Filled contours
ax.contourf(X, Y, Z, levels=20, cmap=cmap)

# Contour lines for readability
ax.contour(X, Y, Z, levels=10, colors=COLORS['text'], linewidths=0.5, alpha=0.4)

apply_style(ax, title='Contour example', xlabel='X', ylabel='Y')
ax.set_xticks([0, 0.5, 1])
ax.set_yticks([0, 0.5, 1])

plt.tight_layout()
plt.savefig('contour.png', dpi=300, facecolor=COLORS['background'], bbox_inches='tight')
```

## Diverging contour (two-colour)

For data with positive/negative or two categories.

```python
fig, ax = plt.subplots(figsize=(6, 5), facecolor=COLORS['background'])

x = np.linspace(0, 1, 500)
y = np.linspace(0, 1, 500)
X, Y = np.meshgrid(x, y)

# Difference function (positive and negative)
Z = X - Y

# Diverging colormap: blue -> background -> orange
cmap = LinearSegmentedColormap.from_list('diverging',
    [COLORS['blue'], COLORS['background'], COLORS['highlight']], N=256)

ax.contourf(X, Y, Z, levels=20, cmap=cmap, vmin=-1, vmax=1)
ax.contour(X, Y, Z, levels=[0], colors=COLORS['text'], linewidths=1)  # zero line

apply_style(ax, xlabel='X', ylabel='Y')

plt.tight_layout()
plt.savefig('diverging.png', dpi=300, facecolor=COLORS['background'], bbox_inches='tight')
```

## Multi-series line chart

Multiple data series with legend.

```python
fig, ax = plt.subplots(figsize=(12, 4), facecolor=COLORS['background'])

x = np.linspace(0, 10, 100)

datasets = [
    (np.sin(x), 'Series A'),
    (np.cos(x), 'Series B'),
    (np.sin(x + 1), 'Series C'),
]

for i, (y, label) in enumerate(datasets):
    ax.plot(x, y, color=DATA_COLORS[i], linewidth=1.5, label=label)

apply_style(ax, xlabel='Time', ylabel='Value')

# Legend styling
legend = ax.legend(frameon=False, fontsize=12)
for text in legend.get_texts():
    text.set_fontproperties(FONTS['body'])
    text.set_color(COLORS['text'])

plt.tight_layout()
plt.savefig('multi_series.png', dpi=300, facecolor=COLORS['background'], bbox_inches='tight')
```

## Bar chart

```python
fig, ax = plt.subplots(figsize=(10, 4), facecolor=COLORS['background'])

categories = ['A', 'B', 'C', 'D', 'E']
values = [23, 45, 56, 78, 32]

bars = ax.bar(categories, values, color=COLORS['highlight'], alpha=0.8, edgecolor='none')

apply_style(ax, ylabel='Count')

# Remove x-axis spine for cleaner look with bars
ax.spines['bottom'].set_visible(False)
ax.tick_params(axis='x', length=0)

plt.tight_layout()
plt.savefig('bar_chart.png', dpi=300, facecolor=COLORS['background'], bbox_inches='tight')
```

## Logistic / sigmoid curve

Common for probability visualisations.

```python
fig, ax = plt.subplots(figsize=(12, 5), facecolor=COLORS['background'])

def sigmoid(x):
    return 1.0 / (1.0 + np.exp(-x))

x = np.linspace(-6, 6, 1000)
y = sigmoid(x)

ax.plot(x, y, color=COLORS['text'], linewidth=1.5)

# Highlight a region
x_region = np.linspace(-1, 1, 100)
y_region = sigmoid(x_region)
ax.fill_between(x_region, 0, y_region, alpha=0.25, color=COLORS['highlight'])

apply_style(ax, xlabel='Log-odds', ylabel='Probability')
ax.set_ylim(0, 1.02)
ax.set_yticks([0, 0.5, 1])

plt.tight_layout()
plt.savefig('sigmoid.png', dpi=300, facecolor=COLORS['background'], bbox_inches='tight')
```

## Annotations with arrows

```python
fig, ax = plt.subplots(figsize=(12, 4), facecolor=COLORS['background'])

x = np.linspace(0, 10, 100)
y = np.sin(x)

ax.plot(x, y, color=COLORS['highlight'], linewidth=1.5)

# Arrow annotation
ax.annotate(
    'Peak',
    xy=(np.pi/2, 1),
    xytext=(np.pi/2 + 1.5, 0.7),
    fontsize=14,
    color=COLORS['text'],
    fontproperties=FONTS['body'],
    arrowprops=dict(arrowstyle='->', color=COLORS['text'], lw=1)
)

apply_style(ax, xlabel='X', ylabel='Y')

plt.tight_layout()
plt.savefig('annotation.png', dpi=300, facecolor=COLORS['background'], bbox_inches='tight')
```

## Figure sizing guidelines

| Layout | Size | Use |
|--------|------|-----|
| Single wide | `(12, 4)` | Standard single chart |
| Single tall | `(8, 6)` | Square-ish charts, contours |
| Side-by-side | `(12, 3.5)` | Two comparison panels |
| Triple | `(14, 3.5)` | Three panels |
| Stacked | `(8, 8)` | Two rows |

## Common adjustments

**Log scale y-axis:**
```python
ax.set_yscale('log')
```

**Reduce x-ticks:**
```python
ax.set_xticks([0, 0.5, 1])
```

**Remove y-tick labels (density plots):**
```python
ax.set_yticklabels([])
```

**Add padding at top:**
```python
ax.set_ylim(0, y.max() * 1.05)
```

**Subplot spacing:**
```python
fig.subplots_adjust(wspace=0.3, bottom=0.15, top=0.88)
```

## Saving

Always save both PNG and SVG:

```python
plt.savefig('figure.png', dpi=300, facecolor=COLORS['background'], bbox_inches='tight')
plt.savefig('figure.svg', facecolor=COLORS['background'], bbox_inches='tight')
```

Key settings:
- `dpi=300` — High resolution for print/web
- `facecolor=COLORS['background']` — Ensures off-white background is saved
- `bbox_inches='tight'` — Removes excess whitespace
