"""
Forethought brand style for matplotlib figures.

Usage:
    from forethought_style import COLORS, FONTS, apply_style, savefig

    fig, ax = plt.subplots(figsize=(12, 4), facecolor=COLORS['background'])
    ax.plot(x, y, color=COLORS['highlight'])
    apply_style(ax, title='My Chart', xlabel='X axis')
    savefig('chart')  # saves chart.png + chart.svg with correct settings
"""

import matplotlib.pyplot as plt
import matplotlib.font_manager as fm
import platform
from pathlib import Path
from typing import Optional
import warnings

# =============================================================================
# COLOUR PALETTE
# =============================================================================

COLORS = {
    # Primary colours
    'background': '#FBFAF4',      # Off-white (REQUIRED for all figures)
    'text': '#2F2A26',            # Charcoal - primary text and lines
    'highlight': '#FA7248',       # Orange - primary accent

    # Grey scale
    'dark_background': '#EEECE4', # Dark off-white - secondary panels
    'light_grey': '#DFDFDF',      # Borders
    'grey': '#C2C2C2',            # Muted elements
    'dark_grey': '#757371',       # Secondary text

    # Data visualisation colours (in recommended order)
    'blue': '#4988A9',
    'green': '#43B85D',
    'purple': '#8B61A6',
    'yellow': '#E6C90A',
    'orange': '#FF774C',          # Secondary orange (different from highlight)
    'red': '#A7313E',
}

# Convenience list for multi-series data (use in order)
DATA_COLORS = [
    COLORS['blue'],
    COLORS['green'],
    COLORS['purple'],
    COLORS['yellow'],
    COLORS['orange'],
    COLORS['red'],
]

# =============================================================================
# FONT SETUP
# =============================================================================

def _get_font_dirs():
    """Return font directories to search, in priority order."""
    home = Path.home()
    if platform.system() == 'Darwin':
        return [
            home / 'Library' / 'Fonts',
            Path('/Library/Fonts'),
        ]
    elif platform.system() == 'Windows':
        return [
            Path(r'C:\Windows\Fonts'),
            home / 'AppData' / 'Local' / 'Microsoft' / 'Windows' / 'Fonts',
        ]
    else:  # Linux
        return [
            home / '.local' / 'share' / 'fonts',
            home / '.fonts',
            Path('/usr/share/fonts'),
        ]

_PRIMARY_FONTS = {
    'heading': 'Signifier-Medium.otf',
    'body': 'Signifier-Light.otf',
    'label': 'TT-Hoves-Pro-Regular.otf',
    'label_medium': 'TT-Hoves-Pro-Medium.otf',
}

_FALLBACK_FONTS = {
    'heading': 'Cormorant Garamond',
    'body': 'Cormorant Garamond',
    'label': 'Inter',
    'label_medium': 'Inter',
}

FONTS = {}
_fonts_loaded = False


def _load_fonts():
    """Load fonts, trying primary fonts first with fallback."""
    global FONTS, _fonts_loaded

    if _fonts_loaded:
        return

    font_dirs = _get_font_dirs()
    fonts_missing = []

    for key, filename in _PRIMARY_FONTS.items():
        font_path = None
        for d in font_dirs:
            candidate = d / filename
            if candidate.exists():
                font_path = candidate
                break

        if font_path:
            try:
                fm.fontManager.addfont(str(font_path))
                FONTS[key] = fm.FontProperties(fname=str(font_path))
            except Exception:
                FONTS[key] = fm.FontProperties(family=_FALLBACK_FONTS[key])
                fonts_missing.append(filename)
        else:
            FONTS[key] = fm.FontProperties(family=_FALLBACK_FONTS[key])
            fonts_missing.append(filename)

    if fonts_missing:
        warnings.warn(
            f"Forethought fonts not found, using fallbacks: {fonts_missing}. "
            f"Install Signifier and TT Hoves to your system fonts directory."
        )

    _fonts_loaded = True


_load_fonts()


# =============================================================================
# STYLE HELPER
# =============================================================================

def apply_style(
    ax,
    title: Optional[str] = None,
    xlabel: Optional[str] = None,
    ylabel: Optional[str] = None,
    hide_y_labels: bool = False,
    title_fontsize: int = 24,
    label_fontsize: int = 16,
    tick_fontsize: int = 15,
):
    """
    Apply Forethought style to a matplotlib axes.

    Parameters:
        ax: matplotlib Axes object
        title: Optional title text (positioned above plot)
        xlabel: Optional x-axis label
        ylabel: Optional y-axis label
        hide_y_labels: If True, hide y-axis tick labels (useful for density plots)
        title_fontsize: Font size for title (default 24)
        label_fontsize: Font size for axis labels (default 16)
        tick_fontsize: Font size for tick labels (default 15)

    Example:
        fig, ax = plt.subplots(facecolor=COLORS['background'])
        ax.plot(x, y, color=COLORS['highlight'])
        apply_style(ax, title='Distribution', xlabel='Value', hide_y_labels=True)
    """
    # Background — set on BOTH figure and axes so the off-white is never missed
    ax.figure.set_facecolor(COLORS['background'])
    ax.set_facecolor(COLORS['background'])

    # Minimal spines - only left and bottom (Tufte style)
    ax.spines['top'].set_visible(False)
    ax.spines['right'].set_visible(False)
    ax.spines['left'].set_color(COLORS['text'])
    ax.spines['bottom'].set_color(COLORS['text'])
    ax.spines['left'].set_linewidth(0.5)
    ax.spines['bottom'].set_linewidth(0.5)

    # Minimal ticks
    ax.tick_params(colors=COLORS['text'], width=0.5, length=3)

    # Tick label font
    for label in ax.get_xticklabels() + ax.get_yticklabels():
        label.set_fontproperties(FONTS['body'])
        label.set_fontsize(tick_fontsize)

    if hide_y_labels:
        ax.set_yticklabels([])

    # Title (TT Hoves Medium, above plot)
    if title:
        ax.text(
            0.5, 1.05, title,
            transform=ax.transAxes,
            ha='center',
            fontsize=title_fontsize,
            color=COLORS['text'],
            fontproperties=FONTS['label_medium']
        )

    # Axis labels (Signifier)
    if xlabel:
        ax.set_xlabel(
            xlabel,
            fontsize=label_fontsize,
            color=COLORS['text'],
            fontproperties=FONTS['body'],
            labelpad=8
        )

    if ylabel:
        ax.set_ylabel(
            ylabel,
            fontsize=label_fontsize,
            color=COLORS['text'],
            fontproperties=FONTS['body'],
            labelpad=10
        )


# =============================================================================
# SAVE HELPER
# =============================================================================

def savefig(path, dpi=300, formats=('png', 'svg')):
    """
    Save the current figure with correct Forethought settings.

    Saves with the brand background colour, tight bounding box, and high DPI.
    If path has no extension, saves in all specified formats.
    If path has an extension, saves only that format.

    Examples:
        savefig('chart')              # → chart.png + chart.svg
        savefig('chart.png')          # → chart.png only
        savefig('chart', dpi=600)     # → chart.png (600 dpi) + chart.svg
    """
    p = Path(path)

    if p.suffix:
        # Explicit extension — save just that format
        plt.savefig(
            str(p), dpi=dpi, facecolor=COLORS['background'], bbox_inches='tight'
        )
    else:
        # No extension — save all requested formats
        for fmt in formats:
            plt.savefig(
                f'{p}.{fmt}', dpi=dpi, facecolor=COLORS['background'], bbox_inches='tight'
            )
