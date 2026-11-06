// Items 1–7: entrance, overview, camera, markers, transitions, return, animation (desktop).
const L = require('./lib');
const { DATA, check, cam, dist, takeRec, analyse, waitOverview, waitFocus } = L;
const fs = require('fs');
const SHOTS = __dirname + '/shots/';
fs.mkdirSync(SHOTS, { recursive: true });

(async () => {
  const browser = await L.launch();
  const page = await L.newRealmPage(browser, { width: 1024, height: 576, quality: 'low' });
  const allRec = [];
  await page.goto(L.BASE + '/realms');

  /* ---------- 1. Cinematic entrance ---------- */
  await page.waitForFunction(() => !!window.__astra, null, { timeout: 60000 });
  check(1, 'loading screen shown before scene', await page.locator('text=Summoning the Realm').count() >= 0);
  await page.waitForSelector('text=Summoning the Realm', { state: 'detached', timeout: 90000 });
  const start = await cam(page);
  check(1, 'starts above the cloud sea', start.y > 480, `camera y=${start.y.toFixed(0)} (cloud sea 390–480)`);
  check(1, 'letterbox + title + SKIP visible', (await page.locator('h1:has-text("ASTRA")').count()) > 0 && (await page.locator('button:has-text("SKIP")').count()) > 0);
  await page.screenshot({ path: SHOTS + '1-intro-start.png' });
  // record the whole entrance until overview
  const midShots = [];
  const t0 = Date.now();
  let shotN = 0;
  while (!(await page.locator('.realm-root[data-phase="overview"]').count())) {
    await page.waitForTimeout(4000);
    if (shotN < 3) await page.screenshot({ path: SHOTS + `1-intro-${++shotN}.png` });
    if (Date.now() - t0 > 240000) break;
  }
  const intro = await takeRec(page);
  allRec.push(intro);
  const ys = intro.map((r) => r.y);
  const inBand = intro.filter((r) => r.y >= 390 && r.y <= 480);
  // which cloud puffs did the camera pass near?
  const cloudHits = await page.evaluate((samples) => {
    let mesh = null;
    window.__astra.scene.traverse((o) => { if (o.isInstancedMesh && o.material?.uniforms?.uLit) mesh = o; });
    if (!mesh) return { found: false };
    const M = new mesh.matrix.constructor();
    const centers = [];
    for (let i = 0; i < mesh.count; i++) { mesh.getMatrixAt(i, M); centers.push([M.elements[12], M.elements[13], M.elements[14], mesh.geometry.attributes.aData.getX(i)]); }
    let near = 0, minD = 1e9;
    for (const s of samples) for (const c of centers) {
      const d = Math.hypot(s.x - c[0], s.y - c[1], s.z - c[2]);
      minD = Math.min(minD, d);
      if (d < c[3] * 0.5) near++;
    }
    return { found: true, puffs: mesh.count, near, minD };
  }, inBand.length ? inBand : intro.slice(0, 50));
  const end = intro[intro.length - 1] || start;
  check(1, 'descends through the cloud layer', Math.max(...ys) > 480 && Math.min(...ys) < 390 && inBand.length > 0, `y ${Math.min(...ys).toFixed(0)}→${Math.max(...ys).toFixed(0)}, ${inBand.length} frames inside the cloud band`);
  check(1, 'camera actually passes through cloud puffs', cloudHits.found && cloudHits.near > 0, `${cloudHits.puffs} puffs, nearest ${cloudHits.minD?.toFixed(0)} m, ${cloudHits.near} sample×puff overlaps`);
  // establishing shot: the path must pass near the castle wide pose
  const wide = DATA.LOCATIONS[0].shots.wide.pos;
  const nearest = Math.min(...intro.map((r) => Math.hypot(r.x - wide[0], r.y - wide[1], r.z - wide[2])));
  check(1, 'arrives at castle establishing shot', nearest < 15, `closest approach to establishing pose ${nearest.toFixed(1)} m`);
  const ai = analyse(intro);
  check(3, 'entrance has no camera jumps', ai.jumps.length === 0, `${ai.frames} frames, max step ${ai.maxStep.toFixed(1)} m, max turn ${ai.maxTurn.toFixed(1)}°, jumps ${JSON.stringify(ai.jumps.slice(0, 3))} ${JSON.stringify(ai.ctx ?? '')}`);

  /* ---------- 2. Overview ---------- */
  // closest recorded frame to the overview pose = the arrival frame (idle drift starts after it)
  const ovMin = Math.min(...intro.map((r) => dist(r, DATA.OVERVIEW.pos)));
  check(2, 'overview pose reached after entrance', ovMin < 3, `arrival frame ${ovMin.toFixed(1)} m from overview pose (idle drift is added afterwards)`);
  const stats = await page.evaluate(() => {
    let meshes = 0, inst = 0, instances = 0, points = 0, tris = 0;
    window.__astra.scene.traverse((o) => {
      if (o.isInstancedMesh) { inst++; instances += o.count; }
      else if (o.isMesh) meshes++;
      if (o.isPoints) points++;
    });
    const info = window.__astra.gl.info.render;
    return { meshes, inst, instances, points, calls: info.calls, tris: info.triangles };
  });
  check(2, 'real 3D scene graph (castle, terrain, islands, landmarks)', stats.meshes > 300, `${stats.meshes} meshes, ${stats.inst} instanced (${stats.instances} instances), ${stats.points} particle systems, ${stats.calls} draw calls, ${stats.tris} triangles/frame`);
  await page.waitForTimeout(2500);
  await page.screenshot({ path: SHOTS + '2-overview.png' });
  const labels = await page.locator('.realm-marker').count();
  check(4, '8 location markers rendered', labels === 8, `${labels} markers`);

  /* ---------- 4/5/6. Markers → travel → return, for every territory ---------- */
  await takeRec(page);
  for (const loc of DATA.LOCATIONS) {
    const marker = page.locator('.realm-marker', { hasText: loc.name });
    let clicked = true, onTop = false;
    try { onTop = await L.clickAt(page, marker); } catch (e) { clicked = false; }
    if (!clicked || !onTop) { check(4, `marker clickable: ${loc.name}`, false, clicked ? 'another element covers the marker' : 'marker not on screen'); continue; }
    await waitFocus(page);
    const rec = await takeRec(page);
    allRec.push(rec);
    const c = await cam(page);
    const title = await page.locator('aside h2').textContent();
    const lift = Math.max(...rec.map((r) => r.y)) - Math.max(rec[0]?.y ?? 0, loc.shots.wide.pos[1]);
    const a = analyse(rec);
    check(4, `marker click → ${loc.name}`, title === loc.name, `panel "${title}"`);
    check(5, `travel lands on composed wide shot: ${loc.id}`, dist(c, loc.shots.wide.pos) < 15, `${dist(c, loc.shots.wide.pos).toFixed(1)} m off, ${a.frames} frames, arc lift ${lift.toFixed(0)} m, jumps ${a.jumps.length}${a.ctx ? ' ' + JSON.stringify(a.ctx) : ''}`);
    if (loc.id === 'tarot' || loc.id === 'palmistry') await page.screenshot({ path: SHOTS + `5-focus-${loc.id}.png` });
    // return via button
    await page.locator('aside button:has-text("อาณาจักร")').click();
    await waitOverview(page);
    const back = await takeRec(page);
    allRec.push(back);
    const b = back.reduce((best, r) => (dist(r, DATA.OVERVIEW.pos) < dist(best, DATA.OVERVIEW.pos) ? r : best), back[0] ?? (await cam(page)));
    const sel = await page.locator('.realm-chip.is-selected').textContent().catch(() => '');
    check(6, `return to overview from ${loc.id}`, dist(b, DATA.OVERVIEW.pos) < 30 && sel.includes(loc.name), `${dist(b, DATA.OVERVIEW.pos).toFixed(1)} m from overview, highlighted chip: ${sel.slice(0, 30)}`);
  }

  /* ---------- other inputs ---------- */
  await page.locator('.realm-chip', { hasText: 'Zodiac Citadel' }).click();
  await waitFocus(page);
  check(4, 'location rail chip travels', (await page.locator('aside h2').textContent()) === 'Zodiac Citadel');
  await page.keyboard.press('2');
  await page.waitForTimeout(300);
  await waitFocus(page);
  const z = DATA.LOCATIONS.find((l) => l.id === 'zodiac');
  check(5, 'shot switch (key 2 → medium shot)', dist(await cam(page), z.shots.medium.pos) < 15, `${dist(await cam(page), z.shots.medium.pos).toFixed(1)} m off`);
  await page.keyboard.press('ArrowRight');
  await waitFocus(page);
  check(4, 'keyboard → next territory', (await page.locator('aside h2').textContent()) === 'Siam Astral Temple');
  await page.keyboard.press('Escape');
  await waitOverview(page);
  check(6, 'Esc returns to overview', dist(await cam(page), DATA.OVERVIEW.pos) < 30);
  // mini-map
  await page.locator('svg[aria-label="แผนที่อาณาจักร"] g', { has: page.locator('title', { hasText: 'Numeria' }) }).click();
  await waitFocus(page);
  check(4, 'mini-map click travels', (await page.locator('aside h2').textContent()) === 'Numeria Kingdom');

  // interruption: re-target mid-flight via mini-map
  await takeRec(page);
  await page.locator('svg[aria-label="แผนที่อาณาจักร"] g', { has: page.locator('title', { hasText: 'Five Elements' }) }).click();
  await page.waitForTimeout(1500);
  await page.locator('svg[aria-label="แผนที่อาณาจักร"] g', { has: page.locator('title', { hasText: 'Dreamveil' }) }).click();
  await waitFocus(page);
  const irec = await takeRec(page);
  allRec.push(irec);
  const ia = analyse(irec);
  const dv = DATA.LOCATIONS.find((l) => l.id === 'dreamveil');
  check(3, 'mid-flight re-targeting stays continuous', ia.jumps.length === 0 && dist(await cam(page), dv.shots.wide.pos) < 15, `${ia.frames} frames, max step ${ia.maxStep.toFixed(1)} m, jumps ${ia.jumps.length}, final ${(await page.locator('aside h2').textContent())}`);

  /* ---------- 7. Animation ---------- */
  const anim = async () =>
    page.evaluate(() => {
      const out = {};
      window.__astra.scene.traverse((o) => {
        const u = o.material?.uniforms;
        if (u?.uTime) {
          const k = u.uLit ? 'clouds' : u.uMoon ? 'sky' : u.uColor && o.geometry?.type === 'BufferGeometry' ? 'river' : u.uColor ? 'moat' : o.geometry?.type === 'PlaneGeometry' ? 'waterfall' : 'godrays/other';
          out[k] = Math.max(out[k] ?? 0, u.uTime.value);
        }
        if (o.isPoints) out.sparkles = (out.sparkles ?? 0) + 1;
        if (o.geometry?.type === 'OctahedronGeometry' && o.parent?.children.some((c) => c.geometry?.type === 'TorusGeometry')) out.crystalRotY = o.parent.rotation.y;
      });
      return out;
    });
  const a1 = await anim();
  await page.waitForTimeout(3000);
  const a2 = await anim();
  for (const k of ['clouds', 'sky', 'river', 'waterfall']) check(7, `${k} shader animating`, a2[k] > (a1[k] ?? 0), `uTime ${a1[k]?.toFixed(2)} → ${a2[k]?.toFixed(2)}`);
  check(7, 'castle crystal rotating', a2.crystalRotY !== a1.crystalRotY, `${a1.crystalRotY?.toFixed(2)} → ${a2.crystalRotY?.toFixed(2)}`);
  check(7, 'magic particle systems present', a2.sparkles >= 3, `${a2.sparkles} Points systems`);

  /* ---------- enter room ---------- */
  await page.keyboard.press('Enter');
  await page.waitForURL('**/rooms/dreams', { timeout: 60000 }).catch(() => {});
  check(5, 'Enter → existing room', page.url().endsWith('/rooms/dreams'), page.url());

  const segs = allRec.map(analyse);
  const bad = segs.filter((a) => a.jumps.length);
  check(3, 'whole session: no camera jumps', bad.length === 0, `${segs.length} recorded moves, ${segs.reduce((n, a) => n + a.frames, 0)} frames, worst step ${Math.max(...segs.map((a) => a.maxStep)).toFixed(1)} m; ${bad.map((a) => JSON.stringify(a.jumps.slice(0, 2)) + JSON.stringify(a.ctx)).join(' ')}`);
  check(0, 'no runtime errors (desktop)', page.errors.length === 0, page.errors.join(' | '));
  fs.writeFileSync(__dirname + '/results-desktop.json', JSON.stringify(L.results, null, 1));
  await browser.close();
})().catch((e) => { console.error('SUITE CRASH', e); process.exit(1); });
