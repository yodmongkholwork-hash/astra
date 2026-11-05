/**
 * ASTRA Calculation Engines
 * -------------------------
 * Pure, deterministic functions. They never call an AI model.
 * The AI layer (src/lib/agents) receives the *results* of these engines and
 * only interprets them — this keeps readings reproducible and testable.
 */

/* ---------- Numerology ---------- */
const reduce = (n: number): number => {
  while (n > 9 && n !== 11 && n !== 22 && n !== 33) {
    n = String(n)
      .split("")
      .reduce((s, d) => s + Number(d), 0);
  }
  return n;
};

/** Life Path number from an ISO date (YYYY-MM-DD). Keeps master numbers 11/22/33. */
export function lifePathNumber(isoDate: string): number {
  const [y, m, d] = isoDate.split("-").map(Number);
  if (!y || !m || !d) throw new Error("Invalid date");
  return reduce(reduce(y) + reduce(m) + reduce(d));
}

/** Digit-sum reduction for any number string (phone, plate…). */
export function numberEnergy(input: string): { total: number; root: number } {
  const digits = input.replace(/\D/g, "").split("").map(Number);
  const total = digits.reduce((s, d) => s + d, 0);
  return { total, root: reduce(total) };
}

/* ---------- Western zodiac (tropical sun sign) ---------- */
export const ZODIAC = [
  { key: "aries", th: "เมษ", glyph: "♈", start: [3, 21] },
  { key: "taurus", th: "พฤษภ", glyph: "♉", start: [4, 20] },
  { key: "gemini", th: "เมถุน", glyph: "♊", start: [5, 21] },
  { key: "cancer", th: "กรกฎ", glyph: "♋", start: [6, 21] },
  { key: "leo", th: "สิงห์", glyph: "♌", start: [7, 23] },
  { key: "virgo", th: "กันย์", glyph: "♍", start: [8, 23] },
  { key: "libra", th: "ตุลย์", glyph: "♎", start: [9, 23] },
  { key: "scorpio", th: "พิจิก", glyph: "♏", start: [10, 23] },
  { key: "sagittarius", th: "ธนู", glyph: "♐", start: [11, 22] },
  { key: "capricorn", th: "มังกร", glyph: "♑", start: [12, 22] },
  { key: "aquarius", th: "กุมภ์", glyph: "♒", start: [1, 20] },
  { key: "pisces", th: "มีน", glyph: "♓", start: [2, 19] },
] as const;

export function sunSign(month: number, day: number) {
  const md = month * 100 + day;
  // walk backwards through the year to find the last sign whose start <= date
  const ordered = [...ZODIAC].sort((a, b) => a.start[0] * 100 + a.start[1] - (b.start[0] * 100 + b.start[1]));
  let sign = ordered[ordered.length - 1]; // capricorn wraps around new year
  for (const z of ordered) if (z.start[0] * 100 + z.start[1] <= md) sign = z;
  return sign;
}

/* ---------- Chinese zodiac (by Gregorian year — approximation; BaZi engine will use solar terms) ---------- */
export const CHINESE_ANIMALS = ["ชวด", "ฉลู", "ขาล", "เถาะ", "มะโรง", "มะเส็ง", "มะเมีย", "มะแม", "วอก", "ระกา", "จอ", "กุน"];
export const FIVE_ELEMENTS = ["ไม้", "ไฟ", "ดิน", "ทอง", "น้ำ"];

export function chineseYear(year: number) {
  const animal = CHINESE_ANIMALS[(((year - 4) % 12) + 12) % 12];
  const element = FIVE_ELEMENTS[Math.floor((((year - 4) % 10) + 10) % 10 / 2)];
  const yin = (year - 4) % 2 === 1;
  return { animal, element, polarity: yin ? "หยิน" : "หยาง" };
}

/* ---------- Moon phase (synodic month approximation, ±1 day) ---------- */
const SYNODIC = 29.530588853;
const KNOWN_NEW_MOON = Date.UTC(2000, 0, 6, 18, 14); // 2000-01-06 18:14 UTC

export function moonPhase(date = new Date()) {
  const days = (date.getTime() - KNOWN_NEW_MOON) / 86400000;
  const age = ((days % SYNODIC) + SYNODIC) % SYNODIC;
  const fraction = age / SYNODIC;
  const names = [
    "จันทร์ดับ",
    "ข้างขึ้นเสี้ยว",
    "ข้างขึ้นครึ่งดวง",
    "ข้างขึ้นค่อนดวง",
    "จันทร์เพ็ญ",
    "ข้างแรมค่อนดวง",
    "ข้างแรมครึ่งดวง",
    "ข้างแรมเสี้ยว",
  ];
  const index = Math.round(fraction * 8) % 8;
  const illumination = (1 - Math.cos(2 * Math.PI * fraction)) / 2;
  return { age, fraction, name: names[index], illumination };
}

/* ---------- Seeded random (deterministic daily content) ---------- */
export function seededRandom(seed: string) {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

/* ---------- BaZi (Four Pillars) — solar-term approximation (±1 day at term boundaries) ---------- */
export const STEMS = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"];
export const BRANCHES = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];
const STEM_ELEMENT = ["ไม้", "ไม้", "ไฟ", "ไฟ", "ดิน", "ดิน", "ทอง", "ทอง", "น้ำ", "น้ำ"];
const BRANCH_ELEMENT = ["น้ำ", "ดิน", "ไม้", "ไม้", "ดิน", "ไฟ", "ไฟ", "ดิน", "ทอง", "ทอง", "ดิน", "น้ำ"];
// approximate Gregorian start day of each solar month (节), index 0 = 小寒 (Jan, 丑 month)
const JIE_DAYS = [6, 4, 6, 5, 6, 6, 7, 8, 8, 8, 7, 7];

function jdn(y: number, m: number, d: number) {
  const a = Math.floor((14 - m) / 12);
  const yy = y + 4800 - a;
  const mm = m + 12 * a - 3;
  return d + Math.floor((153 * mm + 2) / 5) + 365 * yy + Math.floor(yy / 4) - Math.floor(yy / 100) + Math.floor(yy / 400) - 32045;
}

export interface Pillar {
  label: string;
  stem: string;
  branch: string;
  element: string; // stem element
  animal: string;
}

export function bazi(isoDate: string, time?: string) {
  const [y, m, d] = isoDate.split("-").map(Number);
  if (!y || !m || !d) throw new Error("Invalid date");
  const mk = (label: string, s: number, b: number): Pillar => ({ label, stem: STEMS[s], branch: BRANCHES[b], element: STEM_ELEMENT[s], animal: CHINESE_ANIMALS[b] });

  // year begins at 立春 (~Feb 4)
  const solarYear = m < 2 || (m === 2 && d < 4) ? y - 1 : y;
  const ys = (((solarYear - 4) % 10) + 10) % 10;
  const yb = (((solarYear - 4) % 12) + 12) % 12;

  // solar month: branch 丑 for Jan after 小寒, 寅 for Feb after 立春 …
  let monthIdx = m - 1; // 0..11 where 0 = 丑 month
  if (d < JIE_DAYS[m - 1]) monthIdx -= 1;
  const mb = (((monthIdx + 1) % 12) + 12) % 12; // 0→丑(1)
  const monthsFromYin = (mb - 2 + 12) % 12;
  const ms = ((ys % 5) * 2 + 2 + monthsFromYin) % 10;

  const dayIndex = (jdn(y, m, d) + 49) % 60; // 0 = 甲子
  const ds = dayIndex % 10;
  const db = dayIndex % 12;

  const pillars = [mk("ปี", ys, yb), mk("เดือน", ms, mb), mk("วัน", ds, db)];
  if (time && /^\d{2}:\d{2}$/.test(time)) {
    const h = Number(time.slice(0, 2));
    const hb = Math.floor((h + 1) / 2) % 12;
    const hs = ((ds % 5) * 2 + hb) % 10;
    pillars.push(mk("ยาม", hs, hb));
  }

  const balance: Record<string, number> = Object.fromEntries(FIVE_ELEMENTS.map((e) => [e, 0]));
  for (const p of pillars) {
    balance[p.element] += 1;
    balance[BRANCH_ELEMENT[BRANCHES.indexOf(p.branch)]] += 1;
  }
  return { pillars, dayMaster: pillars[2].element, balance };
}

/* ---------- Thai astrology basics ---------- */
const THAI_DAYS = [
  { day: "อาทิตย์", planet: "๑", color: "แดง" },
  { day: "จันทร์", planet: "๒", color: "เหลือง" },
  { day: "อังคาร", planet: "๓", color: "ชมพู" },
  { day: "พุธ", planet: "๔", color: "เขียว" },
  { day: "พฤหัสบดี", planet: "๕", color: "ส้ม" },
  { day: "ศุกร์", planet: "๖", color: "ฟ้า" },
  { day: "เสาร์", planet: "๗", color: "ม่วง" },
];

/**
 * Sidereal sun sign (Thai sun enters each rasi ~13–16th), birth-day planet and a
 * folk approximation of ลัคนา: sun's rasi advanced one sign per ~2 hours after 06:00.
 * A full สมผุสดาว engine (สุริยยาตร์) can replace this later.
 */
export function thaiChart(isoDate: string, time?: string) {
  const [y, m, d] = isoDate.split("-").map(Number);
  const dow = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  const hour = time ? Number(time.slice(0, 2)) + Number(time.slice(3, 5)) / 60 : null;
  // Wednesday night (18:00–06:00) is ruled by Rahu (๘)
  const isWedNight = dow === 3 && hour !== null && (hour >= 18 || hour < 6);
  const birthDay = isWedNight ? { day: "พุธกลางคืน", planet: "๘", color: "เทาดำ" } : THAI_DAYS[dow];
  const sunRasi = (((m - 4 + (d >= 14 ? 0 : -1)) % 12) + 12) % 12; // 0 = เมษ from ~14 Apr
  const lagna = hour === null ? null : (sunRasi + Math.floor((((hour - 6) % 24) + 24) % 24 / 2)) % 12;
  return { birthDay, sunRasi, sunRasiTh: ZODIAC[sunRasi].th, lagna, lagnaTh: lagna === null ? null : ZODIAC[lagna].th };
}
