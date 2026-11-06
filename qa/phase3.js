// Phase 3: Tarot Sanctuary + Zodiac Citadel — shots frame their subjects, in-scene portals work.
const L = require('./lib');
const { DATA, check, dist, takeRec, analyse, waitOverview, waitFocus } = L;
const fs = require('fs');

const project = (page, name) =>
  page.evaluate((name) => {
    const { scene, camera } = window.__astra;
    const o = scene.getObjectByName(name);
    if (!o) return null;
    const v = o.getWorldPosition(new camera.position.constructor());
    const d = v.distanceTo(camera.position);
    v.project(camera);
    return { x: v.x, y: v.y, z: v.z, d, sx: (v.x * 0.5 + 0.5) * innerWidth, sy: (-v.y * 0.5 + 0.5) * innerHeight };
  }, name);
const onScreen = (p) => p && p.z < 1 && Math.abs(p.x) < 0.95 && Math.abs(p.y) < 0.95;

(async () => {
  const browser = await L.launch();
  const page = await L.newRealmPage(browser, { width: 1280, height: 720, quality: 'low' });
  await page.goto(L.BASE + '/realms?focus=castle');
  await waitOverview(page);

  for (const [id, name, subject, portal] of [
    ['tarot', 'Tarot Sanctuary', 'tarot-wheel', 'tarot-portal'],
    ['zodiac', 'Zodiac Citadel', 'zodiac-mechanism', 'zodiac-portal'],
  ]) {
    const loc = DATA.LOCATIONS.find((l) => l.id === id);
    await takeRec(page);
    await page.locator('.realm-chip', { hasText: name }).click();
    await waitFocus(page);
    const shots = { wide: '1', medium: '2', close: '3' };
    for (const [kind, key] of Object.entries(shots)) {
      if (kind !== 'wide') { await page.keyboard.press(key); await page.waitForTimeout(300); await waitFocus(page); }
      const rec = await takeRec(page);
      const best = Math.min(...rec.map((r) => dist(r, loc.shots[kind].pos)));
      const s = await project(page, kind === 'medium' ? portal : subject);
      check('P3', `${id} ${kind} shot lands on composition`, best < 3 && analyse(rec).jumps.length === 0, `${best.toFixed(1)} m, ${rec.length} frames`);
      check('P3', `${id} ${kind}: ${kind === 'medium' ? 'portal doorway' : 'signature object'} in frame`, onScreen(s), s ? `ndc ${s.x.toFixed(2)},${s.y.toFixed(2)} at ${s.d.toFixed(0)} m` : 'object not found');
      await page.screenshot({ path: `shots/p3-${id}-${kind}.png` });
    }
    // in-scene portal: click it from the medium shot
    await page.keyboard.press('2'); await page.waitForTimeout(300); await waitFocus(page);
    await page.waitForTimeout(800);
    const pp = await project(page, portal);
    // the portal object's origin is its base; aim a little above
    const target = { x: pp.sx, y: pp.sy - 40 };
    await page.mouse.move(target.x, target.y);
    await page.waitForTimeout(600);
    const cursor = await page.evaluate(() => document.body.style.cursor);
    check('P3', `${id}: portal reacts to hover`, cursor === 'pointer', `cursor "${cursor}"`);
    await page.mouse.click(target.x, target.y);
    await page.waitForURL(`**/rooms/${id === 'zodiac' ? 'astrology' : 'tarot'}`, { timeout: 60000 }).catch(() => {});
    check('P3', `${id}: clicking the portal enters the room`, page.url().includes(`/rooms/${id === 'zodiac' ? 'astrology' : 'tarot'}`), page.url());
    await page.goto(L.BASE + '/realms?focus=castle');
    await waitOverview(page);
  }
  check(0, 'phase 3: no runtime errors', page.errors.length === 0, page.errors.join(' | '));
  fs.writeFileSync(__dirname + '/results-phase3.json', JSON.stringify(L.results, null, 1));
  await browser.close();
})().catch((e) => { console.error('SUITE CRASH', e); process.exit(1); });
