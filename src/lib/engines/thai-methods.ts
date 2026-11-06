/**
 * Thai chart in two methods + "how close is the ascendant to the next sign".
 *
 *  - "suriyayatra": the classical Thai treatise (คัมภีร์สุริยยาตร์) as used by Thai
 *    astrologers and sites such as myhora — via the MIT library `thai-astrology`
 *    (ascendant from the birth Sun + traditional rising-time tables, provincial
 *    sunrise / local-time correction, classical planetary arithmetic).
 *  - "astronomical": the true sky (astronomy-engine) converted to sidereal with the
 *    Lahiri ayanamsa — see ./astro.ts.
 *
 * Classical positions intentionally differ from the true sky (a few degrees for
 * the ascendant, up to ~10° for Mercury); both are reported so the reading can say which.
 */
import { calculateThaiHoroscope } from "thai-astrology";
import { getPlace } from "@/lib/data/places";
import { ZODIAC } from "./index";
import { angles, ayanamsa, formatDeg, localToUtc, thaiChartExact, type NatalInput } from "./astro";

export type ThaiMethod = "suriyayatra" | "astronomical";

export interface ThaiPoint {
  num: string; // ๑…๙, ๐
  th: string;
  lon: number; // sidereal degrees
  rasi: number; // 0 = เมษ
  rasiTh: string;
  degree: string;
}

export interface ThaiChartResult {
  method: ThaiMethod;
  planets: ThaiPoint[];
  lagna: { lon: number; rasi: number; rasiTh: string; degree: string } | null;
}

const ORDER: { num: string; th: string; key: string }[] = [
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

const norm = (d: number) => ((d % 360) + 360) % 360;
const point = (num: string, th: string, lon: number): ThaiPoint => ({ num, th, lon: norm(lon), rasi: Math.floor(norm(lon) / 30), rasiTh: ZODIAC[Math.floor(norm(lon) / 30)].th, degree: formatDeg(lon) });

export interface ThaiInput extends NatalInput {
  placeId?: string;
}

function tzOffsetHours(input: ThaiInput) {
  const utc = localToUtc(input.date, input.time || "12:00", input.tz);
  const [y, m, d] = input.date.split("-").map(Number);
  const [hh, mm] = (input.time || "12:00").split(":").map(Number);
  return (Date.UTC(y, m - 1, d, hh, mm) - utc.getTime()) / 3600000;
}

/** Classical Suriyayatra chart. Thai provinces use the library's provincial seat tables; elsewhere coordinate sunrise. */
export function suriyayatraChart(input: ThaiInput, shiftMinutes = 0): ThaiChartResult {
  const [y, m, d] = input.date.split("-").map(Number);
  const [hh, mm] = (input.time || "12:00").split(":").map(Number);
  // apply a clock shift (used by the boundary search) with day carry
  const shifted = new Date(Date.UTC(y, m - 1, d, hh, mm + shiftMinutes));
  const date = { year: shifted.getUTCFullYear(), era: "CE" as const, month: shifted.getUTCMonth() + 1, day: shifted.getUTCDate() };
  const time = { hour: shifted.getUTCHours(), minute: shifted.getUTCMinutes() };
  const place = input.placeId ? getPlace(input.placeId) : undefined;
  const h =
    place?.kind === "province"
      ? calculateThaiHoroscope({ date, time, location: { province: place.name } })
      : calculateThaiHoroscope({
          date,
          time,
          ascendantReference: { method: "sunrise", latitude: input.lat ?? 13.756, longitude: input.lon ?? 100.502, utcOffsetHours: tzOffsetHours(input) },
        });
  const pts = h.points as unknown as Record<string, { longitudeDegrees: number }>;
  return {
    method: "suriyayatra",
    planets: ORDER.map((o) => point(o.num, o.th, pts[o.key].longitudeDegrees)),
    lagna: input.time ? (() => { const l = point("ล", "ลัคนา", pts.ascendant.longitudeDegrees); return { lon: l.lon, rasi: l.rasi, rasiTh: l.rasiTh, degree: l.degree }; })() : null,
  };
}

export function astronomicalChart(input: ThaiInput): ThaiChartResult {
  const c = thaiChartExact(input);
  return { method: "astronomical", planets: c.planets, lagna: c.lagna };
}

export interface BoundaryInfo {
  degIntoSign: number; // how far past the sign's start
  degToNext: number;
  earlier: { minutes: number; rasiTh: string } | null; // birth this much earlier → previous sign
  later: { minutes: number; rasiTh: string } | null; // birth this much later → next sign
  near: boolean; // a change within NEAR_MINUTES either way
}
const NEAR_MINUTES = 20;

/**
 * How many minutes of birth-time error would move the ascendant into another sign.
 * `lagnaAt(shift)` returns the ascendant longitude for the birth time shifted by `shift` minutes.
 */
export function lagnaBoundary(lagnaAt: (shiftMinutes: number) => number | null, limit = 150): BoundaryInfo | null {
  const l0 = lagnaAt(0);
  if (l0 === null) return null;
  const sign0 = Math.floor(norm(l0) / 30);
  const scan = (dir: -1 | 1) => {
    for (let k = 1; k <= limit; k++) {
      const l = lagnaAt(dir * k);
      if (l === null) return null;
      const s = Math.floor(norm(l) / 30);
      if (s !== sign0) return { minutes: k, rasiTh: ZODIAC[s].th };
    }
    return null;
  };
  const earlier = scan(-1);
  const later = scan(1);
  const into = norm(l0) % 30;
  return { degIntoSign: into, degToNext: 30 - into, earlier, later, near: (earlier?.minutes ?? 999) <= NEAR_MINUTES || (later?.minutes ?? 999) <= NEAR_MINUTES };
}

/** Both methods side by side, with boundary analysis for each ascendant. */
export function thaiChartBoth(input: ThaiInput) {
  const sur = suriyayatraChart(input);
  const ast = astronomicalChart(input);
  const hasAsc = !!input.time && typeof input.lat === "number" && typeof input.lon === "number";
  const surBoundary = hasAsc ? lagnaBoundary((s) => suriyayatraChart(input, s).lagna?.lon ?? null) : null;
  const astBoundary = hasAsc
    ? lagnaBoundary((s) => {
        const when = new Date(localToUtc(input.date, input.time!, input.tz).getTime() + s * 60000);
        return norm(angles(when, input.lat!, input.lon!).asc - ayanamsa(when));
      })
    : null;
  return { suriyayatra: { ...sur, boundary: surBoundary }, astronomical: { ...ast, boundary: astBoundary } };
}

/** Boundary analysis for the tropical (Western) Ascendant. */
export function tropicalAscBoundary(input: NatalInput) {
  if (!input.time || typeof input.lat !== "number" || typeof input.lon !== "number") return null;
  const t0 = localToUtc(input.date, input.time, input.tz).getTime();
  return lagnaBoundary((s) => angles(new Date(t0 + s * 60000), input.lat!, input.lon!).asc);
}
