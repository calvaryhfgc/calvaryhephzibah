-- ============================================================
-- 11_anniversary_overlays.sql
-- ============================================================
-- Adds the 'anniversary' category to control_room_images and seeds
-- the 40 broadcast overlay PNGs from /anniversary/overlays/ as
-- entries in the image library.
--
-- The PNGs themselves live on GitHub Pages (calvaryhfgc.github.io/
-- calvaryhephzibah/anniversary/overlays/). data_url points to the
-- public URL of each PNG — works because the overlay renderer just
-- stuffs the value into <img src> without caring whether it's a
-- data: URL or an https: URL.
--
-- Idempotent — safe to run multiple times.
-- ============================================================

-- 1. Allow 'anniversary' as a valid category
do $$ begin
  -- Drop the old constraint if it exists
  if exists (select 1 from pg_constraint where conname = 'valid_image_category') then
    alter table control_room_images drop constraint valid_image_category;
  end if;
  -- Add the new constraint with 'anniversary' included
  alter table control_room_images
    add constraint valid_image_category
    check (category in ('offering','communion','sermon','announcement','general','anniversary'));
end $$;

-- 2. Seed the 40 anniversary overlay PNGs
-- Using ON CONFLICT on name so re-running this script doesn't duplicate.
-- (Name is unique per category in practice — adding a unique partial index to enforce it.)
create unique index if not exists idx_images_anniversary_name
  on control_room_images(name)
  where category = 'anniversary';

insert into control_room_images (name, category, data_url, media_type) values
  -- Name supers (lower-third person identifiers)
  ('01-name-pastor-shade',                  'anniversary', 'https://calvaryhfgc.github.io/calvaryhephzibah/anniversary/overlays/01-name-pastor-shade.png',                  'image'),
  ('02-name-michael-kabalu',                'anniversary', 'https://calvaryhfgc.github.io/calvaryhephzibah/anniversary/overlays/02-name-michael-kabalu.png',                'image'),
  ('03-name-pastor-kayode',                 'anniversary', 'https://calvaryhfgc.github.io/calvaryhephzibah/anniversary/overlays/03-name-pastor-kayode.png',                 'image'),
  ('04-name-pastor-gbenga',                 'anniversary', 'https://calvaryhfgc.github.io/calvaryhephzibah/anniversary/overlays/04-name-pastor-gbenga.png',                 'image'),
  ('17-name-visiting-minister-communion',   'anniversary', 'https://calvaryhfgc.github.io/calvaryhephzibah/anniversary/overlays/17-name-visiting-minister-communion.png',   'image'),
  ('18-name-bola-paul',                     'anniversary', 'https://calvaryhfgc.github.io/calvaryhephzibah/anniversary/overlays/18-name-bola-paul.png',                     'image'),
  ('19-name-rev-olowodola',                 'anniversary', 'https://calvaryhfgc.github.io/calvaryhephzibah/anniversary/overlays/19-name-rev-olowodola.png',                 'image'),

  -- Section markers (upper-third programme phase markers)
  ('05-section-welcome',                    'anniversary', 'https://calvaryhfgc.github.io/calvaryhephzibah/anniversary/overlays/05-section-welcome.png',                    'image'),
  ('06-section-worship',                    'anniversary', 'https://calvaryhfgc.github.io/calvaryhephzibah/anniversary/overlays/06-section-worship.png',                    'image'),
  ('07-section-communion',                  'anniversary', 'https://calvaryhfgc.github.io/calvaryhephzibah/anniversary/overlays/07-section-communion.png',                  'image'),
  ('08-section-testimony',                  'anniversary', 'https://calvaryhfgc.github.io/calvaryhephzibah/anniversary/overlays/08-section-testimony.png',                  'image'),
  ('09-section-offering',                   'anniversary', 'https://calvaryhfgc.github.io/calvaryhephzibah/anniversary/overlays/09-section-offering.png',                   'image'),
  ('10-section-word',                       'anniversary', 'https://calvaryhfgc.github.io/calvaryhephzibah/anniversary/overlays/10-section-word.png',                       'image'),
  ('20-section-welcome-address',            'anniversary', 'https://calvaryhfgc.github.io/calvaryhephzibah/anniversary/overlays/20-section-welcome-address.png',            'image'),
  ('21-section-presentation',               'anniversary', 'https://calvaryhfgc.github.io/calvaryhephzibah/anniversary/overlays/21-section-presentation.png',               'image'),
  ('22-section-announcements',              'anniversary', 'https://calvaryhfgc.github.io/calvaryhephzibah/anniversary/overlays/22-section-announcements.png',              'image'),
  ('23-section-appreciation',               'anniversary', 'https://calvaryhfgc.github.io/calvaryhephzibah/anniversary/overlays/23-section-appreciation.png',               'image'),
  ('24-section-prayer-ministry',            'anniversary', 'https://calvaryhfgc.github.io/calvaryhephzibah/anniversary/overlays/24-section-prayer-ministry.png',            'image'),
  ('25-section-grace',                      'anniversary', 'https://calvaryhfgc.github.io/calvaryhephzibah/anniversary/overlays/25-section-grace.png',                      'image'),
  ('26-section-meal',                       'anniversary', 'https://calvaryhfgc.github.io/calvaryhephzibah/anniversary/overlays/26-section-meal.png',                       'image'),
  ('27-section-closing-prayer',             'anniversary', 'https://calvaryhfgc.github.io/calvaryhephzibah/anniversary/overlays/27-section-closing-prayer.png',             'image'),

  -- Scripture supers (legacy + new for 17 May sermon)
  ('11-scripture-jehoshaphat',              'anniversary', 'https://calvaryhfgc.github.io/calvaryhephzibah/anniversary/overlays/11-scripture-jehoshaphat.png',              'image'),
  ('12-scripture-psalm-33',                 'anniversary', 'https://calvaryhfgc.github.io/calvaryhephzibah/anniversary/overlays/12-scripture-psalm-33.png',                 'image'),
  ('30-scripture-1-samuel-7-12',            'anniversary', 'https://calvaryhfgc.github.io/calvaryhephzibah/anniversary/overlays/30-scripture-1-samuel-7-12.png',            'image'),
  ('31-scripture-zechariah-4-10',           'anniversary', 'https://calvaryhfgc.github.io/calvaryhephzibah/anniversary/overlays/31-scripture-zechariah-4-10.png',           'image'),
  ('32-scripture-psalm-124-1',              'anniversary', 'https://calvaryhfgc.github.io/calvaryhephzibah/anniversary/overlays/32-scripture-psalm-124-1.png',              'image'),
  ('33-scripture-luke-15-7',                'anniversary', 'https://calvaryhfgc.github.io/calvaryhephzibah/anniversary/overlays/33-scripture-luke-15-7.png',                'image'),
  ('34-scripture-galatians-6-9',            'anniversary', 'https://calvaryhfgc.github.io/calvaryhephzibah/anniversary/overlays/34-scripture-galatians-6-9.png',            'image'),
  ('35-scripture-psalm-121-7',              'anniversary', 'https://calvaryhfgc.github.io/calvaryhephzibah/anniversary/overlays/35-scripture-psalm-121-7.png',              'image'),
  ('36-scripture-lamentations-3-22',        'anniversary', 'https://calvaryhfgc.github.io/calvaryhephzibah/anniversary/overlays/36-scripture-lamentations-3-22.png',        'image'),
  ('37-scripture-philippians-1-6',          'anniversary', 'https://calvaryhfgc.github.io/calvaryhephzibah/anniversary/overlays/37-scripture-philippians-1-6.png',          'image'),
  ('38-scripture-haggai-2-9',               'anniversary', 'https://calvaryhfgc.github.io/calvaryhephzibah/anniversary/overlays/38-scripture-haggai-2-9.png',               'image'),
  ('39-scripture-isaiah-6-8',               'anniversary', 'https://calvaryhfgc.github.io/calvaryhephzibah/anniversary/overlays/39-scripture-isaiah-6-8.png',               'image'),

  -- Song supers
  ('13-song-trading-my-sorrows',            'anniversary', 'https://calvaryhfgc.github.io/calvaryhephzibah/anniversary/overlays/13-song-trading-my-sorrows.png',            'image'),
  ('14-song-friend-of-god',                 'anniversary', 'https://calvaryhfgc.github.io/calvaryhephzibah/anniversary/overlays/14-song-friend-of-god.png',                 'image'),

  -- Specials (hero banner, birthday card, video greeting marker, testimony super)
  ('15-anniversary-banner',                 'anniversary', 'https://calvaryhfgc.github.io/calvaryhephzibah/anniversary/overlays/15-anniversary-banner.png',                 'image'),
  ('16-testimony-pauline',                  'anniversary', 'https://calvaryhfgc.github.io/calvaryhephzibah/anniversary/overlays/16-testimony-pauline.png',                  'image'),
  ('28-birthday-dr-t',                      'anniversary', 'https://calvaryhfgc.github.io/calvaryhephzibah/anniversary/overlays/28-birthday-dr-t.png',                      'image'),
  ('29-video-greeting-olowodola',           'anniversary', 'https://calvaryhfgc.github.io/calvaryhephzibah/anniversary/overlays/29-video-greeting-olowodola.png',           'image')
on conflict (name) where category = 'anniversary' do update
  set data_url = excluded.data_url,
      media_type = excluded.media_type;

notify pgrst, 'reload schema';

-- Verify
select category, count(*) as total
from control_room_images
group by category
order by category;
