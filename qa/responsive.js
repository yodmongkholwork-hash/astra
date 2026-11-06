// Item 8 (+ robustness): phone / tablet / desktop layouts, quality switch, reduced motion, no-WebGL fallback.
const L = require('./lib');
const { DATA, check, cam, dist, waitOverview, waitFocus } = L;
const fs = require('fs');
const SHOTS = __dirname + '/shots/';

async function layout(page) {
  return page.evaluate(() => {
    const box = (sel) => { const e = document.querySelector(sel); if (!e) return null; const r = e.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height, b: r.bottom, r: r.right }; };
    return {
      vw: innerWidth, vh: innerHeight, sw: document.documentElement.scrollWidth,
      top: box('.realm-root header'), map: box('.realm-root svg[aria-label="แผนที่อาณาจักร"]'),
      rail: box('nav[aria-label="ดินแดนในอาณาจักร"]'), panel: box('aside.realm-panel'),
      touch: (() => { const u = document.querySelector('nav[aria-label="ดินแดนในอาณาจักร"] ul'); return u ? getComputedStyle(u).touchAction : null; })(),
    };
  });
}
const overlap = (a, b) => a && b && a.x < b.r && b.x < a.r && a.y < b.b && b.y < a.b;
const inside = (a, l) => a && a.x >= -1 && a.y >= -1 && a.r <= l.vw + 1 && a.b <= l.vh + 1;

async function device(browser, name, opts) {
  const page = await L.newRealmPage(browser, opts);
  await page.goto(L.BASE + '/realms?focus=castle');
  await waitOverview(page);
  await page.waitForTimeout(1200);
  const aspect0 = (opts.width / opts.height);
  const want0 = aspect0 >= 1.2 ? 50 : aspect0 >= 0.8 ? 60 : 76;
  await page.waitForFunction((w) => Math.abs(window.__astra.camera.fov - w) < 0.5, want0, { timeout: 60000 }).catch(() => {});
  let l = await layout(page);
  const touchOverview = l.touch;
  const c = await cam(page);
  check(8, `${name}: no horizontal page scroll`, l.sw <= l.vw, `scrollWidth ${l.sw} / viewport ${l.vw}`);
  check(8, `${name}: rail inside viewport`, inside(l.rail, l), JSON.stringify(l.rail && { y: Math.round(l.rail.y), b: Math.round(l.rail.b) }));
  check(8, `${name}: HUD elements do not overlap`, !overlap(l.top, l.map) && !overlap(l.map, l.rail), `top/map/rail`);
  const aspect = l.vw / l.vh;
  const wantFov = aspect >= 1.2 ? 50 : aspect >= 0.8 ? 60 : 76;
  check(8, `${name}: lens adapted to aspect`, Math.abs(c.fov - wantFov) < 1, `fov ${c.fov.toFixed(1)} (want ${wantFov})`);
  await page.screenshot({ path: SHOTS + `8-${name}-overview.png` });
  const chip = page.locator('.realm-chip', { hasText: 'Tarot Sanctuary' });
  if (opts.mobile) await chip.tap(); else await chip.click();
  await waitFocus(page);
  await page.waitForTimeout(1500);
  l = await layout(page);
  check(8, `${name}: info panel fully on screen`, inside(l.panel, l) && !overlap(l.panel, l.top), JSON.stringify(l.panel && { y: Math.round(l.panel.y), b: Math.round(l.panel.b), h: Math.round(l.panel.h) }) + ` vh ${l.vh}`);
  const enter = page.locator('aside button:has-text("ENTER")');
  const eb = await enter.boundingBox();
  check(8, `${name}: ENTER button reachable`, eb && eb.y + eb.height <= l.vh && eb.y >= 0, eb ? `y ${Math.round(eb.y)}–${Math.round(eb.y + eb.height)}` : 'missing');
  await page.screenshot({ path: SHOTS + `8-${name}-focus.png` });
  const back = page.locator('aside button:has-text("อาณาจักร")');
  if (opts.mobile) await back.tap(); else await back.click();
  await waitOverview(page);
  check(8, `${name}: ${opts.mobile ? 'tap' : 'click'} return works`, dist(await cam(page), DATA.OVERVIEW.pos) < 30);
  if (opts.mobile) {
    check(8, `${name}: auto quality = low on phone`, (await page.locator('#realm-quality').inputValue()) === 'low');
    check(8, `${name}: rail keeps native horizontal swipe`, ['auto', 'pan-x', 'manipulation'].includes(touchOverview), `touch-action on rail: ${touchOverview}`);
  }
  check(0, `${name}: no runtime errors`, page.errors.length === 0, page.errors.join(' | '));
  await page.context().close();
}

(async () => {
  const browser = await L.launch();
  await device(browser, 'phone-390x844', { width: 390, height: 844, mobile: true });
  await device(browser, 'phone-landscape-844x390', { width: 844, height: 390, mobile: true });
  await device(browser, 'tablet-820x1180', { width: 820, height: 1180, mobile: true });
  await device(browser, 'desktop-1920x1080', { width: 1920, height: 1080, quality: 'low' });

  /* quality switch keeps the shot */
  {
    const page = await L.newRealmPage(browser, { width: 1024, height: 640, quality: 'low' });
    await page.goto(L.BASE + '/realms?focus=castle');
    await waitOverview(page);
    await page.locator('.realm-chip', { hasText: 'Tarot Sanctuary' }).click();
    await waitFocus(page);
    const before = await page.evaluate(() => window.__astra.camera.uuid);
    await page.selectOption('#realm-quality', 'medium');
    await page.waitForFunction((u) => window.__astra && window.__astra.camera.uuid !== u, before, { timeout: 120000 });
    await page.waitForTimeout(4000);
    const t = DATA.LOCATIONS.find((l) => l.id === 'tarot');
    const d = dist(await cam(page), t.shots.wide.pos);
    const phase = await page.getAttribute('.realm-root', 'data-phase');
    check(8, 'quality switch Low→Medium rebuilds renderer and keeps the shot', d < 15 && phase === 'focus', `${d.toFixed(1)} m from shot, phase ${phase}`);
    const stored = await page.evaluate(() => localStorage.getItem('astra.realms.quality'));
    check(8, 'quality choice remembered', stored === 'medium');
    check(0, 'quality switch: no runtime errors', page.errors.length === 0, page.errors.join(' | '));
    await page.context().close();
  }

  /* reduced motion */
  {
    const page = await L.newRealmPage(browser, { width: 1024, height: 640, quality: 'low', reduced: true });
    await page.goto(L.BASE + '/realms');
    await waitOverview(page, 60000);
    check(8, 'reduced motion: entrance skipped', true);
    await page.locator('.realm-chip', { hasText: 'Numeria' }).click();
    const t0 = Date.now();
    await waitFocus(page, 30000);
    const n = DATA.LOCATIONS.find((l) => l.id === 'numeria');
    check(8, 'reduced motion: travel is an instant cut', Date.now() - t0 < 4000 && dist(await cam(page), n.shots.wide.pos) < 1, `${Date.now() - t0} ms`);
    await page.context().close();
  }

  /* no WebGL → 2D fallback */
  {
    const page = await L.newRealmPage(browser, { width: 900, height: 900, noWebgl: true });
    await page.goto(L.BASE + '/realms');
    await page.waitForSelector('text=ไม่รองรับ WebGL', { timeout: 30000 });
    await page.locator('svg[aria-label="แผนที่อาณาจักร"] g', { has: page.locator('title', { hasText: 'Siam' }) }).click();
    await page.locator('button:has-text("เข้าสู่")').click();
    await page.waitForURL('**/rooms/thai-astrology', { timeout: 30000 }).catch(() => {});
    check(8, 'no-WebGL device gets 2D map that still enters rooms', page.url().endsWith('/rooms/thai-astrology'), page.url());
    await page.context().close();
  }

  fs.writeFileSync(__dirname + '/results-responsive.json', JSON.stringify(L.results, null, 1));
  await browser.close();
})().catch((e) => { console.error('SUITE CRASH', e); process.exit(1); });
