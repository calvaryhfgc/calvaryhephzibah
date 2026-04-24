-- Migration: Phrase Editor — phrases with multi-voice tracks and notes
-- Date: 2026-04-24
-- Scope: Phase 1 of phrase editor feature
--
-- A "phrase" is a short musical segment — a verse entry, a melodic lick, a
-- transition — with a name, key, tempo, time signature, and 1-4 tracks
-- (melody, bass, counter, click). Each track contains ordered notes with
-- pitch, grid-aligned start position, duration, and optional lyric text.
--
-- Phrases can be standalone or attached to a song and/or arrangement.
-- Both song_id and arrangement_id are nullable and independent —
-- a phrase may be attached to a song without being attached to an arrangement.
--
-- Deletion semantics:
--   - Deleting a song or arrangement does not delete its phrases; the FK
--     is set to null so phrases become standalone. This preserves work that
--     may be referenced elsewhere (e.g. embedded in a rehearsal review).
--   - Deleting a phrase cascades to tracks and notes.
--   - Deleting a track cascades to its notes.

-- ── rs_phrases ────────────────────────────────────────────────────────────
create table if not exists public.rs_phrases (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  song_id         uuid references public.rs_songs(id) on delete set null,
  arrangement_id  uuid references public.rs_arrangements(id) on delete set null,
  key             text not null default 'C',
  tempo           integer not null default 120,
  time_signature  text not null default '4/4',
  grid_resolution integer not null default 16,
  description     text,
  created_by      text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

comment on table public.rs_phrases is
  'Short named musical phrase (verse entry, lick, transition) with multi-voice tracks. May be standalone or attached to a song/arrangement.';
comment on column public.rs_phrases.key is
  'Tonic and mode expressed as a short string, e.g. "C", "Bb", "F#m". Interpreted client-side for playback transposition.';
comment on column public.rs_phrases.grid_resolution is
  'Subdivisions per quarter-note: 4 = sixteenths, 8 = 32nds, etc. Default 16 gives sixteenth-note precision across a 4/4 bar.';
comment on column public.rs_phrases.description is
  'Free-text teaching notes shown alongside playback (what to listen for, who it is for).';

-- ── rs_phrase_tracks ──────────────────────────────────────────────────────
create table if not exists public.rs_phrase_tracks (
  id          uuid primary key default gen_random_uuid(),
  phrase_id   uuid not null references public.rs_phrases(id) on delete cascade,
  kind        text not null check (kind in ('melody','bass','counter','click')),
  position    integer not null default 0,
  instrument  text not null default 'synth_lead',
  volume_db   numeric not null default -6,
  muted       boolean not null default false,
  created_at  timestamptz not null default now()
);

create index if not exists rs_phrase_tracks_phrase_id_idx
  on public.rs_phrase_tracks (phrase_id, position);

comment on column public.rs_phrase_tracks.kind is
  'Role of this track within the phrase. Multiple tracks of the same kind are allowed (e.g. two melody lines in harmony) but usually there is one each of melody, bass, counter, click.';
comment on column public.rs_phrase_tracks.instrument is
  'Playback voice. Client-side Tone.js instrument identifier, e.g. "synth_lead", "synth_bass", "piano", "click". Not validated server-side to avoid churn when new voices are added.';

-- ── rs_phrase_notes ──────────────────────────────────────────────────────
create table if not exists public.rs_phrase_notes (
  id              uuid primary key default gen_random_uuid(),
  track_id        uuid not null references public.rs_phrase_tracks(id) on delete cascade,
  step            integer not null default 0,
  pitch           text,
  start_position  integer not null,
  duration        integer not null,
  lyric           text,
  velocity        numeric not null default 1.0
);

create index if not exists rs_phrase_notes_track_id_idx
  on public.rs_phrase_notes (track_id, start_position);

comment on column public.rs_phrase_notes.step is
  'Stable ordering within the track, separate from start_position. Allows reordering the note list in the editor without shifting musical timing. Also used for UI pill identity in playback.';
comment on column public.rs_phrase_notes.pitch is
  'Scientific pitch notation, e.g. "C4", "F#3", "Bb5". Null for click-track or silent placeholder notes.';
comment on column public.rs_phrase_notes.start_position is
  'Grid units from phrase start. In a default grid_resolution=16 phrase, 0 = phrase start, 4 = beat 2, 16 = bar 2 beat 1.';
comment on column public.rs_phrase_notes.duration is
  'Grid units. A dotted eighth at grid_resolution=16 = 3 units. A held half note = 32 units.';
comment on column public.rs_phrase_notes.lyric is
  'Optional syllable or word text shown in the playback view under the note (e.g. "I''m", "tra", "sor").';

-- ── RLS ───────────────────────────────────────────────────────────────────
-- Consistent with the rest of Calvary OS: permissive at the DB level,
-- enforced client-side via PIN auth and user level (admin/lead/team).
alter table public.rs_phrases       enable row level security;
alter table public.rs_phrase_tracks enable row level security;
alter table public.rs_phrase_notes  enable row level security;

drop policy if exists rs_phrases_all       on public.rs_phrases;
drop policy if exists rs_phrase_tracks_all on public.rs_phrase_tracks;
drop policy if exists rs_phrase_notes_all  on public.rs_phrase_notes;

create policy rs_phrases_all       on public.rs_phrases       for all using (true) with check (true);
create policy rs_phrase_tracks_all on public.rs_phrase_tracks for all using (true) with check (true);
create policy rs_phrase_notes_all  on public.rs_phrase_notes  for all using (true) with check (true);

-- ── updated_at trigger on rs_phrases ──────────────────────────────────────
-- Matches pattern used elsewhere in the schema.
create or replace function public.rs_phrases_touch_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists rs_phrases_touch_updated_at_trigger on public.rs_phrases;
create trigger rs_phrases_touch_updated_at_trigger
  before update on public.rs_phrases
  for each row execute function public.rs_phrases_touch_updated_at();
