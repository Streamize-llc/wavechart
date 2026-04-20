/**
 * Offline visual verifier for the Pine viz gallery.
 *
 *   1. Regenerate `wavealgo-pine/out/viz-gallery.html` before running (via
 *      `.venv/bin/python scripts/gen_viz_gallery.py` in wavealgo-pine).
 *   2. `node scripts/verify-gallery.mjs` (this file).
 *
 * Uses the system Chrome (no Chromium download) via puppeteer-core. Prints
 * a per-case paint summary and writes PNG screenshots of each chart area to
 * `wavealgo-pine/out/screenshots/`. Exits non-zero if any JS errors fired.
 */

import puppeteer from 'puppeteer-core';
import path from 'node:path';
import fs from 'node:fs';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const HTML = 'file://' + path.resolve(
  process.argv[2] || '../wavealgo-pine/out/viz-gallery.html',
);
const SHOTS_DIR = path.resolve('../wavealgo-pine/out/screenshots');
fs.mkdirSync(SHOTS_DIR, { recursive: true });

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-sandbox', '--disable-gpu'],
});
const page = await browser.newPage();
await page.setViewport({ width: 1280, height: 900, deviceScaleFactor: 2 });

const logs = [];
page.on('pageerror', (e) => logs.push({ type: 'pageerror', text: e.message }));
page.on('console', (m) => {
  const t = m.type();
  if (t === 'error' || t === 'warning') logs.push({ type: 'console.' + t, text: m.text() });
});

await page.goto(HTML, { waitUntil: 'networkidle0' });
await new Promise((r) => setTimeout(r, 1500));

const cases = await page.$$eval('.case', (els) =>
  els.map((el) => {
    const chart = el.querySelector('.case-chart');
    const canvases = chart ? Array.from(chart.querySelectorAll('canvas')) : [];
    const stats = canvases.map((c) => {
      try {
        const ctx = c.getContext('2d');
        const { width: w, height: h } = c;
        if (!w || !h) return { w, h, nonBgPct: 0, uniq: 0 };
        const img = ctx.getImageData(0, 0, w, h).data;
        let nonBg = 0;
        const seen = new Set();
        for (let i = 0; i < img.length; i += 4) {
          const r = img[i], g = img[i+1], b = img[i+2], a = img[i+3];
          if (a === 0) continue;
          if (r > 35 || g > 40 || b > 50) nonBg++;
          if (seen.size < 256) seen.add((r<<16)|(g<<8)|b);
        }
        return { w, h, nonBgPct: +(nonBg/(w*h)*100).toFixed(2), uniq: seen.size };
      } catch (e) { return { error: String(e) }; }
    });
    return {
      title: el.querySelector('.case-title')?.textContent || '',
      status: el.querySelector('.case-status')?.textContent || '',
      canvasStats: stats,
    };
  }),
);

const handles = await page.$$('.case');
for (let i = 0; i < handles.length; i++) {
  const chart = await handles[i].$('.case-chart');
  if (chart) await chart.screenshot({ path: path.join(SHOTS_DIR, `case-${i+1}.png`) });
}

await browser.close();

console.log(`\nGallery: ${HTML}`);
console.log(`Screenshots: ${SHOTS_DIR}`);
console.log(`Logs: ${logs.length === 0 ? 'clean ✓' : JSON.stringify(logs, null, 2)}`);
for (const c of cases) {
  const paints = c.canvasStats.map((s) =>
    s.error ? 'err' : `${s.nonBgPct}%/${s.uniq}c`
  ).join('  ');
  console.log(`  ${c.status.padEnd(46)}  [${paints}]  ::  ${c.title}`);
}

if (logs.length > 0) process.exit(1);
