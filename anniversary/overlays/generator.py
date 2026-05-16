"""
Calvary Hephzibah Anniversary Overlay Generator
================================================
Renders 1920x1080 PNG overlays matching the v1 visual identity.

Measurements derived empirically from existing v1 assets (see precise_measure.py).
This is the canonical generator script. Lives in the repo so it survives
across sessions. See README at bottom of this file for usage.
"""
from PIL import Image, ImageDraw, ImageFont
from pathlib import Path

# ──────────────────────────────────────────────────────────────────────────
# DESIGN TOKENS — all values measured from existing v1 assets
# ──────────────────────────────────────────────────────────────────────────

# Canvas
W, H = 1920, 1080

# Colours
BLACK = (0, 0, 0, 255)
OBSIDIAN = (10, 10, 10, 255)
RED = (208, 68, 28, 255)
BONE = (245, 241, 232, 255)
DIM = (172, 172, 172, 255)

# ── Section marker (upper-third) geometry ──
SEC_STRIP_HEIGHT = 158
SEC_RED_LINE_Y = 158
SEC_RED_THICKNESS = 3

SEC_LEFT_MARGIN = 99               # measured from "N" of NOW eyebrow

SEC_EYEBROW_Y = 41                 # top of eyebrow text
SEC_EYEBROW_SIZE = 19              # Inter 600 — gives 14px cap height
SEC_EYEBROW_TRACKING = 0.24

SEC_HEADLINE_Y = 84                # top of headline cap
SEC_HEADLINE_SIZE = 68             # Big Shoulders 700 — gives 55px cap height

SEC_SUB_BASELINE_OFFSET = 14       # subtitle's baseline sits this many px above headline's bottom
SEC_SUB_SIZE = 16                  # Inter 600
SEC_SUB_TRACKING = 0.20
SEC_SUB_GAP = 30                   # gap between headline end and subtitle start

# Right brand mark
SEC_34_RIGHT_EDGE = 1819           # right edge of "4" in "34"
SEC_34_Y = 64                      # top of "3" and "4"
SEC_34_SIZE = 68                   # Big Shoulders 700 — matches headline cap

SEC_LABEL_RIGHT_EDGE = 1742        # right edge of labels (CALVARY / EST 1992)
SEC_LABEL_TOP_Y = 68               # top of "CALVARY"
SEC_LABEL_BOTTOM_Y = 87            # top of "EST 1992"
SEC_LABEL_SIZE = 12                # Inter 600
SEC_LABEL_TRACKING = 0.18

SEC_DIVIDER_X = 1750               # vertical divider position
SEC_DIVIDER_TOP_Y = 66
SEC_DIVIDER_BOTTOM_Y = 117

# ── Name super (lower-third) geometry ──
# Measured separately from the name super files
LOWER_RED_LINE_Y = 862
LOWER_RED_THICKNESS = 3
LOWER_STRIP_HEIGHT = H - LOWER_RED_LINE_Y - 1  # 217

# Font paths
FONT_DIR = Path(__file__).parent / 'fonts'
FONT_HEADLINE = str(FONT_DIR / 'big-shoulders-display-700.ttf')  # the actual headline font
FONT_ANTON = str(FONT_DIR / 'anton-400.ttf')                      # kept for legacy/fallback
FONT_INTER_500 = str(FONT_DIR / 'inter-tight-500.ttf')
FONT_INTER_600 = str(FONT_DIR / 'inter-tight-600.ttf')
FONT_INTER_700 = str(FONT_DIR / 'inter-tight-700.ttf')


# ──────────────────────────────────────────────────────────────────────────
# CANVAS HELPERS
# ──────────────────────────────────────────────────────────────────────────

def new_canvas():
    """Black 1920x1080 canvas."""
    return Image.new('RGBA', (W, H), BLACK)


def draw_section_strip(img):
    """Upper strip: obsidian fill, red line at the bottom edge."""
    d = ImageDraw.Draw(img)
    d.rectangle([0, 0, W, SEC_STRIP_HEIGHT - 1], fill=OBSIDIAN)
    d.rectangle([0, SEC_RED_LINE_Y, W, SEC_RED_LINE_Y + SEC_RED_THICKNESS - 1], fill=RED)


def draw_lower_strip(img):
    """Lower strip: obsidian fill, red line at top edge."""
    d = ImageDraw.Draw(img)
    d.rectangle([0, LOWER_RED_LINE_Y, W, H - 1], fill=OBSIDIAN)
    d.rectangle([0, LOWER_RED_LINE_Y, W, LOWER_RED_LINE_Y + LOWER_RED_THICKNESS - 1], fill=RED)


def tracked_text(draw, xy, text, font, fill, tracking=0.16):
    """
    Draw text with letter-spacing. tracking is em-relative.
    For ALL-CAPS labels: 0.16-0.24 is the visual register we want.
    """
    x, y = xy
    em = font.size
    extra = em * tracking
    for char in text:
        draw.text((x, y), char, font=font, fill=fill)
        w = draw.textlength(char, font=font)
        x += w + extra
    return x


def measure_tracked(draw, text, font, tracking=0.16):
    """Total advance width of tracked text (excludes trailing spacing)."""
    em = font.size
    extra = em * tracking
    total = 0
    for char in text:
        total += draw.textlength(char, font=font) + extra
    return total - extra


# ──────────────────────────────────────────────────────────────────────────
# RIGHT BRAND MARK (used by section markers and lower strip variants)
# ──────────────────────────────────────────────────────────────────────────

def draw_section_brand_mark(img):
    """
    Top-right brand: stacked CALVARY/EST 1992 labels + red "34".
    No divider line — measured from the v1 reference, none is drawn.
    """
    d = ImageDraw.Draw(img)

    # "34" — Anton, red, right-aligned to SEC_34_RIGHT_EDGE
    f34 = ImageFont.truetype(FONT_HEADLINE, SEC_34_SIZE)
    text34 = '34'
    w34 = d.textlength(text34, font=f34)
    x34 = SEC_34_RIGHT_EDGE - w34
    d.text((x34, SEC_34_Y), text34, font=f34, fill=RED)

    # Stacked labels CALVARY / EST 1992, right-aligned to SEC_LABEL_RIGHT_EDGE
    flabel = ImageFont.truetype(FONT_INTER_600, SEC_LABEL_SIZE)
    w_calvary = measure_tracked(d, 'CALVARY', flabel, SEC_LABEL_TRACKING)
    w_est = measure_tracked(d, 'EST 1992', flabel, SEC_LABEL_TRACKING)
    tracked_text(d, (SEC_LABEL_RIGHT_EDGE - w_calvary, SEC_LABEL_TOP_Y),
                 'CALVARY', flabel, BONE, SEC_LABEL_TRACKING)
    tracked_text(d, (SEC_LABEL_RIGHT_EDGE - w_est, SEC_LABEL_BOTTOM_Y),
                 'EST 1992', flabel, DIM, SEC_LABEL_TRACKING)


# ──────────────────────────────────────────────────────────────────────────
# SECTION MARKER (upper-third)
# ──────────────────────────────────────────────────────────────────────────

def section_marker(label, subtitle=None, eyebrow='NOW'):
    """
    Upper-third section marker.

        NOW                                            CALVARY    34
        WELCOME ADDRESS      & SUBTITLE                EST 1992
        ─── red line ───
    """
    img = new_canvas()
    draw_section_strip(img)
    d = ImageDraw.Draw(img)

    # Eyebrow (tracked uppercase, red)
    feyebrow = ImageFont.truetype(FONT_INTER_600, SEC_EYEBROW_SIZE)
    tracked_text(d, (SEC_LEFT_MARGIN, SEC_EYEBROW_Y),
                 eyebrow.upper(), feyebrow, RED, SEC_EYEBROW_TRACKING)

    # Headline (Anton, uppercase, bone)
    fheadline = ImageFont.truetype(FONT_HEADLINE, SEC_HEADLINE_SIZE)
    headline_text = label.upper()
    d.text((SEC_LEFT_MARGIN, SEC_HEADLINE_Y), headline_text, font=fheadline, fill=BONE)
    headline_w = d.textlength(headline_text, font=fheadline)

    # Optional subtitle (Inter, dim, baseline-aligned to headline)
    if subtitle:
        fsub = ImageFont.truetype(FONT_INTER_600, SEC_SUB_SIZE)
        sub_y = SEC_HEADLINE_Y + 26  # empirical offset matching reference
        tracked_text(d, (SEC_LEFT_MARGIN + headline_w + SEC_SUB_GAP, sub_y),
                     subtitle.upper(), fsub, DIM, SEC_SUB_TRACKING)

    # Right brand mark
    draw_section_brand_mark(img)

    return img


# ──────────────────────────────────────────────────────────────────────────
# NAME SUPER (lower-third, person/role) and SCRIPTURE SUPER (lower-third, ref/note)
# ──────────────────────────────────────────────────────────────────────────

# Measured from 04-name-pastor-gbenga.png
LOWER_LEFT_MARGIN = 100

LOWER_EYEBROW_Y = 907              # top of red "CALVARY HEPHZIBAH"
LOWER_EYEBROW_SIZE = 19            # Inter 600
LOWER_EYEBROW_TRACKING = 0.24

LOWER_HEADLINE_Y = 950             # top of headline (Big Shoulders title-case)
LOWER_HEADLINE_SIZE = 88           # Big Shoulders 700 ~88pt — gives 71px caps, 76px ascender-to-descender

LOWER_ROLE_Y = 1050                # top of role line (small dim Inter caps)
LOWER_ROLE_SIZE = 14               # Inter 600
LOWER_ROLE_TRACKING = 0.22

# Brand mark for lower-third — labels read "YEARS OF / CALVARY / EST. 1992"
# stacked above each other, then a divider, then "34" in red.
LOWER_34_RIGHT_EDGE = 1819
LOWER_34_Y = 945
LOWER_34_SIZE = 100                # Big Shoulders 700 ~100pt — gives 88x81 (matches reference 90x82)

LOWER_LABELS_RIGHT_EDGE = 1660
LOWER_LABELS_TOP_Y = 945           # "YEARS OF" line
LOWER_DIVIDER_X = 1693             # vertical divider between labels and "34"
LOWER_DIVIDER_TOP_Y = 910
LOWER_DIVIDER_BOTTOM_Y = 1030


def draw_lower_brand_mark(img):
    """
    Lower-third brand: YEARS OF / CALVARY / EST 1992 stacked on left,
    vertical divider, then "34" on right.
    """
    d = ImageDraw.Draw(img)

    # "34" — Big Shoulders, big, red
    f34 = ImageFont.truetype(FONT_HEADLINE, LOWER_34_SIZE)
    text34 = '34'
    w34 = d.textlength(text34, font=f34)
    x34 = LOWER_34_RIGHT_EDGE - w34
    d.text((x34, LOWER_34_Y), text34, font=f34, fill=RED)

    # Vertical divider — 1px wide, bone, between labels and "34"
    d.rectangle(
        [LOWER_DIVIDER_X, LOWER_DIVIDER_TOP_Y, LOWER_DIVIDER_X + 1, LOWER_DIVIDER_BOTTOM_Y],
        fill=BONE,
    )

    # Three-line stacked labels, right-aligned to LOWER_LABELS_RIGHT_EDGE
    flabel = ImageFont.truetype(FONT_INTER_600, 14)
    lines = [('YEARS OF', BONE), ('CALVARY', BONE), ('EST. 1992', DIM)]
    line_height = 22
    for i, (text, fill) in enumerate(lines):
        y = LOWER_LABELS_TOP_Y + i * line_height
        w = measure_tracked(d, text, flabel, 0.18)
        tracked_text(d, (LOWER_LABELS_RIGHT_EDGE - w, y), text, flabel, fill, 0.18)


def name_super(name, role, eyebrow='CALVARY HEPHZIBAH'):
    """
    Lower-third name super.

        ─── red line ───
        CALVARY HEPHZIBAH    (red eyebrow)
        Pastor Gbenga Adebanjo   (Anton title-case)              YEARS OF
        PREACHING                (Inter dim small)               CALVARY      34
                                                                 EST. 1992
    """
    img = new_canvas()
    draw_lower_strip(img)
    d = ImageDraw.Draw(img)

    # Eyebrow (red, tracked)
    feyebrow = ImageFont.truetype(FONT_INTER_600, LOWER_EYEBROW_SIZE)
    tracked_text(d, (LOWER_LEFT_MARGIN, LOWER_EYEBROW_Y),
                 eyebrow.upper(), feyebrow, RED, LOWER_EYEBROW_TRACKING)

    # Headline (Anton, title-case as given, bone)
    fheadline = ImageFont.truetype(FONT_HEADLINE, LOWER_HEADLINE_SIZE)
    d.text((LOWER_LEFT_MARGIN, LOWER_HEADLINE_Y), name, font=fheadline, fill=BONE)

    # Role line (dim, tracked uppercase)
    if role:
        frole = ImageFont.truetype(FONT_INTER_600, LOWER_ROLE_SIZE)
        tracked_text(d, (LOWER_LEFT_MARGIN, LOWER_ROLE_Y),
                     role.upper(), frole, DIM, LOWER_ROLE_TRACKING)

    # Right brand mark
    draw_lower_brand_mark(img)

    return img


def scripture_super(reference, version='', eyebrow='SCRIPTURE'):
    """
    Lower-third scripture super.

        ─── red line ───
        SCRIPTURE              (red eyebrow)
        1 Samuel 7:12          (Anton title-case)
        NIV                    (Inter dim small)
    """
    return name_super(name=reference, role=version, eyebrow=eyebrow)
    """
    Upper-third section marker.

        NOW
        WELCOME ADDRESS        & SUBTITLE              CALVARY | 34
                                                       EST 1992 |
        ─── red line ───
    """
    img = new_canvas()
    draw_section_strip(img)
    d = ImageDraw.Draw(img)

    # Eyebrow (tracked uppercase, red)
    feyebrow = ImageFont.truetype(FONT_INTER_600, SEC_EYEBROW_SIZE)
    tracked_text(d, (SEC_LEFT_MARGIN, SEC_EYEBROW_Y),
                 eyebrow.upper(), feyebrow, RED, SEC_EYEBROW_TRACKING)

    # Headline (Anton, uppercase, bone)
    fheadline = ImageFont.truetype(FONT_HEADLINE, SEC_HEADLINE_SIZE)
    headline_text = label.upper()
    d.text((SEC_LEFT_MARGIN, SEC_HEADLINE_Y), headline_text, font=fheadline, fill=BONE)
    headline_w = d.textlength(headline_text, font=fheadline)

    # Optional subtitle (Inter, dim, baseline-aligned to headline)
    if subtitle:
        fsub = ImageFont.truetype(FONT_INTER_600, SEC_SUB_SIZE)
        # Place subtitle's baseline near the headline's baseline
        # Headline cap height ~53px starting at y=84, so baseline ≈ y=137
        # Subtitle should sit so its bottom is around y=122 (measured from
        # appreciation reference)
        sub_y = SEC_HEADLINE_Y + 26  # empirical offset matching reference
        tracked_text(d, (SEC_LEFT_MARGIN + headline_w + SEC_SUB_GAP, sub_y),
                     subtitle.upper(), fsub, DIM, SEC_SUB_TRACKING)

    # Right brand mark
    draw_section_brand_mark(img)

    return img


# ──────────────────────────────────────────────────────────────────────────
# DEMO RENDER
# ──────────────────────────────────────────────────────────────────────────

if __name__ == '__main__':
    out = Path(__file__).parent / 'render-test'
    out.mkdir(exist_ok=True)

    # Section markers
    section_marker('Welcome Address').save(out / 'test-welcome-address.png')
    section_marker('Grace', subtitle='& Blessing of the Meal').save(out / 'test-grace.png')
    section_marker('Appreciation', subtitle='& Honour').save(out / 'test-appreciation.png')

    # Name super (test against Pastor Gbenga reference)
    name_super('Pastor Gbenga Adebanjo', 'Preaching').save(out / 'test-name-gbenga.png')

    # Scripture super (the actual deliverable for Sunday)
    scripture_super('1 Samuel 7:12', version='KJV').save(out / 'test-scripture-1sam-7-12.png')
    scripture_super('Haggai 2:9', version='KJV').save(out / 'test-scripture-haggai-2-9.png')

    print('Rendered:')
    for p in sorted(out.iterdir()):
        print(f'  {p.relative_to(out.parent)}')
