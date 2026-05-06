# 34th Anniversary — Email Campaign

Five emails from Pastor Shade, leading up to Sunday 17 May 2026.

## Schedule

| # | Send | Days out | Subject | File |
|---|------|----------|---------|------|
| 1 | **Tue 6 May** | 11 | We're 34 — come and celebrate with us | `01-invitation-tue-06-may.html` |
| 2 | **Sat 9 May** | 8 | A house full of thanksgiving | `02-anticipation-sat-09-may.html` |
| 3 | **Wed 13 May** | 4 | Save your seat — we're cooking for the whole house | `03-rsvp-nudge-wed-13-may.html` |
| 4 | **Fri 15 May** | 2 | Two days. Here's what Sunday looks like. | `04-final-reminder-fri-15-may.html` |
| 5 | **Sat 16 May** | 1 | Tomorrow. | `05-tomorrow-sat-16-may.html` |

## Voice & tone

Pastor Shade in her natural voice — direct, warm, no flourish. Christian throughout. The day is celebration without ever using the word *party* (uses *gather*, *table*, *house full*, *come hungry* instead).

Each email has a distinct job:

1. **Invitation** — first hello, what the day is, ask for the RSVP
2. **Anticipation** — quieter reflection on the people, the family, the years
3. **RSVP nudge** — practical: kitchen needs to plan, please confirm
4. **Final reminder + what to expect** — beat-by-beat of the day, doors-from-10
5. **Day-before** — short, tender, "see you in the morning"

## Preview locally

Open any of the `.html` files directly in a browser — they render as standalone pages. They're also valid email HTML and will paste cleanly into most email tools.

## Sending

These files are designed to be **uploaded into your email tool** (GoHighLevel, MailerLite, Mailchimp, Brevo, etc.). They use email-safe HTML:

- Inline styles only (no `<style>` blocks except the preheader hider)
- Table-based layout for Outlook on Windows compatibility
- Web-safe font fallbacks (`-apple-system`, Georgia, etc.)
- Single CTA button per email, all pointing to the e-flyer
- Preheader text wired up (the snippet that shows next to the subject in the inbox)
- An `{unsubscribe_url}` placeholder in the footer that most tools will replace with the real unsubscribe link automatically — if your tool uses different syntax (`{{unsubscribe}}`, `%unsubscribe%`, etc.), find-and-replace before sending

### Subject lines & preheaders (for the email tool's send dialog)

| # | Subject | Preheader |
|---|---------|-----------|
| 1 | `We're 34 — come and celebrate with us` | `Sunday 17 May. Worship, Word, and a meal at the table together.` |
| 2 | `A house full of thanksgiving` | `Eight days until our 34th. Here's a little of what's in store.` |
| 3 | `Save your seat — we're cooking for the whole house` | `Four days to go. Let us know you're coming so we can plan.` |
| 4 | `Two days. Here's what Sunday looks like.` | `Worship, Word, presentations, and a meal at the table together.` |
| 5 | `Tomorrow.` | `We're ready. See you in the morning.` |

## Editing copy

The single source of truth is `_build.py`. All five emails are generated from the same template inside that script — the body copy lives in the `EMAILS` list near the bottom. Edit there and run `python3 _build.py` to regenerate all five HTML files at once.

This also means the structure stays consistent across all five — if you change the template (button colour, footer copy, signoff format), it changes in all of them in one go.
