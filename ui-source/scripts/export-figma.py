"""Exports the pieces of the Figma style guide from the built exporter page.

For each kind (screens, frames, context) it asks headless Chrome for the page's layout, takes one
2x screenshot at that exact window size, and crops every [data-export] element into its own PNG.

Usage: python3 scripts/export-figma.py <base-url> <output-folder>
  where <base-url> serves the build of vite.showcase.config.ts, e.g. http://127.0.0.1:4331
"""
import json, re, subprocess, sys
from pathlib import Path
from PIL import Image

CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
SCALE = 2
WIDTH = {"screens": 420, "frames": 1600, "context": 1400}


def chrome(*args):
    return subprocess.run([CHROME, "--headless=new", "--disable-gpu", "--hide-scrollbars",
                           "--virtual-time-budget=3000", *args], capture_output=True, text=True).stdout


def export(base, out, kind):
    url = f"{base}/exporter.html?kind={kind}"
    dom = chrome(f"--window-size={WIDTH[kind]},4000", "--dump-dom", url)
    bounds = json.loads(re.search(r'<pre id="bounds"[^>]*>(.*?)</pre>', dom, re.S).group(1).replace("&quot;", '"'))
    height = max(b["y"] + b["h"] for b in bounds) + 8
    shot = out / f"_{kind}.png"
    chrome(f"--window-size={WIDTH[kind]},{height}", f"--force-device-scale-factor={SCALE}",
           "--default-background-color=00000000", f"--screenshot={shot}", url)
    sheet = Image.open(shot)
    folder = out / kind
    folder.mkdir(parents=True, exist_ok=True)
    for b in bounds:
        box = tuple(v * SCALE for v in (b["x"], b["y"], b["x"] + b["w"], b["y"] + b["h"]))
        sheet.crop(box).save(folder / f"{b['name']}.png")
    shot.unlink()
    return len(bounds)


if __name__ == "__main__":
    base, out = sys.argv[1], Path(sys.argv[2])
    out.mkdir(parents=True, exist_ok=True)
    for kind in ("screens", "frames", "context"):
        print(kind, export(base, out, kind))
