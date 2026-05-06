# Design Brief — 34th Anniversary WhatsApp Invitation Card

**For:** Claude design (or any designer)
**From:** Bolaji Olatoye, Chief of Staff, Calvary Hephzibah Full Gospel Church
**Last updated:** 6 May 2026

---

## The job

A **single-image invitation card** designed to be shared as a WhatsApp attachment — to family chats, sister-church groups, friend-of-friend forwards.

This is **not a print flyer**. It's a digital card. Every design decision should serve the way it'll actually be seen: as a thumbnail in a chat list, expanded when tapped, possibly forwarded a few hops away.

It should land in someone's WhatsApp and immediately answer *what · when · where*, with one image that does all the work.

---

## The event

- **What:** Calvary Hephzibah Full Gospel Church 34th Anniversary Service
- **When:** Sunday 17 May 2026 · Service begins 10:30 AM (doors open 10:00 AM)
- **Where:** 74 Carmoor Road, Manchester M13 0FB
- **Theme:** *"Reasons to be Thankful"* — celebrating 34 years of God's faithfulness
- **Scripture (anchor):** Psalm 100:5 KJV — *"His mercy is everlasting; and His truth endureth to all generations."*

---

## Format & technical spec

**Primary format: 1080 × 1350 portrait** (4:5 ratio).

This is the WhatsApp-optimised size — fills a phone screen vertically without aggressive cropping in the chat preview, and is the same ratio Instagram uses for portrait posts so the same asset doubles for both.

**Also export:**
- **1080 × 1080 square** (for those who'll post it on WhatsApp Status, Facebook, IG feed)
- **1080 × 1920 vertical** (for WhatsApp Status / Stories full-screen)

**File specs:**
- PNG or high-quality JPG
- Under 1 MB if possible (WhatsApp compresses heavily above this — type gets ugly)
- sRGB colour profile
- No transparency (all formats need a solid background)

---

## What must be on the card

In rough order of visual prominence — these are the things someone has to be able to read in 2 seconds on a phone:

1. **THANKFUL** — the monumental wordmark (Anton, uppercase, hairline Calvary-red stroke)
2. **34 years** — strongly featured, possibly larger than THANKFUL
3. **Sunday 17 May · 10:30 AM** — the date and time, can't be missed
4. **Address:** 74 Carmoor Road, Manchester M13 0FB
5. **Calvary Hephzibah eagle logo** — the brand mark
6. **The website spelled out:** `calvaryhephzibah.co.uk` (so people can type/tap into a browser; the message will also carry the link)
7. **Cordial invitation language:** *"You are cordially invited"* — sets the tone

Bonus, only if the layout has room without crowding:
- *"Reasons to be Thankful"* as a tagline
- The Psalm 100:5 fragment (just *"His mercy is everlasting"* — the rest gets too small to read)
- A discreet hint at what the day holds (worship · word · meal — single words, not sentences)

## What must NOT be on the card

- **Body copy / paragraphs** — at thumbnail sizes, paragraphs become unreadable blocks
- **A QR code** — it's a digital share, not a printed handout. People won't scan their own phone
- **The word "party"** anywhere
- **AI filler:** *"step into the next chapter"*, *"a Sunday you'll be talking about all year"*, *"as we journey…"*
- **Heavy photographic backgrounds** that will compress badly through WhatsApp
- Any image of Auntie Pauline Tulloch other than her one approved BW selfie
- Any visible page-design elements (no scroll cues, no cards, no "tap me" affordances — it's a static image)

---

## Voice & tone

This card is from **Pastor Shade Olatoye** to her people. Direct, warm, Christian throughout.

**Words to reach for:** *gather, celebrate, the table, family, faithfulness, thanksgiving, presence of the Lord*
**Words to avoid:** *party, bash, do, special, powerful, amazing, journey* (as a verb), *unlock, dive in*

**Tone target:** an invitation card from a beloved auntie who happens to be a pastor.

---

## Brand & design system

### Colours

- **Calvary red:** `#C41E2A` — the brand colour, used sparingly for impact
- **Bone:** `#F0EBE2` to `#FAF6EE` — warm cream/ivory background palette
- **Obsidian:** `#0B0908` to `#15110D` — for cinematic dark moments
- **Body charcoal:** `#1A1A1A` — primary text on bone
- **Muted warm grey:** `#5A5046` — secondary text on bone

### Type

- **Display (monumental):** **Anton** — uppercase, condensed, slight negative tracking around `-0.02em`. Used for THANKFUL, possibly the "34" numeral
- **Italic serif (editorial accent):** **Instrument Serif** — for invitation lines, italicised words inside Anton headings
- **Body:** **Inter Tight** — clean sans-serif for date/address/details

### The visual signature

The defining typographic move is **Anton uppercase + italic Instrument Serif accents in red** — they should appear together. The hairline Calvary-red **outline stroke** on the Anton wordmark is part of the brand expression and should appear on the card.

---

## Composition guidance (not strict)

A WhatsApp-readable card usually wants:

- **One dominant focal point** the eye lands on first — likely the typographic treatment of "THANKFUL" or "34"
- **Generous whitespace** — type-driven design with breathing room reads better at small sizes than a busy layout
- **High contrast** — bone background with charcoal/red type will out-read a photo background every time
- **All edges away from text** — leave 80px+ of safe-area padding from the canvas edges so cropping in different feeds doesn't cut text
- **No fine details** — anything thinner than ~3px will disappear when WhatsApp compresses the file

A subtle background photo treatment is fine if it's heavily faded (10-15% opacity) and doesn't carry detail that will be lost in compression.

---

## Reference: the live e-flyer

The full, working e-flyer this card is condensed from:

🔗 **https://calvaryhfgc.github.io/calvaryhephzibah/anniversary/**

It's the source of truth for voice, palette, photo selection, and typographic hierarchy. The card should feel like the same world — same family of fonts, same red, same warm bone. **Translate the e-flyer's spirit into one image, don't redesign.**

---

## Asset access

- **Eagle logo:** https://calvaryhfgc.github.io/calvaryhephzibah/anniversary-design-system/assets/logo-eagle.png
- **Photo library:** https://calvaryhfgc.github.io/calvaryhephzibah/anniversary/assets/photos/

---

## Success criteria

The card is right when:

1. Someone in a WhatsApp chat sees the thumbnail and immediately knows it's an event invitation — not a status, not an article, not a photo
2. When tapped to full-screen, the *what · when · where* answers itself in 2 seconds
3. It survives WhatsApp's compression — no muddy edges, no unreadable type
4. It's forwardable: a member sends it on, the recipient gets the same impact
5. Pastor Shade looks at it and says, *"Yes, that's us."*
