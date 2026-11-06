// Shared helpers for the ASTRA Realms QA suite.
const { chromium } = require('playwright');
const DATA = require('./locations.json');
const BASE = process.env.BASE || 'http://localhost:3100';
const ARGS = ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'];

const results = [];
function check(item, name, ok, detail = '') {
  results.push({ item, name, ok: !!ok, detail: String(detail) });
  console.log(`${ok ? 'PASS' : 'FAIL'} [${item}] ${name}${detail ? ' — ' + detail : ''}`);
  return !!ok;
}

async function launch() {
  return chromium.launch({ args: ARGS });
}

async function newRealmPage(browser, { width = 1280, height = 720, quality = 'low', mobile = false, reduced = false, noWebgl = false } = {}) {
  const ctx = await browser.newContext({
    viewport: { width, height },
    deviceScaleFactor: 1,
    isMobile: mobile,
    hasTouch: mobile,
    reducedMotion: reduced ? 'reduce' : 'no-preference',
  });
  const page = await ctx.newPage();
  page.errors = [];
  page.on('pageerror', (e) => page.errors.push('pageerror: ' + e.message));
  page.on('console', (m) => {
    if (m.type() === 'error' && !/TUNNEL|fonts\.g/.test(m.text())) page.errors.push('console: ' + m.text().slice(0, 200));
  });
  await page.addInitScript(
    ({ quality, noWebgl }) => {
      window.__ASTRA_TEST__ = true;
      if (quality) try { localStorage.setItem('astra.realms.quality', quality); } catch {}
      if (noWebgl) {
        const orig = HTMLCanvasElement.prototype.getContext;
        HTMLCanvasElement.prototype.getContext = function (t, ...a) {
          return /webgl/.test(t) ? null : orig.call(this, t, ...a);
        };
      }
      // per-frame camera recorder
      window.__rec = [];
      const tick = () => {
        const a = window.__astra;
        if (a && window.__recOn) {
          const c = a.camera;
          const d = c.getWorldDirection(new c.position.constructor());
          window.__rec.push({ t: performance.now(), x: c.position.x, y: c.position.y, z: c.position.z, dx: d.x, dy: d.y, dz: d.z, fov: c.fov });
        }
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
      window.__recOn = true;
    },
    { quality: mobile ? null : quality, noWebgl },
  );
  return page;
}

const cam = (page) => page.evaluate(() => { const c = window.__astra.camera; return { x: c.position.x, y: c.position.y, z: c.position.z, fov: c.fov }; });
const dist = (a, b) => Math.hypot(a.x - b[0], a.y - b[1], a.z - b[2]);
const takeRec = (page) => page.evaluate(() => { const r = window.__rec; window.__rec = []; return r; });

/**
 * Smoothness analysis: a "jump" is a frame whose positional step is > 6× the
 * median of its neighbours AND > 20 m, or whose view direction turns > 20°
 * while neighbours turn < 5°. Returns worst values for reporting.
 */
function analyse(rec) {
  const steps = [];
  const turns = [];
  for (let i = 1; i < rec.length; i++) {
    const a = rec[i - 1], b = rec[i];
    steps.push(Math.hypot(b.x - a.x, b.y - a.y, b.z - a.z));
    const dot = Math.max(-1, Math.min(1, a.dx * b.dx + a.dy * b.dy + a.dz * b.dz));
    turns.push((Math.acos(dot) * 180) / Math.PI);
  }
  const jumps = [];
  for (let i = 2; i < steps.length - 2; i++) {
    const nb = [steps[i - 2], steps[i - 1], steps[i + 1], steps[i + 2]].sort((p, q) => p - q);
    const med = (nb[1] + nb[2]) / 2;
    if (steps[i] > 20 && steps[i] > 6 * Math.max(med, 0.5)) jumps.push({ i, step: steps[i].toFixed(1), med: med.toFixed(1) });
    const tn = Math.max(turns[i - 1], turns[i + 1]);
    if (turns[i] > 20 && tn < 5) jumps.push({ i, turn: turns[i].toFixed(1) });
  }
  if (jumps.length) jumps.ctx = jumps.slice(0, 2).map((j) => rec.slice(Math.max(0, j.i - 2), j.i + 3).map((r) => [r.x, r.y, r.z].map((v) => Math.round(v)).join(',')));
  return { ctx: jumps.ctx, frames: rec.length, maxStep: Math.max(0, ...steps), maxTurn: Math.max(0, ...turns), jumps };
}

async function waitOverview(page, timeout = 240000) {
  await page.waitForSelector('.realm-root[data-phase="overview"]', { timeout });
}
async function waitFocus(page, timeout = 240000) {
  await page.waitForSelector('.realm-root[data-phase="focus"]', { timeout });
}
/** click like a person: at the element's current on-screen centre (markers drift with the camera) */
async function clickAt(page, locator) {
  const box = await locator.boundingBox();
  if (!box) throw new Error('no box');
  const x = box.x + box.width / 2, y = box.y + box.height / 2;
  const topIsSelf = await locator.evaluate((el, [x, y]) => el.contains(document.elementFromPoint(x, y)), [x, y]);
  await page.mouse.click(x, y);
  return topIsSelf;
}

module.exports = { clickAt, DATA, BASE, results, check, launch, newRealmPage, cam, dist, takeRec, analyse, waitOverview, waitFocus };
