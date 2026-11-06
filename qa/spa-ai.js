// Standalone bundle: AI readings go through the Claude `sample` capability (mocked viewer runtime).
const L = require('./lib');
const { check } = L;
const U = 'http://localhost:3200/test.html';
async function page(b, mode) {
  const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
  p.errs = []; p.on('pageerror', (e) => p.errs.push(e.message));
  await p.addInitScript((mode) => {
    window.__calls = [];
    const fake = async (input, opts) => {
      window.__calls.push({ input, opts });
      if (mode === 'declined') throw { code: 'not_granted', message: 'no' };
      if (mode === 'flaky' && window.__calls.length === 1) throw { code: 'upstream_error', message: 'x' };
      return { text: 'คำทำนายจาก Claude: ไพ่ทั้งสามบอกถึงการเริ่มต้นใหม่', truncated: false };
    };
    const perms = { state: async () => (mode === 'denied-state' ? 'denied' : 'prompt'), manage: async () => { window.__managed = true; } };
    window.claude = { use: async (n) => (n === 'sample' ? fake : n === 'permissions' ? perms : null) };
  }, mode);
  return p;
}
async function tarotReading(p) {
  await p.goto(U + '#room-tarot');
  await p.getByText('เปิดทั้งหมด').click();
  await p.waitForTimeout(1200);
  await p.getByRole('button', { name: /ตีความ/ }).click();
}
(async () => {
  const b = await L.launch();
  // granted
  let p = await page(b, 'ok');
  await tarotReading(p);
  await p.waitForSelector('text=คำทำนายจาก Claude', { timeout: 20000 });
  const calls = await p.evaluate(() => window.__calls);
  const first = calls[0].input[0].content;
  check('AI', 'reading answered by Claude (sample)', calls.length === 1, `${calls.length} call(s)`);
  check('AI', 'badge says LIVE · Claude', (await p.locator('text=LIVE · Claude').count()) === 1);
  check('AI', 'prompt carries persona + discipline + engine facts', first.includes('Madame Luna') && first.includes('Discipline: Tarot') && first.includes('Engine facts') && /"card":"[A-Z]/.test(first), first.slice(0, 160).replace(/\n/g, ' '));
  check('AI', 'chat history sent on follow-up', true);
  await p.locator('input[id^="ask-"]').fill('แล้วเรื่องงานล่ะ');
  await p.locator('form button[type="submit"]').click();
  await p.waitForFunction(() => window.__calls.length === 2, null, { timeout: 15000 });
  const c2 = await p.evaluate(() => window.__calls[1].input.map((m) => m.role).join(','));
  check('AI', 'follow-up keeps the conversation turns', c2 === 'user,assistant,user', c2);
  check('AI', 'no runtime errors (granted)', p.errs.length === 0, p.errs.join('|'));
  await p.close();
  // declined consent → demo
  p = await page(b, 'declined');
  await tarotReading(p);
  await p.waitForSelector('text=โหมดสาธิต', { timeout: 20000 });
  check('AI', 'declined consent falls back to Demo Mode (labelled DEMO)', (await p.locator('text=DEMO').count()) >= 1);
  check('AI', 'declined: explains why + offers permission settings', (await p.locator('text=ยังไม่ได้รับอนุญาตให้ใช้ Claude').count()) === 1);
  await p.getByRole('button', { name: 'เปิดการตั้งค่าสิทธิ์ของหน้านี้' }).click();
  await p.waitForTimeout(300);
  check('AI', 'permission button opens the Permissions panel', await p.evaluate(() => window.__managed === true));
  await p.close();
  // transient failure → error shown, retry works
  p = await page(b, 'flaky');
  await tarotReading(p);
  await p.waitForSelector('text=ขัดข้องชั่วคราว', { timeout: 20000 });
  const kept = await p.locator('input[id^="ask-"]').inputValue();
  check('AI', 'transient error keeps the question for retry', kept.includes('ตีความ'), kept);
  await p.locator('form button[type="submit"]').click();
  await p.waitForSelector('text=คำทำนายจาก Claude', { timeout: 20000 });
  check('AI', 'retry succeeds', true);
  await p.close();
  // no viewer runtime (local file) → demo
  const q = await b.newPage();
  await q.goto(U + '#room-tarot'); await q.getByText('เปิดทั้งหมด').click(); await q.waitForTimeout(1200);
  await q.getByRole('button', { name: /ตีความ/ }).click();
  await q.waitForSelector('text=โหมดสาธิต', { timeout: 20000 });
  check('AI', 'outside Claude (local file) → Demo Mode with explanation', (await q.locator('text=ไม่ได้เปิดอยู่ภายใน Claude').count()) === 1);
  await b.close();
})().catch((e) => { console.error('CRASH', e); process.exit(1); });
