# Calvary Control Room

Real-time OBS overlay + operator app for Sunday services.

**Overlay URL (for OBS Browser Source):**
```
https://calvaryhfgc.github.io/calvaryhephzibah/control-room/overlay.html?hud=off
```

**Operator app:**
```
https://calvaryhfgc.github.io/calvaryhephzibah/control-room/
```

---

## How it works

1. Operator opens the app on a phone or laptop and signs in with a PIN.
2. The app shows today's set list (pre-loaded earlier in the week) plus a scripture search panel.
3. Tapping **Next**, **Previous**, or any slide updates a single row in Supabase.
4. The overlay page (loaded inside OBS as a Browser Source) is subscribed to that row and re-renders instantly.

There is no software to install on the media desk beyond OBS itself. Anyone with a PIN can run the overlay from anywhere with internet.

---

## First-time setup (one-off)

### 1. Supabase — run the schema

1. Open the Supabase dashboard for project `pfycvgbrsbecznkcikwt` (login `calvaryhfgc@gmail.com`).
2. Go to **SQL Editor → New query**.
3. Paste the contents of `schema/01_init.sql` and run it.
4. Verify the tables exist: `control_room_live`, `control_room_plans`, `control_room_plan_items`, `control_room_bible`, `control_room_users`.

### 2. Enable realtime on `control_room_live`

Supabase dashboard → **Database → Replication** → toggle on for `control_room_live`.

### 3. Paste the anon key into both HTML files

The overlay and the operator app both need the Supabase anon key. Find it in **Project Settings → API → Project API keys → `anon` `public`**.

In `overlay.html` and `index.html`, find:
```
const SUPABASE_ANON_KEY = 'REPLACE_WITH_ANON_KEY';
```
and paste the key. Commit and push.

### 4. Load the Bible

The Bible lives in `control_room_bible` so operators can push any verse without downloading slides. For v1, use the public-domain KJV — we seed it with `schema/seed_bible_kjv.sql` (to be generated; the file is large so it's a one-time import via the Supabase CSV uploader).

**Quickest path:**
1. Download the KJV JSON from <https://github.com/thiagobodruk/bible/blob/master/json/en_kjv.json> (public domain).
2. Convert to CSV: `version, book, book_num, chapter, verse, text`.
3. Upload via Supabase Table Editor → `control_room_bible` → Import.

(Or ask Claude to generate the CSV from the JSON next session — it takes about 30 seconds.)

### 5. Update PINs

The schema seeds two users:
- **Bolaji Olatoye** (admin) — PIN `2610`
- **Scott Shokoya** (operator) — PIN `1234` (placeholder, ask him to change)

To change a PIN, generate the hash with this function in the browser console:
```js
function hashPin(p) {
  let h = 5381;
  for (let i = 0; i < p.length; i++) h = ((h << 5) + h) ^ p.charCodeAt(i);
  return 'bp_' + (h >>> 0).toString(36);
}
hashPin('9999');  // → "bp_xxxxxx"
```
Then update the row in `control_room_users`.

---

## Loading a set list for Sunday

V1 does this via SQL. A proper admin UI comes in v2.

```sql
-- 1. Create the plan for a date
insert into control_room_plans (service_date, notes)
values ('2026-04-19', 'Easter Sunday')
returning id;
-- Copy the returned id into the inserts below as :plan_id

-- 2. Add songs in order. Slides are pre-split into pairs.
insert into control_room_plan_items (plan_id, position, kind, title, section, slides) values
(:plan_id, 1, 'song', 'Lord You Are Good', 'praise',
  '[
    {"line1":"Lord you are good", "line2":"and your mercy endureth forever"},
    {"line1":"Lord you are good", "line2":"and your mercy endureth forever"},
    {"line1":"People from every nation and tongue", "line2":"from generation to generation"}
  ]'::jsonb),
(:plan_id, 2, 'song', 'My Jesus (Shout to the Lord)', 'worship',
  '[
    {"line1":"My Jesus, my Saviour", "line2":"Lord there is none like you"},
    {"line1":"All of my days", "line2":"I want to praise"}
  ]'::jsonb);
```

The operator app auto-loads whichever plan matches today's date.

---

## Setting up OBS

1. In OBS, add a **Browser Source** to your scene.
2. URL: `https://calvaryhfgc.github.io/calvaryhephzibah/control-room/overlay.html?hud=off`
3. Width: `1920`, Height: `1080` (or your stream resolution).
4. Tick **Shutdown source when not visible** → OFF.
5. Tick **Refresh browser when scene becomes active** → ON.

The overlay is transparent, so it sits cleanly on top of your camera feed.

**For testing without OBS:** open the overlay URL in a browser tab. Then push from the operator app and watch it update in real time.

---

## The `?hud=off` query string

By default, the overlay shows a small status pill in the top-right corner — useful when testing to see if it's connected. For live streams, add `?hud=off` to hide it.

---

## Troubleshooting

- **Overlay doesn't update when I push**: Check that realtime is enabled on `control_room_live` in the Supabase dashboard.
- **"Wrong PIN"**: Check the hash in `control_room_users` matches what `hashPin()` outputs in the browser console.
- **Verse search returns nothing**: Confirm the Bible has been imported — `select count(*) from control_room_bible;` should return ~31,000 rows for the KJV.
- **Overlay looks tiny in OBS**: Set the Browser Source width/height to match your stream resolution (usually 1920×1080).

---

## What's coming next

- **v1.1**: Admin UI for loading set lists (no more SQL)
- **v1.2**: Multiple Bible versions (NIV, NLT)
- **v1.3**: Graphics mode (announcement slides, logos, lower thirds)
- **v1.4**: Pre-service holding screen with countdown
- **v2.0**: Fold into Calvary OS as a module

---

*Built by Bolaji Olatoye · Calvary Hephzibah Full Gospel Church*
