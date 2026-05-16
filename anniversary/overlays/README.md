# Anniversary Overlay Generator

Renders the 1920×1080 broadcast overlay PNGs used in Calvary Hephzibah's anniversary services. Lives in this repo so that the script survives across sessions, machines, and re-generations.

## Quick start

```bash
cd anniversary/overlays
pip install pillow fonttools brotli --break-system-packages
python3 render_sermon.py     # renders the 10 sermon scripture supers
```

## What it produces

Three overlay templates:

- **`section_marker(label, subtitle=None, eyebrow='NOW')`** — upper-third section header (e.g. "WELCOME ADDRESS", "PRAYER MINISTRY")
- **`name_super(name, role, eyebrow='CALVARY HEPHZIBAH')`** — lower-third person identifier (e.g. "Pastor Gbenga Adebanjo / PREACHING")
- **`scripture_super(reference, version='', eyebrow='SCRIPTURE')`** — lower-third scripture reference (e.g. "1 Samuel 7:12 / KJV")

Each produces a full 1920×1080 PNG. Drop into Control Room's overlay layer; OBS captures the overlay stream and composites over the camera feed.

## Visual identity

- **Headline font:** Big Shoulders Display Bold (Google Fonts via Fontsource, OFL-licensed)
- **Eyebrow / label / role font:** Inter Tight (Google Fonts, OFL-licensed)
- **Strip background:** `#0A0A0A` obsidian
- **Accent line:** `#D0441C` Calvary red, 3px
- **Primary text:** `#F5F1E8` bone
- **Secondary text:** `#ACACAC` dim
- **Canvas outside strip:** pure black

Section markers have an obsidian strip at the top with the red line at its bottom edge. Name supers and scripture supers have the strip at the bottom with the red line at its top edge. Section markers use the brand mark without a divider; lower-third supers use a vertical divider between the stacked labels and the "34".

## Re-generating after the brief changes

The script is parametric. To regenerate, edit the relevant render script (e.g. `render_sermon.py`) and re-run. Every parameter that was given to a render call is the source of truth — no Photoshop, no manual export.

To add a new asset type (e.g. "video greeting" lower-thirds, "birthday celebration" full-frames), add a new function to `generator.py` following the same pattern.

## How this script came to be

The script was written from scratch on 16 May 2026 by reverse-engineering the existing v1 PNG inventory: measuring strip heights, font sizes, colour values, and text positions empirically from the rendered output. The original generator that produced v1 was Claude-generated in an earlier session and lost when that session ended.

This script lives in the repo to prevent that recurrence.

## Adding fonts

If a new font is needed, the easiest path is to pull from `@fontsource/<font-name>` via npm and convert woff2 → ttf via fonttools. See the generator history in commits for examples.

## License notes

- Big Shoulders Display: SIL Open Font License (OFL)
- Inter Tight: SIL Open Font License (OFL)
- Anton: SIL Open Font License (OFL) — bundled but unused in current templates

All fonts can be committed and redistributed.

---

*For questions: bolaji@calvaryhephzibah.co.uk*
