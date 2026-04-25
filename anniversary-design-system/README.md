# Calvary Anniversary — Design System

A contemporary, youth-attractive but mature-approved visual system for **Calvary Hephzibah Faith Gospel Church**'s anniversary celebrations and broader digital presence. Designed to sit comfortably alongside the visual languages of TD Jakes Ministries, Woman Thou Art Loosed, Transformation Church, Pastor Michael Todd, and Elevation Church — bold typographic statements, cinematic dark surfaces, premium accent metals, and proclamation-style copy.

---

## Sources

- **Reference page (existing work):** https://calvaryhfgc.github.io/calvaryhephzibah/calvary-os/anniversary-planning.html
  - Theme: **THANKFUL** — "Reasons to be Thankful" — May 11, 2026
  - Pastor: Gbenga Adebanjo
  - Contains: hero countdown, vision pillars (Powerful Proclamation, Worship Excellence, Visual Impact, Ministry Showcase), critical-path timeline, CTA.
- **Peer brands referenced for tone & visual altitude:** TD Jakes, Transformation Church, Pastor Michael Todd, Elevation Church.

> ⚠️ The reference page was only available to me as rendered text (copy + structure), not raw HTML/CSS. The visual system in this folder is therefore a **principled reconstruction** — fonts, exact hexes, and spacing are best-fit choices that match the contemporary mega-church genre and the page's described aesthetic. Please review and tell me what to dial in (real fonts, real brand colors, real logo files).

---

## Index

| File / Folder | What it is |
|---|---|
| `README.md` | This file — context, content & visual foundations, iconography |
| `colors_and_type.css` | Color tokens + type scale as CSS variables and semantic classes |
| `fonts/` | Web font files (or Google Fonts links) — see substitution flag |
| `assets/` | Logos, marks, textures, placeholder imagery |
| `preview/` | Small HTML cards that populate the Design System tab |
| `ui_kits/anniversary-site/` | High-fidelity recreation of the anniversary microsite |
| `SKILL.md` | Cross-compatible Agent Skill manifest |

---

## Content Fundamentals

The voice is **declarative, present-tense, and proclamation-style** — short sentences delivered with conviction. Calvary writes the way a pastor preaches a one-line headline: it lands, it commits, it doesn't hedge.

**Voice characteristics**

- **Declaration over description.** "This is declaration." "Excellence is not optional — it's our calling." Sentences land like verdicts, often without a verb in the conventional sense.
- **Em-dashes and full stops carry weight.** Short. Punchy. Then a longer line that earns it.
- **Capitalised theme words.** The annual theme (e.g. **THANKFUL**) is rendered in solid all-caps as a typographic monument. Other key nouns — Vision, Excellence, Anointing, Kingdom — are Title-Cased mid-sentence for emphasis.
- **Pronouns: "we" + "He" (capital H).** Collective ownership of the church mission ("we acknowledge what God has done"); reverent capitalisation for deity references ("what He's building").
- **No emoji in body copy.** The reference page uses an emoji-per-pillar hint (🎤 🎵 ✨ 🎯) as a *temporary placeholder* for proper iconography. Production should replace these with line icons or custom marks. Do **not** use emoji in headlines, CTAs, or captions.
- **Numerals over words for dates.** "May 11, 2026", "Sun 26", "Wed 29".
- **Confident CTAs.** "Begin Planning Now", "Ready to Build Something Extraordinary?" — invitations framed as decisions already made.

**Tone words:** Anointed · Excellent · Cinematic · Confident · Proclamation · Honor · Kingdom · Standard-setting

**Examples lifted from the reference page**

- "More Than Celebration. This is declaration."
- "Powerful Proclamation — Biblical foundation for confident thanksgiving."
- "Excellence is not optional — it's our calling."
- "Every detail planned, every deadline strategic."
- "Excellence executed. Vision realized. God glorified through every detail."

**Avoid**

- Casual contractions in headlines ("Let's", "We're") — fine in body.
- Corporate hedging ("we hope to", "we aim to").
- Stock church jargon stacks ("blessed and highly favored" without context).
- Emoji as decoration outside the placeholder slot.

---

## Visual Foundations

**Mood.** Cinematic-night auditorium meets premium editorial. Deep near-black canvases, a single warm metal accent (**Calvary Gold**), generous breathing room around colossal typography, and the occasional full-bleed photograph treated with warm grain.

**Color**

- Primary surface is **Obsidian** (`#0B0B0E`) — not pure black. Always set a vignette or texture; never flat #000.
- Single dominant accent: **Calvary Red** (`#D0441C`) — sampled directly from the eagle-disc logo. Used for theme accents, dividers, key numerals, eyebrows, and CTAs.
- Hover/bright: `#E55A30`. Pressed/deep: `#9A2F11`. Ember (urgency band): `#6E1A0F`.
- **Calvary Gold** (`#C8A24B`) is retained as a **subtle highlight only** — never primary. Use sparingly for premium banner glows or anniversary ordinals.
- Neutrals: **Bone** (`#F4EFE6`) for high-contrast text on dark, **Ash** (`#A29C90`) for secondary copy, **Slate** (`#1C1C22`) for elevated cards on Obsidian.
- Light theme exists for collateral that prints (programmes, handouts) — Bone background, Obsidian type, Gold accents.

**Type**

- **Display:** `Boldonse` (substitute: `Anton` — flagged) — colossal all-caps theme words.
- **Editorial / serif:** `Instrument Serif` — eyebrow phrases, scripture pulls, italic accents.
- **UI / body:** `Inter Tight` — body, nav, microcopy.
- Display sizes are *unapologetic* — hero words at 18–24vw on landing surfaces. Tracking is tight (-2% to -4%) to make letters interlock.
- Body line-height 1.45–1.55. Display line-height 0.85–0.95.

**Spacing & layout**

- 8px base unit. Section vertical rhythm in multiples of 8 (32 / 64 / 96 / 128 / 192).
- Edge gutter 24px mobile, 64–96px desktop.
- 12-col grid desktop, 4-col mobile.
- Generous negative space around hero type — at least 1× the cap height of the headline below it.
- Section headers use a small uppercase **eyebrow** (12px, tracked +12%) above the main headline.

**Backgrounds**

- Default: Obsidian + a subtle radial spotlight (Calvary Red @ 8–12% opacity, top-center) and 4–6% film grain.
- Full-bleed photography is used for hero/transition sections; always treated with a 60–80% Obsidian gradient overlay so type stays legible.
- No purple gradients, no glassmorphism, no rainbow accents.
- Pattern texture: a hairline gold rule motif (1px) is the only repeating element — used as section separators, never as a fill.

**Animation**

- **Easing:** `cubic-bezier(0.22, 1, 0.36, 1)` (ease-out-quint) for entrances; `cubic-bezier(0.65, 0, 0.35, 1)` for symmetric moves.
- Durations: micro 160ms, standard 320ms, hero reveal 720–900ms.
- Hero theme words **fade up + scale from 0.96 → 1.00** with a tiny letterspacing settle (-1% → -3%).
- Eagle mark in hero treatments uses a soft drop-shadow in Calvary Red @ 35% opacity for lift on dark surfaces.
- Scroll-driven reveals — translateY(24px) + opacity 0 → 1 — staggered 60ms.
- No bounces. No spring overshoot. No carousel auto-rotate.

**States**

- **Hover (dark):** lighten surface +6% luminance OR brighten red accent to `#E55A30`. Underlines on links draw in left-to-right, 240ms.
- **Hover (light):** Obsidian text → Calvary Red; Red buttons → +6% luminance to `#E55A30`.
- **Press:** 0.97 scale, 80ms ease-out, no color shift.
- **Focus:** 2px Calvary Red ring offset by 3px from the element edge — never default browser blue.
- **Disabled:** 32% opacity, no pointer events.

**Borders & rules**

- Default border: `1px solid rgba(244, 239, 230, 0.10)` on dark surfaces.
- Accent rule: `1px solid #D0441C` — used between major sections, often at 80–120px width, centered.
- Card borders are *optional* — preferred elevation is via a slightly lighter surface (Slate on Obsidian) rather than stroke.

**Shadows**

- Elevation is restrained. Two levels:
  - `--shadow-1`: `0 2px 12px rgba(0,0,0,0.35)` — interactive cards.
  - `--shadow-2`: `0 24px 64px rgba(0,0,0,0.55)` — hero modals, pinned banners.
- **Inner glow** for spotlight emphasis on premium banners: `inset 0 0 120px rgba(208,68,28,0.10)`.

**Corner radii**

- 0px for editorial/print-feel surfaces (banners, posters, scripture pulls).
- 4px for cards and tiles.
- 8px for inputs and buttons.
- Pills (999px) for date chips and ministry tags only.

**Cards**

- Slate (`#1C1C22`) surface, no border, `--shadow-1`, 4px radius, 32–48px internal padding.
- Optional Calvary Red **eyebrow rule** (24px wide, 1px) above the card title.
- Title uses Instrument Serif italic at 22–28px; body Inter Tight 16px / 1.55, Ash color.

**Transparency & blur**

- Sticky nav uses `backdrop-filter: blur(16px)` over `rgba(11,11,14,0.72)`.
- Modal scrims: `rgba(11,11,14,0.85)` solid (no blur — preserves theatrical contrast).
- Avoid frosted glass on content cards — feels SaaS, not sanctuary.

**Imagery direction**

- Warm-toned, slightly cinematic — temperature ~3800–4400K, contrast pushed, blacks lifted ~5%.
- Subjects: congregation hands raised, stage lighting beams, choir mid-worship, pastor in proclamation, candid pews. Always anonymised crops where individuals are unidentifiable, unless we have permission.
- Apply a unifying warm tint (Calvary Red @ 6% multiply) and 3% film grain across all photography to match the brand temperature.
- Avoid: stock-photo handshakes, generic crosses on hilltops, dove silhouettes, sunbursts.

---

## Iconography

The reference page uses **emoji as placeholders** (🎤 🎵 ✨ 🎯) for the four vision pillars. This is a clear signal that real iconography is a known gap, not a deliberate choice.

**Approach.** Use **Lucide** (`https://unpkg.com/lucide@latest`) at 1.5px stroke weight, rounded line caps. Lucide's stroke-only contemporary geometric style aligns with the Calvary aesthetic and pairs cleanly with display serif type. Color: Calvary Red for accent positions, Bone for in-line text icons.

**Brand mark.** Calvary's primary symbol is a **bald eagle in flight overlaid on a Calvary-Red disc** (`assets/logo-eagle.png`). The eagle is THE icon — use it in headers, hero treatments, anniversary lockups, and any moment where a single mark is needed. Pair it with the CALVARY wordmark for full lockups; use solo for monogram positions (favicon, social avatar, app icon).

> ⚠️ **Substitution flagged.** I did not have access to the codebase to confirm an existing icon system. Lucide is the recommended substitute pending review. If Calvary already uses a custom set, please share so I can swap.

**Icon usage map (replacing the emoji placeholders):**

| Pillar | Emoji (current) | Lucide replacement |
|---|---|---|
| Powerful Proclamation | 🎤 | `mic-vocal` |
| Worship Excellence | 🎵 | `music` |
| Visual Impact | ✨ | `sparkles` *(use sparingly)* or `aperture` |
| Ministry Showcase | 🎯 | `target` or `users-round` |

- **Unicode icons:** avoid. The em-dash (`—`) and bullet (`·`) are the only typographic marks used decoratively.
- **No emoji** in production headlines, body, or CTAs.
- **Logo lockup:** word-mark **CALVARY** in Boldonse all-caps with a single hairline gold rule beneath, optionally paired with the year/anniversary ordinal in Instrument Serif italic. See `assets/logo-*`.

---

*Continue to `colors_and_type.css` for the implementation tokens.*

---

## Caveats & Open Questions

- **Source access was limited to rendered text** of the reference page — no raw HTML/CSS/JS or codebase. All visual decisions (exact hexes, fonts, spacing, motion) are principled reconstructions matching the contemporary mega-church genre + the page's described aesthetic.
- **Font substitution flagged.** Anton (display) and Instrument Serif (editorial) are best-fit Google Fonts substitutes. Inter Tight covers UI/body. Please share the real Calvary brand fonts if they exist.
- **Eagle logo received** — `assets/logo-eagle.png` (bald eagle on Calvary-Red disc). Wordmark lockups now pair it with Anton CALVARY type. If you have an official wordmark/lockup file, send it and I'll swap.
- **Iconography substituted to Lucide.** If Calvary has a custom icon set in production, swap.
- **Photography is implied but not present.** Backgrounds are SVG-rendered approximations. Real worship-service photography (warm, cinematic, lifted blacks) would replace `assets/bg-*.svg`.
