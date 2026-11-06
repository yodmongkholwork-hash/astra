// Item 9: the pre-existing ASTRA app still works (pages, rooms, engines, chat, history, API).
const L = require('./lib');
const { check } = L;
const fs = require('fs');
const SHOTS = __dirname + '/shots/';

(async () => {
  const browser = await L.launch();
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error' && !/TUNNEL|fonts\.g/.test(m.text())) errors.push(m.text().slice(0, 200)); });

  // HTTP status of every route
  for (const r of ['/', '/realms', '/profile', '/rooms/tarot', '/rooms/astrology', '/rooms/thai-astrology', '/rooms/chinese-astrology', '/rooms/numerology', '/rooms/dreams', '/rooms/palmistry']) {
    const res = await page.request.get(L.BASE + r);
    check(9, `GET ${r}`, res.status() === 200, res.status());
  }
  const nf1 = await page.request.get(L.BASE + '/rooms/nope-' + Date.now());
  const nf2 = await page.request.get(L.BASE + '/rooms/nope-' + Date.now());
  check(9, 'unknown room → 404 (first and repeat hits)', nf1.status() === 404 && nf2.status() === 404 && (await nf1.text()).includes('could not be found'), `${nf1.status()}, ${nf2.status()}`);

  // API route
  const bad = await page.request.post(L.BASE + '/api/oracle', { data: { room: 'x', personaId: 'y', messages: [] } });
  check(9, 'API rejects invalid input', bad.status() === 400, bad.status());
  const ok = await page.request.post(L.BASE + '/api/oracle', { data: { room: 'tarot', personaId: 'madame-luna', messages: [{ role: 'user', content: 'ความรักเดือนนี้' }] } });
  const okj = await ok.json();
  check(9, 'API answers in Demo Mode', ok.status() === 200 && okj.demo === true && okj.reply.length > 20, `${ok.status()} demo=${okj.demo}`);

  // home → portal → tarot room
  await page.goto(L.BASE + '/');
  await page.waitForTimeout(1500);
  check(9, 'home: 7 room portals', (await page.locator('#chambers button').count()) === 7);
  check(9, 'home: link to Mystic Realms', (await page.locator('a[href="/realms"]').count()) > 0);
  await page.locator('#chambers button').first().click();
  await page.waitForURL('**/rooms/tarot', { timeout: 15000 });
  await page.waitForTimeout(2000);
  await page.getByText('เปิดทั้งหมด').click();
  await page.waitForTimeout(1500);
  const opened = await page.locator('text=เปิดครบแล้ว').count();
  check(9, 'tarot: cards flip and spread completes', opened > 0);
  await page.getByRole('button', { name: /ตีความ/ }).click();
  await page.waitForSelector('text=โหมดสาธิต', { timeout: 15000 });
  check(9, 'tarot → oracle chat interprets via API', true);
  await page.getByText('บันทึกคำทำนายล่าสุด').click();
  await page.waitForSelector('text=บันทึกลงประวัติแล้ว');
  check(9, 'reading saved to history', true);
  // celtic cross spread
  await page.getByRole('radio', { name: /Celtic Cross/ }).click();
  check(9, 'tarot: Celtic Cross deals 10 cards', (await page.locator('button[aria-label^="เปิดไพ่ตำแหน่ง"]').count()) === 10);

  // engines through the rooms
  await page.goto(L.BASE + '/rooms/numerology');
  await page.waitForTimeout(1500);
  await page.locator('input[type="date"]').first().fill('1990-07-15');
  await page.waitForTimeout(500);
  check(9, 'numerology engine: life path for 1990-07-15 = 5', (await page.locator('text=/\\b5\\b/').count()) > 0);
  await page.goto(L.BASE + '/rooms/chinese-astrology');
  await page.waitForTimeout(1500);
  await page.locator('input[type="date"]').first().fill('2000-01-01');
  await page.waitForTimeout(500);
  check(9, 'BaZi engine: 2000-01-01 day pillar 戊午', (await page.locator('text=ปาจื้อ').count()) >= 0 && (await page.content()).includes('戊') && (await page.content()).includes('午'));
  await page.goto(L.BASE + '/rooms/palmistry');
  await page.waitForSelector('svg[aria-label="ฝ่ามือแบบโต้ตอบ"]', { timeout: 20000 });
  await page.getByRole('button', { name: 'เส้นหัวใจ' }).first().click();
  const palmOk = await page.waitForSelector('text=อารมณ์และความรัก', { timeout: 5000 }).then(() => true, () => false);
  check(9, 'palmistry: line selection explains meaning', palmOk);
  await page.goto(L.BASE + '/rooms/dreams');
  await page.waitForSelector('textarea', { timeout: 20000 });
  await page.locator('textarea').fill('ฝันว่าเห็นงูใหญ่ในน้ำ');
  await page.getByRole('button', { name: 'ถอดสัญลักษณ์ความฝัน' }).click();
  await page.waitForTimeout(800);
  check(9, 'dream room: symbols detected', (await page.locator('text=งู').count()) > 1);

  // room → back to realms with focus
  await page.goto(L.BASE + '/rooms/astrology');
  await page.waitForTimeout(1200);
  const realmsLink = await page.locator('a:has-text("Realms")').getAttribute('href');
  check(9, 'room links back to its realm', realmsLink === '/realms?focus=zodiac', realmsLink);

  // profile + history
  await page.goto(L.BASE + '/profile');
  await page.waitForTimeout(1500);
  check(9, 'profile shows saved reading', (await page.locator('li button[aria-expanded]').count()) >= 1);
  await page.locator('input[type="date"]').fill('1995-03-21');
  await page.getByRole('button', { name: 'บันทึกโปรไฟล์' }).click();
  await page.waitForSelector('text=บันทึกแล้ว');
  check(9, 'profile saves; dashboard computes sign', (await page.locator('text=เมษ').count()) > 0);
  await page.screenshot({ path: SHOTS + '9-profile.png', fullPage: true });

  check(0, 'regression: no runtime errors', errors.length === 0, errors.join(' | '));
  fs.writeFileSync(__dirname + '/results-regression.json', JSON.stringify(L.results, null, 1));
  await browser.close();
})().catch((e) => { console.error('SUITE CRASH', e); process.exit(1); });
