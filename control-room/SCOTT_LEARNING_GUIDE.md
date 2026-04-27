# Building Calvary Control Room — A Learning Guide

**For:** Scott Shokoya
**From:** Bolaji
**Goal:** Build your own working copy of Calvary Control Room from scratch, in your own GitHub and Supabase, using Claude as your pair programmer.

---

## Why this exists

You've been operating Control Room for a few weeks now. You know what it does. This guide is about teaching you how it was built — by rebuilding it yourself, with Claude doing the typing and you doing the thinking.

The point is not to memorise code. The point is to learn how to **work with an AI to build software you couldn't build alone** — which is the actual skill that matters in 2026.

By the end of this you'll have:

- A live, working clone of Control Room running on your own infrastructure
- A real understanding of how the pieces fit together
- The skill to extend it, fix it, and build other tools the same way

You won't be touching the church's live Control Room at all. Yours runs in parallel. If you break it, only you see. If you build something useful, we can talk about merging your ideas back into the main one.

---

## The mindset that matters more than anything

Before you touch a single thing, internalise this:

> **You are not a coder. You are a director. Claude is your pair of hands.**

Your job is to:
1. Know what you want to build, in plain English
2. Describe it clearly
3. Read what Claude produces critically
4. Test it
5. Tell Claude what's wrong, or what to do next

Claude's job is to:
1. Translate your intent into code
2. Explain trade-offs
3. Push back when your idea has a problem
4. Do the typing

If you ever find yourself trying to write code character-by-character in Claude's chat, you're doing it wrong. **Describe outcomes, not keystrokes.** Bad: "add a div with class container that has padding 20px." Good: "the login screen feels cramped — give it more breathing room."

### Three rules that will save you weeks of pain

**1. Always read what Claude produces before accepting it.**
Don't just paste. Skim it. Does it make sense? If it doesn't, ask Claude to explain. If it still doesn't, that's a sign the approach is wrong — either Claude is confused or you didn't describe the goal well.

**2. Test every change in isolation.**
Make one change, test it, confirm it works, commit. Repeat. If you make five changes and *something* breaks, you have no idea which one. The rhythm is: small change → test → commit → small change → test → commit.

**3. When something breaks, share what you actually see.**
Don't say "it's broken." Say "I clicked X, expected Y, but got Z. Here's the error from the console." Specificity is the whole game. Most of debugging with AI is learning to describe symptoms precisely.

---

## What you're going to build

You're cloning Control Room. By the end you'll have:

- A login screen with a PIN
- A live state in a database that all clients sync to in realtime
- An operator app that lets you push lyrics, scripture verses, lower thirds, images, videos, and announcements
- A separate overlay HTML page that displays whatever's been pushed (this is what OBS uses)
- An admin page for managing songs, set lists, images, people, and announcements
- A media library with image and video upload to cloud storage
- A live preview panel inside the operator so you can see the overlay without alt-tabbing to OBS

You'll build it in **7 phases**. Each phase ends with something working. Don't skip ahead.

---

## Setup: get your infrastructure ready

Before you write a single line of code, set up four accounts. None of this involves Claude.

### 1. GitHub account

You probably already have one. If not: github.com → sign up.

Then:
- Create a new public repo. Name it something like `scott-control-room`.
- Inside the repo, go to **Settings → Pages → Build from a branch → main → /(root)**. Click Save.
- After a minute, your repo will have a live URL: `https://YOUR_USERNAME.github.io/scott-control-room/`. That's where everything you commit will appear.
- Generate a personal access token: **Settings → Developer settings → Personal access tokens → Tokens (classic) → Generate new token**. Give it `repo` scope. Copy the token somewhere safe — you'll never see it again.

### 2. Supabase account

Supabase.com → sign up (free tier is fine for this). Then:
- Create a new project. Name it whatever. Pick a region close to you (London or Frankfurt).
- Wait for it to provision (~2 minutes).
- Once ready, go to **Project Settings → API**. Copy two things:
  - The **Project URL** (looks like `https://abcdefgh.supabase.co`)
  - The **anon public key** (a long string starting `eyJ...`)
- Save these somewhere. They go into your code.

### 3. Anthropic Claude account

claude.ai → sign up. The free tier is OK to start; if you do this seriously you'll want a Pro subscription pretty quickly because you'll hit message limits during longer sessions.

### 4. A code editor (optional but recommended)

You don't *need* one — Claude can edit files directly via the file tool inside chat. But for sanity, install **VS Code** (free, code.visualstudio.com). It lets you see all the files you're building at once, search across them, and run things locally.

---

## How to actually work with Claude

Now, the meta-skill. Read this section twice.

### The shape of a good session

A productive Claude session looks like:

1. **You describe what you want to build, in plain English.** "I want a login screen that asks for a PIN. If the PIN is right, they get into the app. If wrong, show an error."

2. **Claude proposes an approach.** Often it'll ask clarifying questions first ("Should the PIN be hardcoded or stored somewhere?"). Answer them.

3. **Claude writes code.** It'll create files or edit files. Look at what it did. Don't just say "thanks."

4. **You test it.** Did it actually work? Open the page, try the PIN, see what happens.

5. **You report back.** "It works" or "It doesn't work because X." Specificity matters.

6. **You commit and move on.** Once a piece works, save it (git commit + push) before starting the next thing.

### Prompts that work vs prompts that don't

**Bad:** "make me a control room"
*Why bad: too vague. Claude will guess at what you mean and you'll get something nothing like what you want.*

**Better:** "I want to build a system where I can type lyrics into one web page and have them appear instantly on another web page that OBS will use as an overlay. Both pages talk to a Supabase database. The page that types is the operator app; the page that displays is the overlay. Can you help me plan this?"
*Why better: states the goal, the architecture, the parties. Claude can engage meaningfully.*

**Bad:** "fix the bug"
*Why bad: which bug?*

**Better:** "The lyrics aren't showing on the overlay. I pushed a song from the operator, the database shows the new state in the `live` table, but the overlay screen is still blank. Browser console on the overlay shows no errors. What should I check?"
*Why better: tells Claude what works, what doesn't, what you've already verified, and where to look.*

### What to do when stuck

You **will** get stuck. Often. Here's the unsticking pattern:

1. **Tell Claude exactly what you observed.** Not "it's broken." Describe the steps you took, what you expected, what actually happened. Copy-paste any error messages.

2. **If Claude's first suggestion doesn't work, share what happened when you tried it.** Don't just say "still broken." Say "I did X and now Y is happening instead."

3. **If you've gone three rounds without progress, step back.** Ask Claude to explain how the system is *supposed* to work for the thing you're trying to do. Often the bug is that your mental model is wrong, not that the code is wrong.

4. **Use the browser console liberally.** F12 (Cmd+Option+I on Mac) → Console tab. You can paste JavaScript directly into it to inspect anything. Claude will give you snippets to run when investigating bugs. Don't be scared of it.

5. **Last resort: revert to last working state.** `git log` shows your commits. `git checkout <commit>` brings back an old version. If you're hopelessly tangled, getting back to "yesterday's working version" is always available.

### A note on Claude's mistakes

Claude makes mistakes. You'll sometimes see code that doesn't work, references variables that don't exist, hallucinates API methods that aren't real. This is normal. The mitigation is: **read the code before accepting it, and test small.** When Claude is wrong, point it out clearly: "this references `loadSpeakers` but you never defined it." Claude will correct itself.

---

## The 7 phases

This is your map. Don't skip phases. Each builds on the last.

---

### Phase 1: Hello world login

**Goal:** A single web page that asks for a PIN. If correct, shows "Welcome." If wrong, shows an error. Hosted on GitHub Pages.

**What you'll learn:**
- Setting up a GitHub repo and serving static HTML via Pages
- Basic HTML/CSS structure
- How Claude edits files and pushes commits
- The cycle of edit → test → commit

**Suggested first prompt to Claude:**

> I'm building my own version of Calvary Control Room as a learning project. I have a GitHub repo at `https://github.com/MY_USERNAME/scott-control-room` and a personal access token. GitHub Pages is enabled.
>
> For Phase 1, I want a single HTML file (`index.html`) that shows a PIN entry screen. The user types a 4-digit PIN. If the PIN is `1234`, the screen changes to show "Welcome." If wrong, show "Wrong PIN, try again."
>
> Use a dark theme with red accents — Calvary's brand colour is `#C41E2A`. The font should be clean and modern (Inter from Google Fonts is fine).
>
> Help me set this up step by step. Let's start by getting `index.html` committed and pushed to my repo so I can see it live on GitHub Pages.

**You'll know it works when:**
- You visit `https://YOUR_USERNAME.github.io/scott-control-room/` and see a PIN entry box
- Typing 1234 advances to a "Welcome" message
- Typing anything else shows an error

**Pitfalls:**
- GitHub Pages takes 30-60 seconds to update after each push. If you don't see your changes immediately, wait, then hard-refresh (Cmd+Shift+R or Ctrl+Shift+R).
- Make sure you saved your GitHub token securely. You'll use it for every commit.

**Commit when done.** Title the commit "Phase 1: PIN gate."

---

### Phase 2: Connect to a Supabase database

**Goal:** Add a Supabase table called `live_state` that holds a single row representing what's currently being displayed. The login page can read it.

**What you'll learn:**
- Connecting a static web page to a hosted database
- Supabase's anon key model
- Why we use a "single row, fixed ID" pattern for shared state
- Reading data with JavaScript and showing it on a page

**Suggested prompt:**

> Phase 2. I want to add Supabase. Here are my Supabase credentials:
>
> - Project URL: `https://YOUR_PROJECT.supabase.co`
> - Anon key: `eyJ...` (your actual key)
>
> Help me:
> 1. Create a table called `live_state` with columns: `id` (integer primary key), `mode` (text, default 'blank'), `payload` (jsonb, default empty), `updated_at` (timestamp). Insert one row with `id = 1`.
> 2. Disable RLS on it and grant access to the anon role so the web page can read and write it.
> 3. After login (PIN 1234), the page should fetch the current `live_state` row and display the `mode` field.
>
> Show me the SQL I need to run in Supabase, and the JavaScript additions to my `index.html`.

**You'll know it works when:**
- After logging in, the page shows "Current mode: blank"
- If you change the row in Supabase manually (Table Editor → edit `mode` to "test"), the page shows "test" after refresh

**Pitfalls (these will bite you):**
- **RLS gotcha.** Supabase enables Row Level Security by default. If you forget to disable it (or set proper policies), every query returns zero rows even though the data exists. Symptom: page shows nothing, no error. Fix: `alter table live_state disable row level security;` and `grant select, insert, update, delete on live_state to anon;`. Then `notify pgrst, 'reload schema';` to flush the cache.
- **Anon key is in plain text in your HTML.** That's fine for this use case (anyone who has the URL can use the app), but never put a `service_role` key in client code — that key bypasses all security.

**Commit when done.** "Phase 2: Live state table connected."

---

### Phase 3: Push from operator, see on overlay

**Goal:** Two separate HTML pages. One (`index.html`) lets you type a song line and click Push. The other (`overlay.html`) displays whatever was last pushed. Pushes appear on the overlay in real time without refresh.

**What you'll learn:**
- The operator/overlay split (this is the core architecture)
- Supabase Realtime subscriptions
- Why the overlay has a transparent background

**Suggested prompt:**

> Phase 3. I want two separate pages:
>
> 1. `index.html` (the operator) — has the PIN gate, then once logged in, shows a text input and a Push button. Typing text and clicking Push should write to the `live_state` table: set `mode = 'lyric'` and `payload = {"line1": "the text the user typed"}`.
>
> 2. `overlay.html` (the display) — no login, no UI chrome, just shows the current `mode`'s payload. If `mode = 'lyric'`, it shows the line1 text in big white letters centred on a transparent background. The page subscribes to realtime updates so when `live_state` changes, the overlay updates instantly without refresh.
>
> Help me build both. Important: realtime needs `replica identity full` set on the table and the table needs to be in the `supabase_realtime` publication.

**You'll know it works when:**
- Open `index.html` in one tab, log in, type a song line, click Push
- Open `overlay.html` in a separate tab — that text appears
- Change the text in the operator and push again — the overlay updates **without you refreshing**

**Pitfalls:**
- **Realtime needs explicit setup.** SQL to run: `alter publication supabase_realtime add table live_state;` and `alter table live_state replica identity full;`. Without `replica identity full`, the realtime broadcast contains row metadata but not the actual data — so the overlay receives an event but with empty payload.
- **Subscription not firing?** In the overlay's browser console, your `.subscribe()` callback should log a status. If you never see `SUBSCRIBED`, realtime isn't enabled correctly. If you see `SUBSCRIBED` but no events come through, check the publication.
- **Transparent background.** OBS uses overlay.html as a "Browser Source" and composites it on top of camera feed. The page's `body` needs `background: transparent` for this to work. Forgetting this means OBS sees a black box covering the camera.

**Commit when done.** "Phase 3: Operator pushes, overlay displays."

This phase is the hardest one. Once you've got realtime working, the rest is variations on the theme.

---

### Phase 4: A proper operator UI with set list

**Goal:** Build the actual operator app — a set list of songs with multiple slides each, click any slide to push it live, Next/Previous buttons walk through slides. Now you have something usable for a real service.

**What you'll learn:**
- Hardcoded data structures vs database-driven (start with hardcoded)
- The "currently live" highlight pattern
- Keyboard shortcuts and operator UX

**Suggested prompt:**

> Phase 4. The operator now needs a real UI for running a service. Hardcode a set list of 3 songs (just put the data in a JavaScript variable for now — we'll move to a database later). Each song has a title and a list of slides. Each slide has line1 and line2 text.
>
> The UI shows the songs in a list. Clicking any song expands its slides. Clicking a slide pushes it to live (sets `mode = 'lyric'`, payload includes line1, line2, and song title). The currently-live slide gets a red highlight.
>
> Add a transport bar at the bottom: Previous, Next, Blank buttons. Next walks through slides; if at the last slide, advances to the next song. Blank pushes `mode = 'blank'` (overlay shows nothing).
>
> Update `overlay.html` to handle `mode = 'blank'` (clear the screen) and to show two lines for lyric mode (line1 and line2 stacked).

**You'll know it works when:**
- You can run a fake service: click song 1 slide 1, then Next, Next, Next walks you through the song
- Blank clears the overlay
- The currently-live slide is visually obvious in the operator

**Pitfalls:**
- **Don't over-engineer.** It's tempting to make this perfect. Resist. Get it working with hardcoded data first; database-driven set lists come in Phase 6.

**Commit when done.** "Phase 4: Operator UI with set list."

---

### Phase 5: Bible verses

**Goal:** A second mode. Operator can search for a Bible reference (`John 3:16`) and push it to the overlay. Single verses for now; multi-verse passages come later.

**What you'll learn:**
- Loading static reference data into a database (bulk seed)
- Multiple display modes on the overlay
- Search-as-you-type vs search-on-enter

**Suggested prompt:**

> Phase 5. Add Bible verses. I want a panel on the operator app where I can type a reference like "John 3:16" and click Find. It should look up the verse and show me a preview. Then a Push button sends it to the overlay (mode = 'verse', payload includes book, chapter, verse, text).
>
> The overlay should render verses differently from lyrics — slightly smaller, italic feel, with the reference shown smaller below the verse text in red.
>
> For the data, use the King James Version. We need to load all 31,102 verses into a `bible` table. Help me find a good source for KJV in JSON format and load it.

**You'll know it works when:**
- Type "John 3:16" → see the verse → push → overlay shows it with reference below
- Switch to a song lyric — overlay correctly switches modes

**Pitfalls:**
- **Loading 31k rows.** SQL `INSERT` statements that big can hit limits if you try to do it in one transaction. Break into chunks of ~3000 rows each.
- **Reference parsing.** "John 3:16" is easy. "1 Cor 13:4-7" is harder (book name with number, range of verses). Start with the simple case.

**Commit when done.** "Phase 5: Bible verses."

---

### Phase 6: Move set list to the database + add an admin page

**Goal:** Stop hardcoding the set list. Build an admin page where you can manage songs and assemble a set list for a specific date. The operator app loads the set list from the database.

**What you'll learn:**
- Two-page apps (admin + operator)
- Foreign keys and relations (a set list contains songs)
- Why putting data in the database immediately changes how you think about your app

**Suggested prompt:**

> Phase 6. Time to move the hardcoded set list into the database, and add an admin page for managing it.
>
> Schema:
> - `songs` table: id, title, section ('praise', 'worship', 'offering', 'end'). Each song has slides stored as a JSON array.
> - `plans` table: id, service_date (unique). A plan is a Sunday's set list.
> - `plan_items` table: id, plan_id (foreign key), song_id (foreign key), position (for ordering).
>
> Build `admin.html` with:
> - Login (PIN 1234)
> - Tab 1: Song library — add/edit/delete songs and their slides
> - Tab 2: Set list — pick a date, drag songs from the library into the set list
>
> Update `index.html` operator to load the current Sunday's plan from the database instead of using hardcoded data.

**You'll know it works when:**
- You can create songs in admin
- You can build a set list for a specific date
- The operator app shows that set list when you load it

**Pitfalls:**
- **The admin/operator split is real.** Keep them as completely separate HTML files. They share a database, that's all. Don't try to make one page that's "admin mode and operator mode."
- **Set list editing UI.** Drag and drop is hard. Start with up/down arrow buttons.

**Commit when done.** "Phase 6: Database-driven set list."

---

### Phase 7: Graphics — images and announcements

**Goal:** Add the third major mode. Operator can push images (offering, sermon thumbnails) and templated announcements (mid-week meetings, birthdays). Images uploaded via admin, stored in Supabase Storage.

**What you'll learn:**
- Cloud file storage (different from a database row)
- Public buckets vs private buckets
- Why we use Storage instead of base64-in-a-text-column for big files
- Templated rendering (announcement card with eyebrow + title + body)

**Suggested prompt:**

> Phase 7. Add graphics. Two new modes for the overlay: `graphic` (full-screen image or video) and `announcement` (templated text card with Calvary branding).
>
> For images:
> - Admin gets a new tab: Images. Upload a file, give it a name, pick a category (offering / communion / sermon / announcement / general). Files go to a Supabase Storage bucket called `media`, public-read, 50MB max per file.
> - Operator gets a new panel: Graphics → Images. Shows uploaded images grouped by category. Click to push.
>
> For announcements:
> - Admin gets a new tab: Announcements. CRUD for saved announcements (title, body, category like 'midweek' or 'special').
> - Operator's Graphics panel has an Announcements tab. Lists saved announcements. Click to push. Also has a custom-announcement composer (type a title and body, push immediately without saving).
>
> Overlay rendering:
> - For `mode = 'graphic'`: full-screen image (or video element if it's a video file). Use `object-fit: cover` so it fills 1920×1080 and crops if aspect doesn't match.
> - For `mode = 'announcement'`: a centred red gradient card with a small uppercase "eyebrow" line, a large serif title, and a smaller body line below.

**You'll know it works when:**
- Upload an image in admin, see it in operator's Images panel, click Push, see it on overlay
- Save a "Bible Study Wednesday" announcement, push it, see it as a styled card

**Pitfalls:**
- **Storage RLS is separate from table RLS.** The bucket needs explicit policies. Without them, your uploads fail with "row violates row-level security policy" — even though it's a Storage error not a table error.
- **Don't put images in the database table.** It's tempting (`data_url` column with base64 encoded image). Don't. Realtime broadcasts have a 1MB payload limit. Anything bigger gets stripped silently. Storage is the right answer.

**Commit when done.** "Phase 7: Images, videos, and announcements."

---

## After phase 7: where to go next

Once you've got phase 7 working, you have a real, working version of Control Room. Now the fun starts. Things you could add — pick whatever calls to you:

- **Lower thirds** — speaker name + role banner that coexists with lyrics
- **Live preview panel** — embed `overlay.html` in the operator as an iframe so you can see what's about to push without alt-tabbing to OBS
- **Display settings panel** — let the operator change lyric position (top/middle/bottom), text size, logo placement
- **Multi-verse Bible passages** — "Romans 6:1-23" loads all 23 verses, Next/Prev walks through them
- **People database** — add birthdays/anniversaries, operator surfaces "this week's birthdays"
- **Sermon thumbnails attached to set list** — admin pins an image to the Sermon row of an order of service
- **Display fidelity (advanced)** — render the overlay inside a fixed 1920×1080 canvas, scaled to fit the viewport. Means preview and OBS show identical layouts. (Genuinely hard — read our existing `overlay.html` for the pattern.)

---

## When something breaks: a checklist

You will hit bugs. Here's the order of things to check before you panic:

1. **Did you hard-refresh?** Cmd+Shift+R (Mac) or Ctrl+Shift+R (Win). 90% of "it's not working" is browser cache.
2. **Is GitHub Pages updated?** Pushes take 30-60 seconds to propagate. Wait, then hard-refresh.
3. **What does the browser console say?** F12 → Console tab. Errors are red. Read them. Tell Claude.
4. **What does the database actually contain?** Open Supabase → Table Editor → look at the row. Does it have what you expect?
5. **Is RLS the problem?** If queries return zero rows, this is the most common cause. Verify with `set role anon; select * from your_table; reset role;` in the SQL editor.
6. **Is realtime publication enabled?** If realtime events aren't firing: `select * from pg_publication_tables where pubname = 'supabase_realtime';` should list your table.

---

## A note on the existing system

You already operate the live Calvary Control Room. **It is your reference, not your starting point.**

When you get stuck, you can read our code at:
`https://github.com/calvaryhfgc/calvaryhephzibah/tree/main/control-room`

But — and this is important — **don't copy-paste from it.** Read it to understand patterns, then describe to Claude what you want and let Claude write your version. Otherwise you're not learning, you're transcribing.

If you copy the existing code wholesale, you'll have a working Control Room. If you build it yourself with Claude, you'll have a working Control Room AND the ability to build the next thing.

---

## Asking for help

Bolaji built the original Control Room over many sessions with Claude. The patterns in this guide are the patterns we actually used. If you're badly stuck, here's the order:

1. **First, ask Claude.** Describe what you observed precisely. 70% of bugs unstick this way.
2. **If Claude is going in circles, step back.** Ask Claude to explain how the system is supposed to work for the part you're stuck on. Often the bug is in your understanding, not the code.
3. **If you've spent an hour stuck, message Bolaji.** Don't burn a whole afternoon on something he could clarify in 30 seconds. But — show your work. "I tried X, expected Y, got Z, here's the error" earns better help than "it's broken."

---

## What success looks like

In a month or so, you'll have a working clone of Control Room. More importantly, you'll have built it yourself, made your own decisions, fixed your own bugs, and learned the patterns of working with AI as a development tool.

The skill isn't running Control Room. The skill is **looking at any problem and asking "what would I describe to Claude to get a working solution?"** — and then steering through to that solution.

That skill applies to everything. Once you have it, you can build whatever the church needs next, on your own timeline, without anyone else writing it for you.

Have fun. It will be frustrating at times. That's the work.

---

*Written by Bolaji + Claude, April 2026, after building the real one.*
