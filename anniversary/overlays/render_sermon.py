"""Render the 10 scripture supers for Pastor Gbenga's Ebenezer sermon."""
from pathlib import Path
import sys
sys.path.insert(0, str(Path(__file__).parent))
from generator import scripture_super

OUT = Path(__file__).parent / 'sermon-supers'
OUT.mkdir(exist_ok=True)

# All 10 scripture references for the Ebenezer sermon, with chosen translations
# (KJV for OT poetry/prophecy where the language has weight; NIV for clarity)
SCRIPTURES = [
    ('30-scripture-1-samuel-7-12',     '1 Samuel 7:12',       'KJV'),
    ('31-scripture-zechariah-4-10',    'Zechariah 4:10',      'NIV'),
    ('32-scripture-psalm-124-1',       'Psalm 124:1',         'KJV'),
    ('33-scripture-luke-15-7',         'Luke 15:7',           'NIV'),
    ('34-scripture-galatians-6-9',     'Galatians 6:9',       'NIV'),
    ('35-scripture-psalm-121-7',       'Psalm 121:7',         'KJV'),
    ('36-scripture-lamentations-3-22', 'Lamentations 3:22-23', 'KJV'),
    ('37-scripture-philippians-1-6',   'Philippians 1:6',     'NIV'),
    ('38-scripture-haggai-2-9',        'Haggai 2:9',          'KJV'),
    ('39-scripture-isaiah-6-8',        'Isaiah 6:8',          'KJV'),
]

for slug, ref, version in SCRIPTURES:
    img = scripture_super(reference=ref, version=version)
    img.save(OUT / f'{slug}.png')
    print(f'wrote {slug}.png ({ref}, {version})')

print(f'\n{len(SCRIPTURES)} scripture supers written to {OUT}')
