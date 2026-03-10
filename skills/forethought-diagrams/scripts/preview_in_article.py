"""
Preview a figure in the context of a Forethought article.

Usage:
    python preview_in_article.py figure.png
    python preview_in_article.py figure.png "Figure 1: Description of the figure."
    python preview_in_article.py figure.png --caption "Figure 1: Caption here"

Opens a browser window showing the figure embedded in a mock article layout
that matches the Forethought website styling.
"""

import argparse
import base64
import os
import sys
import tempfile
import webbrowser
from pathlib import Path

TEMPLATE = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Figure preview — Forethought</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=Inter:wght@400;500&display=swap');

  * {{ margin: 0; padding: 0; box-sizing: border-box; }}

  body {{
    background: #FBFAF4;
    color: #2F2A26;
    font-family: 'Cormorant Garamond', Georgia, serif;
    font-weight: 300;
    font-size: 19px;
    line-height: 1.7;
    -webkit-font-smoothing: antialiased;
  }}

  .article {{
    max-width: 640px;
    margin: 80px auto;
    padding: 0 24px;
  }}

  h1 {{
    font-family: 'Cormorant Garamond', Georgia, serif;
    font-weight: 300;
    font-size: 42px;
    line-height: 1.2;
    margin-bottom: 12px;
  }}

  .byline {{
    font-family: 'Inter', -apple-system, sans-serif;
    font-size: 14px;
    font-weight: 400;
    color: #757371;
    margin-bottom: 48px;
    letter-spacing: 0.01em;
  }}

  p {{
    margin-bottom: 1.4em;
  }}

  .figure-container {{
    margin: 48px 0;
    text-align: center;
  }}

  .figure-container img {{
    max-width: 100%;
    height: auto;
    display: block;
    margin: 0 auto;
  }}

  figcaption {{
    font-family: 'Cormorant Garamond', Georgia, serif;
    font-style: italic;
    font-weight: 300;
    font-size: 18px;
    line-height: 1.5;
    color: #2F2A26;
    text-align: center;
    max-width: 600px;
    margin: 20px auto 0;
  }}

  .preview-banner {{
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    background: #FA7248;
    color: #FBFAF4;
    font-family: 'Inter', -apple-system, sans-serif;
    font-size: 13px;
    font-weight: 500;
    text-align: center;
    padding: 6px 0;
    letter-spacing: 0.02em;
    z-index: 100;
  }}
</style>
</head>
<body>

<div class="preview-banner">FIGURE PREVIEW — Check sizing, readability, and spacing in article context</div>

<article class="article">

  <h1>Sample article title for figure preview</h1>
  <div class="byline">Forethought Research &middot; 2026</div>

  <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent vel semper nibh. Cras in augue at sapien bibendum convallis. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia curae; Donec vel neque nec felis aliquet fringilla vitae in libero.</p>

  <p>The resulting figure is shown below:</p>

  <figure class="figure-container">
    <img src="{image_src}" alt="Figure preview">
    {caption_html}
  </figure>

  <p>Suspendisse potenti. Nulla facilisi. Integer tincidunt, urna at tincidunt aliquam, nisi lacus ultrices dui, in placerat nibh eros eget lorem. Fusce auctor, magna a cursus sagittis, felis nunc condimentum purus, sit amet fermentum nulla ante non diam.</p>

  <p>Maecenas sed diam eget risus varius blandit sit amet non magna. Donec id elit non mi porta gravida at eget metus. Aenean lacinia bibendum nulla sed consectetur. Cras mattis consectetur purus sit amet fermentum. Nullam quis risus eget urna mollis ornare vel eu leo.</p>

</article>

</body>
</html>"""


def main():
    parser = argparse.ArgumentParser(description="Preview a figure in Forethought article context")
    parser.add_argument("image", help="Path to the figure image (PNG, SVG, etc.)")
    parser.add_argument("caption", nargs="?", default="", help="Optional figure caption")
    parser.add_argument("--caption", "-c", dest="caption_flag", default=None, help="Optional figure caption")
    args = parser.parse_args()

    image_path = Path(args.image).resolve()
    if not image_path.exists():
        print(f"Error: {image_path} not found", file=sys.stderr)
        sys.exit(1)

    caption = args.caption_flag or args.caption

    # Embed image as base64 so the HTML is self-contained
    suffix = image_path.suffix.lower()
    mime_types = {
        ".png": "image/png",
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".svg": "image/svg+xml",
        ".webp": "image/webp",
    }
    mime = mime_types.get(suffix, "image/png")

    with open(image_path, "rb") as f:
        encoded = base64.b64encode(f.read()).decode("ascii")
    image_src = f"data:{mime};base64,{encoded}"

    caption_html = f"<figcaption>{caption}</figcaption>" if caption else ""

    html = TEMPLATE.format(image_src=image_src, caption_html=caption_html)

    # Write to temp file and open
    with tempfile.NamedTemporaryFile("w", suffix=".html", delete=False, prefix="ft-preview-") as f:
        f.write(html)
        tmp_path = f.name

    webbrowser.open(f"file://{tmp_path}")
    print(f"Preview opened in browser: {tmp_path}")


if __name__ == "__main__":
    main()
