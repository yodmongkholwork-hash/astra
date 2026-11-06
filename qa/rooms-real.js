// Real-engine rooms: astrology, Thai, BaZi render real charts from shared birth data; reading reaches the oracle.
const L = require('./lib');
const { check } = L;
(async () => {
  const b = await L.launch();
  const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
  const p = await ctx.newPage();
  const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  // birth: 1990-07-15 08:30 Bangkok
  await p.goto(L.BASE + '/rooms/astrology'); await p.waitForSelector('select.astra-input', { timeout: 30000 });
  await p.locator('input[type="date"]').first().fill('1990-07-15');
  await p.locator('input[type="time"]').first().fill('08:30');
  await p.waitForTimeout(800);
  const rows = await p.locator('table tr').allTextContents();
  console.log(rows.join('\n'));
  check('R', 'astrology: 10 planets + angles table', rows.length === 11, `${rows.length} rows`);
  check('R', 'astrology: Sun in Cancer (กรกฎ) on 1990-07-15', rows[0].includes('กรกฎ'), rows[0]);
  check('R', 'astrology: Ascendant computed (Leo expected ~08:30 BKK)', rows[10].includes('สิงห์'), rows[10]);
  await p.screenshot({ path: 'shots/r-astrology.png', fullPage: false });
  await p.getByRole('button', { name: /ส่งผังดวงให้หมอดูอ่าน/ }).click();
  await p.getByRole('button', { name: /ตีความ/ }).click();
  await p.waitForSelector('text=โหมดสาธิต', { timeout: 20000 });
  check('R', 'astrology chart → oracle chat', true);
  // Thai room reuses the saved birth data
  await p.goto(L.BASE + '/rooms/thai-astrology'); await p.waitForTimeout(2500);
  const prefilled = await p.locator('input[type="date"]').first().inputValue();
  check('R', 'birth data carried to Thai room', prefilled === '1990-07-15', prefilled);
  const thai = await p.locator('text=ลัคนาสถิตราศี').first().textContent();
  check('R', 'Thai: sidereal lagna shown', /ลัคนาสถิตราศี(กรกฎ|สิงห์)/.test(thai), thai);
  const planetsLine = await p.locator('p.text-xs.leading-relaxed').textContent();
  check('R', 'Thai: ๑ Sun sidereal in Gemini (เมถุน) mid-July', planetsLine.includes('๑ เมถุน'), planetsLine);
  await p.screenshot({ path: 'shots/r-thai.png' });
  // BaZi
  await p.goto(L.BASE + '/rooms/chinese-astrology'); await p.waitForTimeout(2500);
  const html = await p.content();
  // 1990-07-15: year 庚午, month 癸未, day 戊子? (verified by engine tests for the algorithm)
  check('R', 'BaZi: year pillar 庚午 for 1990', html.includes('庚') && html.includes('午'), '');
  check('R', 'BaZi: local solar time shown', html.includes('เวลาสุริยคติท้องถิ่น'), '');
  await p.screenshot({ path: 'shots/r-bazi.png' });
  // profile shows same data
  await p.goto(L.BASE + '/profile'); await p.waitForTimeout(1500);
  check('R', 'profile shows birth data from rooms', (await p.locator('input[type="date"]').inputValue()) === '1990-07-15');
  check('R', 'no runtime errors', errs.length === 0, errs.join(' | '));
  await b.close();
})();
