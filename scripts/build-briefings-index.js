#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────
// Generate briefings.json — index of every media-briefing-*.html in the repo.
//
// Reads the hero subtitle and og:image from each briefing so Calvary OS can
// show a list of past Sundays without having to fetch each file individually.
//
// Run automatically by the git pre-commit hook (.githooks/pre-commit). To
// run by hand: `node scripts/build-briefings-index.js`.
// ─────────────────────────────────────────────────────────────────────────

const fs = require('fs');
const path = require('path');

const REPO = path.resolve(__dirname, '..');
const MONTHS = { jan:0, feb:1, mar:2, apr:3, may:4, jun:5, jul:6, aug:7, sep:8, oct:9, nov:10, dec:11 };

function parseFilename(name) {
  // media-briefing-DD-mmm-YYYY.html
  const m = name.match(/^media-briefing-(\d{1,2})-([a-z]{3})-(\d{4})\.html$/i);
  if (!m) return null;
  const [, dd, mmm, yyyy] = m;
  const monthIdx = MONTHS[mmm.toLowerCase()];
  if (monthIdx === undefined) return null;
  // Build YYYY-MM-DD for sorting and Supabase compatibility
  const iso = `${yyyy}-${String(monthIdx + 1).padStart(2, '0')}-${String(parseInt(dd, 10)).padStart(2, '0')}`;
  return { iso, displayDate: `${parseInt(dd, 10)} ${mmm[0].toUpperCase()}${mmm.slice(1).toLowerCase()} ${yyyy}` };
}

function extract(html, regex, group = 1) {
  const m = html.match(regex);
  return m ? m[group].trim() : null;
}

function buildIndex() {
  const files = fs.readdirSync(REPO)
    .filter(f => /^media-briefing-\d{1,2}-[a-z]{3}-\d{4}\.html$/i.test(f))
    .sort();

  const briefings = files.map(file => {
    const parsed = parseFilename(file);
    if (!parsed) return null;
    const html = fs.readFileSync(path.join(REPO, file), 'utf-8');
    const subtitle = extract(html, /<p class="hero-sub">([^<]+)<\/p>/);
    const ogImage = extract(html, /<meta property="og:image" content="([^"]+)"/);
    const sermonTitle = extract(html, /<h3 class="serm-title">([^<]+)<\/h3>/);
    const preacher = extract(html, /<div class="serm-preacher">([^<]+)<\/div>/);
    return {
      file,
      service_date: parsed.iso,
      display_date: parsed.displayDate,
      subtitle,
      sermon_title: sermonTitle,
      preacher,
      og_image: ogImage
    };
  }).filter(Boolean);

  // Sort newest first so the OS can grab the next-upcoming with one filter.
  briefings.sort((a, b) => b.service_date.localeCompare(a.service_date));

  return {
    generated_at: new Date().toISOString(),
    count: briefings.length,
    briefings
  };
}

function main() {
  const index = buildIndex();
  const out = path.join(REPO, 'briefings.json');
  fs.writeFileSync(out, JSON.stringify(index, null, 2) + '\n');
  console.log(`✓ Wrote ${out} (${index.count} briefings)`);
}

main();
