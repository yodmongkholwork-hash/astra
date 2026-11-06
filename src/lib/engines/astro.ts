/**
 * ASTRA astronomical calculation engine (real ephemeris, no AI).
 * Uses astronomy-engine (VSOP87/ELP-based, arc-second level for planets).
 *
 *  - natalChart():   tropical positions of Sun…Pluto, Ascendant/MC, whole-sign houses, aspects
 *  - thaiChart():    sidereal (Lahiri ayanamsa) positions as ๑–๙ + ๐, ลัคนา, Thai rasi houses
 *  - baziExact():    Four Pillars with true solar terms (节) and local solar time for the hour
 *
 * Everything takes the birth moment as local civil time + IANA zone, converted to UTC here.
 */
import * as A from "astronomy-engine";
import { ZODIAC } from "./index";

const norm = (d: number) => ((d % 360) + 360) % 360;
const rad = Math.PI / 180;

/* ------------------------------------------------------------------ time */

/** Offset (minutes) of `tz` from UTC at instant `utcMs`. */
function tzOffsetMinutes(tz: string, utcMs: number) {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: tz, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" }).formatToParts(new Date(utcMs));
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  const asUtc = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second"));
  return Math.round((asUtc - utcMs) / 60000);
}

/** Local civil date/time in an IANA zone → UTC Date (handles DST by iterating). */
export function localToUtc(date: string, time: string, tz: string): Date {
  const [y, m, d] = date.split("-").map(Number);
  const [hh, mm] = (time || "12:00").split(":").map(Number);
  const guess = Date.UTC(y, m - 1, d, hh, mm);
  let utc = guess - tzOffsetMinutes(tz, guess) * 60000;
  utc = guess - tzOffsetMinutes(tz, utc) * 60000;
  return new Date(utc);
}

/* -------------------------------------------------------------- planets */

export type PlanetKey = "sun" | "moon" | "mercury" | "venus" | "mars" | "jupiter" | "saturn" | "uranus" | "neptune" | "pluto";

export const PLANETS: { key: PlanetKey; th: string; en: string; glyph: string; body?: A.Body }[] = [
  { key: "sun", th: "อาทิตย์", en: "Sun", glyph: "☉" },
  { key: "moon", th: "จันทร์", en: "Moon", glyph: "☽" },
  { key: "mercury", th: "พุธ", en: "Mercury", glyph: "☿", body: A.Body.Mercury },
  { key: "venus", th: "ศุกร์", en: "Venus", glyph: "♀", body: A.Body.Venus },
  { key: "mars", th: "อังคาร", en: "Mars", glyph: "♂", body: A.Body.Mars },
  { key: "jupiter", th: "พฤหัสบดี", en: "Jupiter", glyph: "♃", body: A.Body.Jupiter },
  { key: "saturn", th: "เสาร์", en: "Saturn", glyph: "♄", body: A.Body.Saturn },
  { key: "uranus", th: "มฤตยู (ยูเรนัส)", en: "Uranus", glyph: "♅", body: A.Body.Uranus },
  { key: "neptune", th: "เนปจูน", en: "Neptune", glyph: "♆", body: A.Body.Neptune },
  { key: "pluto", th: "พลูโต", en: "Pluto", glyph: "♇", body: A.Body.Pluto },
];

/** Geocentric apparent ecliptic longitude of date (tropical), degrees. */
export function tropicalLongitude(key: PlanetKey, when: Date): number {
  if (key === "sun") return A.SunPosition(when).elon;
  if (key === "moon") return A.EclipticGeoMoon(when).lon;
  const body = PLANETS.find((p) => p.key === key)!.body!;
  const eqj = A.GeoVector(body, when, true);
  const ect = A.RotateVector(A.Rotation_EQJ_ECT(when), eqj);
  return norm(Math.atan2(ect.y, ect.x) / rad);
}

/** Mean lunar ascending node (ราหู), tropical degrees. */
export function meanNode(when: Date) {
  const T = (when.getTime() / 86400000 + 2440587.5 - 2451545.0) / 36525;
  return norm(125.0445479 - 1934.1362891 * T + 0.0020754 * T * T);
}

/** Lahiri (Chitrapaksha) ayanamsa, degrees — standard for Indian/Thai sidereal work. */
export function ayanamsa(when: Date) {
  const years = (when.getTime() - Date.UTC(2000, 0, 1, 12)) / (365.25 * 86400000);
  return 23.85306 + (50.2788 / 3600) * years;
}

/** Ascendant and Midheaven (tropical) for a place. */
export function angles(when: Date, lat: number, lon: number) {
  const time = A.MakeTime(when);
  const eps = A.e_tilt(time).tobl * rad;
  const ramc = norm((A.SiderealTime(when) + lon / 15) * 15) * rad;
  const asc = norm(Math.atan2(Math.cos(ramc), -(Math.sin(ramc) * Math.cos(eps) + Math.tan(lat * rad) * Math.sin(eps))) / rad);
  const mc = norm(Math.atan2(Math.sin(ramc), Math.cos(ramc) * Math.cos(eps)) / rad);
  return { asc, mc };
}

export const signOf = (lon: number) => Math.floor(norm(lon) / 30);
export function formatDeg(lon: number) {
  const inSign = norm(lon) % 30;
  const d = Math.floor(inSign);
  const m = Math.floor((inSign - d) * 60);
  return `${d}°${String(m).padStart(2, "0")}′`;
}

/* ---------------------------------------------------------- natal chart */

const ASPECTS = [
  { key: "conjunction", th: "กุมกัน", angle: 0, orb: 8 },
  { key: "opposition", th: "เล็งกัน", angle: 180, orb: 8 },
  { key: "trine", th: "ตรีโกณ", angle: 120, orb: 7 },
  { key: "square", th: "ฉาก", angle: 90, orb: 7 },
  { key: "sextile", th: "โยค (60°)", angle: 60, orb: 5 },
] as const;

export interface NatalInput {
  date: string; // YYYY-MM-DD local
  time?: string; // HH:mm local (optional)
  lat?: number;
  lon?: number;
  tz: string;
}

export function natalChart(input: NatalInput) {
  const timeKnown = !!input.time;
  const placeKnown = typeof input.lat === "number" && typeof input.lon === "number";
  const when = localToUtc(input.date, input.time || "12:00", input.tz);
  const dayLater = new Date(when.getTime() + 86400000);

  const ang = timeKnown && placeKnown ? angles(when, input.lat!, input.lon!) : null;
  const ascSign = ang ? signOf(ang.asc) : null;

  const planets = PLANETS.map((p) => {
    const lon = tropicalLongitude(p.key, when);
    const next = tropicalLongitude(p.key, dayLater);
    const motion = ((next - lon + 540) % 360) - 180;
    const sign = signOf(lon);
    return {
      key: p.key,
      th: p.th,
      en: p.en,
      glyph: p.glyph,
      lon,
      sign,
      signTh: ZODIAC[sign].th,
      signEn: ZODIAC[sign].key,
      degree: formatDeg(lon),
      retrograde: p.key !== "sun" && p.key !== "moon" && motion < 0,
      // whole-sign houses from the Ascendant sign
      house: ascSign === null ? null : ((sign - ascSign + 12) % 12) + 1,
    };
  });

  const aspects: { a: string; b: string; type: string; th: string; orb: number }[] = [];
  for (let i = 0; i < planets.length; i++)
    for (let j = i + 1; j < planets.length; j++) {
      const d = Math.abs(((planets[i].lon - planets[j].lon + 540) % 360) - 180);
      for (const asp of ASPECTS) {
        const orb = Math.abs(d - asp.angle);
        // the Moon moves ~13°/day: with unknown birth time its aspects are unreliable
        if (orb <= asp.orb && (timeKnown || (planets[i].key !== "moon" && planets[j].key !== "moon"))) {
          aspects.push({ a: planets[i].en, b: planets[j].en, type: asp.key, th: asp.th, orb: Math.round(orb * 10) / 10 });
        }
      }
    }
  aspects.sort((x, y) => x.orb - y.orb);

  const elements = { fire: 0, earth: 0, air: 0, water: 0 };
  const EL = ["fire", "earth", "air", "water"] as const;
  planets.slice(0, 7).forEach((p) => (elements[EL[p.sign % 4]] += 1));

  return {
    utc: when.toISOString(),
    timeKnown,
    placeKnown,
    planets,
    ascendant: ang ? { lon: ang.asc, sign: signOf(ang.asc), signTh: ZODIAC[signOf(ang.asc)].th, degree: formatDeg(ang.asc) } : null,
    midheaven: ang ? { lon: ang.mc, sign: signOf(ang.mc), signTh: ZODIAC[signOf(ang.mc)].th, degree: formatDeg(ang.mc) } : null,
    houseSystem: "whole-sign",
    aspects,
    elements,
  };
}

/* ------------------------------------------------------------ Thai chart */

/** Thai planet numbering: ๑ อาทิตย์ ๒ จันทร์ ๓ อังคาร ๔ พุธ ๕ พฤหัสบดี ๖ ศุกร์ ๗ เสาร์ ๘ ราหู ๙ เกตุ ๐ มฤตยู */
const THAI_PLANETS: { num: string; th: string; key: PlanetKey | "rahu" | "ketu" }[] = [
  { num: "๑", th: "อาทิตย์", key: "sun" },
  { num: "๒", th: "จันทร์", key: "moon" },
  { num: "๓", th: "อังคาร", key: "mars" },
  { num: "๔", th: "พุธ", key: "mercury" },
  { num: "๕", th: "พฤหัสบดี", key: "jupiter" },
  { num: "๖", th: "ศุกร์", key: "venus" },
  { num: "๗", th: "เสาร์", key: "saturn" },
  { num: "๘", th: "ราหู", key: "rahu" },
  { num: "๙", th: "เกตุ", key: "ketu" },
  { num: "๐", th: "มฤตยู", key: "uranus" },
];

const THAI_DAYS = [
  { day: "อาทิตย์", planet: "๑", color: "แดง" },
  { day: "จันทร์", planet: "๒", color: "เหลือง" },
  { day: "อังคาร", planet: "๓", color: "ชมพู" },
  { day: "พุธ", planet: "๔", color: "เขียว" },
  { day: "พฤหัสบดี", planet: "๕", color: "ส้ม" },
  { day: "ศุกร์", planet: "๖", color: "ฟ้า" },
  { day: "เสาร์", planet: "๗", color: "ม่วง" },
];

export function thaiChartExact(input: NatalInput) {
  const timeKnown = !!input.time;
  const when = localToUtc(input.date, input.time || "12:00", input.tz);
  const ay = ayanamsa(when);
  const sid = (tropical: number) => norm(tropical - ay);
  const node = meanNode(when);

  const planets = THAI_PLANETS.map((p) => {
    const tropical = p.key === "rahu" ? node : p.key === "ketu" ? norm(node + 180) : tropicalLongitude(p.key, when);
    const lon = sid(tropical);
    return { num: p.num, th: p.th, lon, rasi: signOf(lon), rasiTh: ZODIAC[signOf(lon)].th, degree: formatDeg(lon) };
  });

  const placeKnown = typeof input.lat === "number" && typeof input.lon === "number";
  const lagna = timeKnown && placeKnown ? sid(angles(when, input.lat!, input.lon!).asc) : null;

  // weekday of birth in local civil time; Wednesday 18:00–05:59 is ruled by Rahu (๘)
  const [y, m, d] = input.date.split("-").map(Number);
  const dow = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  const hour = input.time ? Number(input.time.slice(0, 2)) : null;
  const wedNight = dow === 3 && hour !== null && (hour >= 18 || hour < 6);
  const birthDay = wedNight ? { day: "พุธกลางคืน", planet: "๘", color: "เทาดำ" } : THAI_DAYS[dow];

  return {
    utc: when.toISOString(),
    ayanamsa: Math.round(ay * 1000) / 1000,
    planets,
    lagna: lagna === null ? null : { lon: lagna, rasi: signOf(lagna), rasiTh: ZODIAC[signOf(lagna)].th, degree: formatDeg(lagna) },
    birthDay,
    sunRasi: planets[0].rasi,
    sunRasiTh: planets[0].rasiTh,
  };
}

/* ---------------------------------------------------------- BaZi (exact) */

const STEMS = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"];
const BRANCHES = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];
const STEM_TH = ["ไม้หยาง", "ไม้หยิน", "ไฟหยาง", "ไฟหยิน", "ดินหยาง", "ดินหยิน", "ทองหยาง", "ทองหยิน", "น้ำหยาง", "น้ำหยิน"];
const STEM_ELEMENT = ["ไม้", "ไม้", "ไฟ", "ไฟ", "ดิน", "ดิน", "ทอง", "ทอง", "น้ำ", "น้ำ"];
const BRANCH_ELEMENT = ["น้ำ", "ดิน", "ไม้", "ไม้", "ดิน", "ไฟ", "ไฟ", "ดิน", "ทอง", "ทอง", "ดิน", "น้ำ"];
const ANIMALS = ["ชวด (หนู)", "ฉลู (วัว)", "ขาล (เสือ)", "เถาะ (กระต่าย)", "มะโรง (มังกร)", "มะเส็ง (งู)", "มะเมีย (ม้า)", "มะแม (แพะ)", "วอก (ลิง)", "ระกา (ไก่)", "จอ (สุนัข)", "กุน (หมู)"];

function jdn(y: number, m: number, d: number) {
  const a = Math.floor((14 - m) / 12);
  const yy = y + 4800 - a;
  const mm = m + 12 * a - 3;
  return d + Math.floor((153 * mm + 2) / 5) + 365 * yy + Math.floor(yy / 4) - Math.floor(yy / 100) + Math.floor(yy / 400) - 32045;
}

export function baziExact(input: NatalInput) {
  const timeKnown = !!input.time;
  const when = localToUtc(input.date, input.time || "12:00", input.tz);
  const [y] = input.date.split("-").map(Number);

  // year changes at 立春 (Sun at 315°), month changes at every 节 (Sun at 315° + 30°·k)
  const lichun = A.SearchSunLongitude(315, new Date(Date.UTC(y, 0, 20)), 40)!.date;
  const solarYear = when < lichun ? y - 1 : y;
  const ys = (((solarYear - 4) % 10) + 10) % 10;
  const yb = (((solarYear - 4) % 12) + 12) % 12;

  const sunLon = A.SunPosition(when).elon;
  const monthsFromYin = Math.floor(norm(sunLon - 315) / 30); // 0 = 寅
  const mb = (monthsFromYin + 2) % 12;
  const ms = (((ys % 5) * 2 + 2 + monthsFromYin) % 10 + 10) % 10;

  // day & hour use local mean solar time at the birthplace (traditional practice)
  const lon = typeof input.lon === "number" ? input.lon : null;
  const solar = lon === null ? null : new Date(when.getTime() + (lon / 15) * 3600000);
  // without a birthplace fall back to the civil clock time (fields read as UTC)
  const [cy, cm, cd] = input.date.split("-").map(Number);
  const [ch, cmin] = (input.time || "12:00").split(":").map(Number);
  const local = solar ?? new Date(Date.UTC(cy, cm - 1, cd, ch, cmin));
  const dayIndex = (jdn(local.getUTCFullYear(), local.getUTCMonth() + 1, local.getUTCDate()) + 49) % 60;
  const ds = dayIndex % 10;
  const db = dayIndex % 12;

  const mk = (label: string, s: number, b: number) => ({ label, stem: STEMS[s], branch: BRANCHES[b], stemTh: STEM_TH[s], element: STEM_ELEMENT[s], animal: ANIMALS[b] });
  const pillars = [mk("ปี", ys, yb), mk("เดือน", ms, mb), mk("วัน", ds, db)];
  if (timeKnown) {
    const h = local.getUTCHours() + local.getUTCMinutes() / 60;
    const hb = Math.floor((h + 1) / 2) % 12;
    const hs = ((ds % 5) * 2 + hb) % 10;
    pillars.push(mk("ยาม", hs, hb));
  }
  const balance: Record<string, number> = { ไม้: 0, ไฟ: 0, ดิน: 0, ทอง: 0, น้ำ: 0 };
  for (const p of pillars) {
    balance[p.element] += 1;
    balance[BRANCH_ELEMENT[BRANCHES.indexOf(p.branch)]] += 1;
  }
  const solarTime = solar ? `${String(solar.getUTCHours()).padStart(2, "0")}:${String(solar.getUTCMinutes()).padStart(2, "0")}` : null;
  return { utc: when.toISOString(), lichun: lichun.toISOString(), solarTime, pillars, dayMaster: `${STEMS[ds]} ${STEM_TH[ds]}`, dayMasterElement: STEM_ELEMENT[ds], balance };
}
