# Puff — design exports for Figma

Two versions of the post-research Puff, for side-by-side review.

| Folder | Version |
|---|---|
| `v0-soft/` | Soft and minimal: white cards, no outlines, the time as the headline. Shipped as 0.14.1. |
| `v1-retro/` | Retro sticker: pastel OS windows, ink outlines, washi-tape stickers, grid paper. Shipped as 0.15.0. |

Each folder has:

- `board.png` — every screen and every expression on one board, at 2x.
- `expressions/` — each expression as its own SVG. Drag the folder into Figma and they arrive as editable vector layers. They are the resting pose: the animations are CSS and do not travel into Figma.

`puff-icon.svg` is the extension icon.

## Regenerating

Both are rendered from the extension's own components, so they cannot drift from what ships.

```bash
cd ui-source
npx tsx --tsconfig tsconfig.json scripts/export-clouds.tsx ../design/figma-export/<version>/expressions
SHOWCASE_OUT=/tmp/puff-board npx vite build --config vite.showcase.config.ts
```

Then serve `/tmp/puff-board` and screenshot `showcase.html`.

## Outline rule (v1)

Containers and anything you can press get a 2px ink outline (`#34405E`, never black): windows,
title bars, stickers, buttons, fields, and props like the cup and bookmark. Decoration never does:
tape, highlights, particles, the paper grid, and the face. The cloud is outlined on its silhouette
only — the puffs are painted once in ink with a thick stroke, then again in colour on top, so no
line appears where they overlap.
