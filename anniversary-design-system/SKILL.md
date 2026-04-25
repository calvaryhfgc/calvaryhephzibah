---
name: calvary-anniversary-design
description: Use this skill to generate well-branded interfaces and assets for Calvary Hephzibah Faith Gospel Church (Calvary Anniversary), either for production or throwaway prototypes / mocks / decks. Contains essential design guidelines, colors, type, fonts, assets, and UI kit components for prototyping in the contemporary mega-church visual lane (TD Jakes, Transformation Church, Elevation, Pastor Michael Todd).
user-invocable: true
---

Read the README.md file within this skill, and explore the other available files (`colors_and_type.css`, `assets/`, `ui_kits/anniversary-site/`, `preview/`).

If creating visual artifacts (slides, mocks, throwaway prototypes, etc), copy assets out and create static HTML files for the user to view. Always link `colors_and_type.css` and reuse the tokens — never re-pick colors or fonts from scratch. The `ui_kits/anniversary-site/` folder shows how to compose the system (hero word treatment, pillar cards, countdown timeline, CTA).

If working on production code, you can copy assets and read the rules here to become an expert in designing with this brand. Lift the CSS variables directly from `colors_and_type.css`.

If the user invokes this skill without any other guidance, ask them what they want to build or design (a sermon series microsite? an event poster? a giving page? a deck?), ask clarifying questions about audience, fidelity, and any new theme word, and act as an expert designer who outputs HTML artifacts _or_ production code, depending on the need.

**Core rules to enforce:**
- Obsidian (`#0B0B0E`) surfaces, never pure black. Always vignette or grain.
- **Calvary Red (`#D0441C`)** is the primary brand accent — sampled from the eagle-disc logo. No purple gradients. Gold (`#C8A24B`) is a subtle secondary highlight only, never dominant.
- The **eagle mark** (`assets/logo-eagle.png`) is the primary brand symbol — use it in heroes, headers, lockups.
- Hero theme words are **all caps, Anton (or Boldonse), 18–24vw**, tracked tight.
- Eyebrows are 12px Inter Tight, gold, `letter-spacing: 0.18em`.
- Italic Instrument Serif is reserved for editorial accents (subtitles, scripture pulls, card titles).
- Replace placeholder emoji with Lucide icons at 1.5px stroke.
- Voice is declarative, present-tense, proclamation-style. Capital "He" for deity references.
