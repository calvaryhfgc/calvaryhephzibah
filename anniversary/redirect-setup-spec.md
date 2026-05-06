# Set up `/thankful` redirect on calvaryhephzibah.co.uk

**Goal:** make `https://calvaryhephzibah.co.uk/thankful` resolve to the live anniversary RSVP page at `https://calvaryhfgc.github.io/calvaryhephzibah/anniversary/`.

**Why:** the WhatsApp invitation flyer carries the URL `calvaryhephzibah.co.uk/thankful` — without the redirect in place, recipients clicking through hit a 404 and can't RSVP.

**Deadline:** before email 1 sends and before the WhatsApp flyer is shared (today, Wed 6 May 2026, ideally).

---

## What needs to happen

Three realistic scenarios depending on how `calvaryhephzibah.co.uk` is hosted. Identify which one applies, then follow that section.

---

### Scenario A — site is hosted on GoHighLevel (most likely)

GHL is your CRM platform, and many churches host their public website on GHL too. If so, this is the path of least resistance.

**Two ways to do it inside GHL:**

#### A.1 — As a redirect rule (cleanest)

1. Log into GoHighLevel (`app.gohighlevel.com`)
2. Open the **Sites** module from the left sidebar
3. Find the website attached to the `calvaryhephzibah.co.uk` domain
4. Look for **URL Redirects** (the exact menu name varies by GHL plan — sometimes labelled *Redirect Rules* under Site Settings, sometimes inside a *Domains* sub-section)
5. Add a new redirect:
   - **From path:** `/thankful`
   - **To URL:** `https://calvaryhfgc.github.io/calvaryhephzibah/anniversary/`
   - **Type:** 301 permanent redirect (or "permanent" — pick the 301 option, not 302)
6. Save and test in an incognito window

If your GHL plan/version doesn't expose URL redirects directly, fall back to A.2.

#### A.2 — As a thin landing page that auto-redirects

If GHL doesn't have a native redirect feature, build a 1-page funnel at `/thankful` that redirects on load:

1. Open **Sites → Funnels → New Funnel**
2. Name it `Thankful Anniversary Redirect`
3. Set the URL slug to `thankful`
4. Add a single page with **just one Custom Code element** containing this:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Calvary Hephzibah Anniversary</title>
  <meta http-equiv="refresh" content="0; url=https://calvaryhfgc.github.io/calvaryhephzibah/anniversary/">
  <link rel="canonical" href="https://calvaryhfgc.github.io/calvaryhephzibah/anniversary/">
  <script>
    window.location.replace('https://calvaryhfgc.github.io/calvaryhephzibah/anniversary/');
  </script>
</head>
<body style="font-family:sans-serif;text-align:center;padding:80px 24px;background:#F0EBE2;color:#1A1A1A;">
  <p>Taking you to the invitation…</p>
  <p><a href="https://calvaryhfgc.github.io/calvaryhephzibah/anniversary/">Open the invitation</a></p>
</body>
</html>
```

5. Publish the funnel
6. Confirm it's bound to the `calvaryhephzibah.co.uk` domain (not GHL's default subdomain)

The HTML uses **three** redirect mechanisms layered together:
- `<meta http-equiv="refresh">` — works without JavaScript
- `window.location.replace()` — works on every modern browser, faster than meta refresh
- A visible `<a>` link — works if both above fail (e.g. someone with extreme privacy settings)

---

### Scenario B — site is on WordPress

1. Log into WordPress admin
2. Two routes — pick whichever your site has:

   **B.1 — via plugin (easiest):**
   - Install the **Redirection** plugin (free, by John Godley)
   - Tools → Redirection → Add new
   - **Source URL:** `/thankful`
   - **Target URL:** `https://calvaryhfgc.github.io/calvaryhephzibah/anniversary/`
   - **HTTP code:** 301
   - Save

   **B.2 — via .htaccess** (if you have FTP access and the site is on Apache):
   - Open the `.htaccess` file at the WordPress root
   - Add this line at the very top (above the `# BEGIN WordPress` block):
     ```apache
     Redirect 301 /thankful https://calvaryhfgc.github.io/calvaryhephzibah/anniversary/
     ```
   - Save

3. Test in incognito.

---

### Scenario C — DNS-only / static site / unknown host

If you find the site is somewhere else entirely (Squarespace, Webflow, Wix, plain HTML on a host like Netlify, etc.):

- **Squarespace:** Settings → Advanced → URL Mappings → Add `/thankful -> https://calvaryhfgc.github.io/calvaryhephzibah/anniversary/ 301`
- **Webflow:** Project Settings → Hosting → 301 Redirects → Add path `/thankful` → target URL
- **Wix:** Site Settings → SEO Tools → URL Redirect Manager → Add new
- **Netlify:** add a `_redirects` file in the site root with the line `/thankful https://calvaryhfgc.github.io/calvaryhephzibah/anniversary/ 301!` (the `!` forces the redirect even if a path otherwise matches)
- **Cloudflare in front of any host:** Rules → Page Rules → URL match `calvaryhephzibah.co.uk/thankful` → action *Forwarding URL (301)* → target `https://calvaryhfgc.github.io/calvaryhephzibah/anniversary/`

---

## How to verify it's working

After setup, do all three of these checks **in an incognito window** (so cache doesn't lie to you):

1. **Browser test:** type `calvaryhephzibah.co.uk/thankful` directly into the URL bar. The browser should land on the anniversary e-flyer with the THANKFUL hero, the cards, and the working RSVP modal.

2. **Phone test:** open the URL on your phone over mobile data. WhatsApp's preview generator and most users will be on mobile — phones expose redirect/HTTPS issues that desktop browsers sometimes paper over.

3. **HTTP status check** (optional but reassuring) — from a terminal:
   ```bash
   curl -sLI -o /dev/null -w "Final URL: %{url_effective}\nStatus: %{http_code}\nRedirects: %{num_redirects}\n" \
     https://calvaryhephzibah.co.uk/thankful
   ```
   Expect: final URL ending in `/anniversary/`, status `200`, redirects `1` (or `2` if there's an http→https hop on top).

---

## What "good" looks like

- `calvaryhephzibah.co.uk/thankful` opens the anniversary page directly
- The address bar after the redirect either stays as `…/thankful` (if it's an iframe/proxy approach — less common) or updates to `calvaryhfgc.github.io/calvaryhephzibah/anniversary/` (the standard 301 path)
- The RSVP modal opens when "Save My Seat" is tapped
- The form submits successfully (you've already verified this works)

If any of those are broken, do not send the WhatsApp flyer until they are.

---

## What to do if you can't get redirect access in time

If for any reason the redirect can't be set up before send (no admin access, support ticket pending, etc.), the safest fallback is to **change the URL on the flyer** to `calvaryhfgc.github.io/calvaryhephzibah/anniversary/` instead. It's uglier and longer, but it works without any setup.

That's a one-line change in Claude design. Don't send the flyer with `calvaryhephzibah.co.uk/thankful` printed on it if the redirect isn't live — that's the worst of both worlds (broken link + visible URL on a forwarded asset that lives forever).
