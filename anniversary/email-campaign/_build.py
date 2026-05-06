#!/usr/bin/env python3
"""
Build all 5 anniversary emails from a shared template.
The first email (01-invitation-tue-06-may.html) is the canonical reference;
this script regenerates all five with consistent structure.
"""
from pathlib import Path

OUT_DIR = Path(__file__).parent

# ----------------------------------------------------------------------------
# Shared template (single source of structure)
# ----------------------------------------------------------------------------

TEMPLATE = """<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="x-apple-disable-message-reformatting">
  <title>{subject}</title>
  <style>
    .preheader {{ display: none !important; visibility: hidden; opacity: 0; color: transparent; height: 0; width: 0; mso-hide: all; }}
  </style>
</head>
<body style="margin:0; padding:0; background:#F0EBE2; font-family:'Inter Tight', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color:#1A1A1A;">

  <span class="preheader">{preheader}</span>

  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background:#F0EBE2;">
    <tr>
      <td align="center" style="padding:32px 16px;">

        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="600" style="max-width:600px; background:#FAF6EE; border:1px solid rgba(110,80,40,0.08);">

          <tr>
            <td style="background:#C41E2A; height:3px; line-height:3px; font-size:3px;">&nbsp;</td>
          </tr>

          <tr>
            <td align="center" style="padding:36px 32px 16px 32px;">
              <img src="https://calvaryhfgc.github.io/calvaryhephzibah/anniversary-design-system/assets/logo-eagle.png"
                   alt="Calvary Hephzibah"
                   width="48"
                   style="display:block; width:48px; height:auto; opacity:0.85;">
              <div style="font-family:'Inter Tight', -apple-system, sans-serif; font-size:11px; color:#C41E2A; text-transform:uppercase; letter-spacing:0.22em; font-weight:600; margin-top:18px;">
                {eyebrow}
              </div>
            </td>
          </tr>

          <tr>
            <td align="center" style="padding:8px 32px 24px 32px;">
              <h1 style="font-family:'Georgia', 'Instrument Serif', serif; font-style:italic; font-weight:400; font-size:32px; line-height:1.2; color:#1A1A1A; margin:0;">
                {headline}
              </h1>
            </td>
          </tr>

          <tr>
            <td style="padding:0 32px 8px 32px; font-family:'Inter Tight', -apple-system, sans-serif; font-size:16px; line-height:1.65; color:#3A3A3A;">
{body}
            </td>
          </tr>

          <tr>
            <td align="center" style="padding:0 32px 12px 32px;">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="background:#C41E2A; border-radius:4px;">
                    <a href="https://calvaryhfgc.github.io/calvaryhephzibah/anniversary/"
                       target="_blank"
                       style="display:inline-block; padding:14px 32px; font-family:'Inter Tight', -apple-system, sans-serif; font-size:13px; font-weight:600; letter-spacing:0.16em; text-transform:uppercase; color:#FAF6EE; text-decoration:none;">
                      {cta_label}
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td align="center" style="padding:24px 32px 36px 32px; font-family:'Inter Tight', -apple-system, sans-serif; font-size:13px; color:#777; letter-spacing:0.04em; line-height:1.6;">
              74 Carmoor Road, Manchester M13 0FB<br>
              {service_line}
            </td>
          </tr>

          <tr>
            <td style="padding:0 32px;">
              <table role="presentation" width="100%"><tr><td style="border-top:1px solid rgba(110,80,40,0.12); height:1px; line-height:1px; font-size:1px;">&nbsp;</td></tr></table>
            </td>
          </tr>

          <tr>
            <td style="padding:24px 32px 36px 32px; font-family:'Inter Tight', -apple-system, sans-serif; font-size:14px; color:#3A3A3A; line-height:1.6;">
              {signoff}<br>
              <strong style="color:#1A1A1A;">Pastor Shade Olatoye</strong><br>
              <span style="color:#888; font-size:12px;">General Overseer &middot; Calvary Hephzibah Full Gospel Church</span>
            </td>
          </tr>

        </table>

        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="600" style="max-width:600px;">
          <tr>
            <td align="center" style="padding:24px 16px; font-family:'Inter Tight', -apple-system, sans-serif; font-size:11px; color:#888; line-height:1.7;">
              Calvary Hephzibah Full Gospel Church &middot; Charity no. 1135709<br>
              74 Carmoor Road, Manchester M13 0FB<br>
              <a href="{{unsubscribe_url}}" style="color:#888; text-decoration:underline;">Unsubscribe</a>
            </td>
          </tr>
        </table>

      </td>
    </tr>
  </table>

</body>
</html>
"""


def paragraphs(*ps):
    """Wrap each paragraph in <p> with email-safe inline styles."""
    parts = []
    for i, p in enumerate(ps):
        margin = "0 0 16px 0" if i < len(ps) - 1 else "0 0 28px 0"
        parts.append(f'              <p style="margin:{margin};">\n                {p}\n              </p>')
    return "\n".join(parts)


# ----------------------------------------------------------------------------
# The five emails
# ----------------------------------------------------------------------------

EMAILS = [
    {
        "filename": "01-invitation-wed-06-may.html",
        "subject": "We're 34 — come and celebrate with us",
        "preheader": "Sunday 17 May. Worship, Word, and a meal at the table together.",
        "eyebrow": "Calvary Hephzibah · 34th Anniversary",
        "headline": "Beloved, come and celebrate with us.",
        "body": paragraphs(
            "God has been so faithful to us at Calvary Hephzibah. Thirty-four years of His goodness, His mercy, His presence &mdash; and many more reasons to give Him thanks than I have time to write here.",
            "On Sunday 17 May, we're gathering to mark all of it. Vibrant praise and worship. A timely word. Testimonies of God's goodness from across the Calvary family. And a proper meal at the tables together afterwards &mdash; no rush.",
            "I'd love for you to be there.",
        ),
        "cta_label": "Save my seat",
        "service_line": "Service begins 10:30 AM",
        "signoff": "With love,",
    },
    {
        "filename": "02-anticipation-sat-09-may.html",
        "subject": "A house full of thanksgiving",
        "preheader": "Eight days until our 34th. Here's a little of what's in store.",
        "eyebrow": "Eight days to go · 17 May",
        "headline": "A house full of thanksgiving.",
        "body": paragraphs(
            "Eight days. The table is being set, the worship team is in rehearsal, and the kitchen is already being talked about.",
            "When I think back on these thirty-four years, what comes up most isn't the milestones &mdash; it's the people. The faces around the room. The voices in the songs. The hands that have served. God has built a family here, and Sunday 17th is the day we celebrate Him for it.",
            "If you haven't yet, save your seat below.",
        ),
        "cta_label": "I'll be there",
        "service_line": "Sunday 17 May &middot; Service begins 10:30 AM",
        "signoff": "With love,",
    },
    {
        "filename": "03-rsvp-nudge-wed-13-may.html",
        "subject": "Save your seat — we're cooking for the whole house",
        "preheader": "Four days to go. Let us know you're coming so we can plan.",
        "eyebrow": "Four days to go · 17 May",
        "headline": "We're cooking for the whole house.",
        "body": paragraphs(
            "Four days. The kitchen needs to know how many to cook for, so if you've been meaning to RSVP, now is the moment.",
            "The day will hold worship, the Word, presentations from across the Calvary family, and a sit-down meal at round tables &mdash; bring an appetite for both.",
        ),
        "cta_label": "Save my seat",
        "service_line": "Sunday 17 May &middot; Service begins 10:30 AM",
        "signoff": "With love,",
    },
    {
        "filename": "04-final-reminder-fri-15-may.html",
        "subject": "Two days. Here's what Sunday looks like.",
        "preheader": "Worship, Word, presentations, and a meal at the table together.",
        "eyebrow": "Two days to go · 17 May",
        "headline": "Two days. Here's what Sunday looks like.",
        "body": paragraphs(
            "Two days until we mark thirty-four years of God's faithfulness.",
            "Service begins at 10:30 AM. We'll move through worship, the Word, presentations and testimonies from across the Calvary family, and then sit down to a meal together. Round tables, not rows. No queues, no rush. Eat, sit, stay.",
            "The doors open from 10. There's a seat for you.",
        ),
        "cta_label": "Save my seat",
        "service_line": "Sunday 17 May &middot; Doors from 10:00 AM",
        "signoff": "With love,",
    },
    {
        "filename": "05-tomorrow-sat-16-may.html",
        "subject": "Tomorrow.",
        "preheader": "We're ready. See you in the morning.",
        "eyebrow": "Tomorrow · 17 May",
        "headline": "Tomorrow we gather.",
        "body": paragraphs(
            "Thirty-four years of God's faithfulness, and a house full of His people coming together to thank Him for it. The team is ready. The kitchen is ready. I am ready.",
            "Come hungry. Come expectant. Come as you are.",
        ),
        "cta_label": "Open the invitation",
        "service_line": "Sunday 17 May &middot; 10:30 AM",
        "signoff": "See you in the morning,",
    },
]


def main():
    for email in EMAILS:
        html = TEMPLATE.format(**email)
        path = OUT_DIR / email["filename"]
        path.write_text(html, encoding="utf-8")
        print(f"Wrote {path.name}  ({len(html)} bytes)")


if __name__ == "__main__":
    main()
