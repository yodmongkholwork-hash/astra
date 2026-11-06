// Independent checks of the ASTRA astronomy engine.
import * as A from "astronomy-engine";
import { thaiChartBoth, suriyayatraChart } from "../src/lib/engines/thai-methods";
import { angles, baziExact, localToUtc, natalChart, thaiChartExact, tropicalLongitude, ayanamsa } from "../src/lib/engines/astro";

let fails = 0;
const ok = (name: string, cond: boolean, detail: string) => { console.log(`${cond ? "PASS" : "FAIL"} ${name} — ${detail}`); if (!cond) fails++; };
const diff = (a: number, b: number) => Math.abs(((a - b + 540) % 360) - 180);

// 1. Time zone conversion
ok("Bangkok local→UTC", localToUtc("1990-07-15", "08:30", "Asia/Bangkok").toISOString() === "1990-07-15T01:30:00.000Z", localToUtc("1990-07-15", "08:30", "Asia/Bangkok").toISOString());
ok("New York DST local→UTC", localToUtc("2024-07-04", "12:00", "America/New_York").toISOString() === "2024-07-04T16:00:00.000Z", localToUtc("2024-07-04", "12:00", "America/New_York").toISOString());
ok("New York winter local→UTC", localToUtc("2024-01-04", "12:00", "America/New_York").toISOString() === "2024-01-04T17:00:00.000Z", "");

// 2. Ascendant equals the Sun's longitude at sunrise; MC equals it at local noon (Sun transit)
for (const [name, lat, lon, day] of [["Bangkok", 13.756, 100.502, "2024-03-01"], ["London", 51.507, -0.128, "2024-06-21"], ["Sydney", -33.869, 151.209, "2024-12-10"]] as const) {
  const obs = new A.Observer(lat, lon, 0);
  const rise = A.SearchAltitude(A.Body.Sun, obs, +1, new Date(new Date(day + "T00:00:00Z").getTime() - (lon / 15) * 3600000), 2, 0)!.date; // Sun centre geometrically on the horizon
  const sun = A.SunPosition(rise).elon;
  const asc = angles(rise, lat, lon).asc;
  ok(`ASC = Sun when it crosses the horizon (${name})`, diff(asc, sun) < 0.1, `asc ${asc.toFixed(3)} sun ${sun.toFixed(3)} Δ ${diff(asc, sun).toFixed(3)}°`);
  const noon = A.SearchHourAngle(A.Body.Sun, obs, 0, rise).time.date;
  const mc = angles(noon, lat, lon).mc;
  ok(`MC = Sun at local noon (${name})`, diff(mc, A.SunPosition(noon).elon) < 0.05, `Δ ${diff(mc, A.SunPosition(noon).elon).toFixed(3)}°`);
}

// 3. Known reference positions (astronomical almanac values, geocentric ecliptic of date)
// 2000-01-01 12:00 TT: Sun 280.46°, Moon ~223.3°, Mars ~327.9°, Jupiter ~25.3°, Saturn ~40.4°
const j2000 = new Date("2000-01-01T12:00:00Z");
for (const [k, ref, tol] of [["sun", 280.37, 0.2], ["moon", 223.3, 1], ["mars", 327.9, 1], ["jupiter", 25.2, 1], ["saturn", 40.4, 1]] as const) {
  const v = tropicalLongitude(k, j2000);
  ok(`${k} @J2000`, diff(v, ref) < tol, `${v.toFixed(2)}° vs ref ${ref}°`);
}
// Venus greatest-brilliance era check: 2020-06-03 inferior conjunction → Venus ≈ Sun longitude
const ic = new Date("2020-06-03T18:00:00Z");
ok("Venus inferior conjunction 2020-06-03", diff(tropicalLongitude("venus", ic), tropicalLongitude("sun", ic)) < 1, `Δ ${diff(tropicalLongitude("venus", ic), tropicalLongitude("sun", ic)).toFixed(2)}°`);
// retrograde detection: Mercury retrograde 2024-04-05
const ch = natalChart({ date: "2024-04-10", time: "12:00", tz: "UTC", lat: 0, lon: 0 });
ok("Mercury retrograde flagged (2024-04-10)", ch.planets.find((p) => p.key === "mercury")!.retrograde === true, "");
ok("Jupiter direct (2024-04-10)", ch.planets.find((p) => p.key === "jupiter")!.retrograde === false, "");

// 4. Ayanamsa (Lahiri) ≈ 24.1° in 2024
ok("Lahiri ayanamsa 2024", Math.abs(ayanamsa(new Date("2024-01-01T00:00:00Z")) - 24.19) < 0.05, ayanamsa(new Date("2024-01-01T00:00:00Z")).toFixed(3));
// Thai sun rasi: Sun enters sidereal Aries (เมษ) around 13–14 April
const t1 = thaiChartExact({ date: "2024-04-12", time: "12:00", tz: "Asia/Bangkok" });
const t2 = thaiChartExact({ date: "2024-04-15", time: "12:00", tz: "Asia/Bangkok" });
ok("Thai Sun เข้าเมษ ~13 Apr (Songkran)", t1.sunRasiTh === "มีน" && t2.sunRasiTh === "เมษ", `${t1.sunRasiTh} → ${t2.sunRasiTh}`);
ok("Thai weekday 1990-07-15 = Sunday", t1 && thaiChartExact({ date: "1990-07-15", tz: "Asia/Bangkok" }).birthDay.day === "อาทิตย์", "");

// 5. BaZi with true solar terms
const b1 = baziExact({ date: "2024-02-04", time: "16:00", tz: "Asia/Shanghai", lon: 120 }); // before 立春 16:27 CST
const b2 = baziExact({ date: "2024-02-04", time: "17:00", tz: "Asia/Shanghai", lon: 120 });
ok("year pillar flips at 立春 2024 (癸卯 → 甲辰)", b1.pillars[0].stem + b1.pillars[0].branch === "癸卯" && b2.pillars[0].stem + b2.pillars[0].branch === "甲辰", `${b1.pillars[0].stem}${b1.pillars[0].branch} → ${b2.pillars[0].stem}${b2.pillars[0].branch}`);
ok("month pillar 2024-02-05 = 丙寅", b2.pillars[1].stem + b2.pillars[1].branch === "丙寅", b2.pillars[1].stem + b2.pillars[1].branch);
const b3 = baziExact({ date: "2000-01-01", time: "12:00", tz: "Asia/Shanghai", lon: 120 });
ok("day pillar 2000-01-01 = 戊午", b3.pillars[2].stem + b3.pillars[2].branch === "戊午", b3.pillars[2].stem + b3.pillars[2].branch);
ok("month pillar 2000-01-01 = 丙子", b3.pillars[1].stem + b3.pillars[1].branch === "丙子", b3.pillars[1].stem + b3.pillars[1].branch);
ok("year pillar 2000-01-01 = 己卯 (before 立春)", b3.pillars[0].stem + b3.pillars[0].branch === "己卯", b3.pillars[0].stem + b3.pillars[0].branch);
const b4 = baziExact({ date: "1984-02-10", time: "08:00", tz: "Asia/Bangkok", lon: 100.5 });
ok("1984 = 甲子 year", b4.pillars[0].stem + b4.pillars[0].branch === "甲子", b4.pillars[0].stem + b4.pillars[0].branch);
ok("Bangkok local solar time correction (−18 min)", b4.solarTime === "07:42", String(b4.solarTime));

// 6. Thai Suriyayatra (classical) vs astronomical, and ascendant boundary analysis
const yala = { date: "1997-09-02", time: "22:53", tz: "Asia/Bangkok", lat: 6.541, lon: 101.281, placeId: "yala" };
const both = thaiChartBoth(yala);
ok("Suriyayatra lagna 1997-09-02 22:53 Yala = เมษ (matches myhora)", both.suriyayatra.lagna?.rasiTh === "เมษ", `${both.suriyayatra.lagna?.rasiTh} ${both.suriyayatra.lagna?.degree}`);
ok("Astronomical lagna same chart = พฤษภ ~2°", both.astronomical.lagna?.rasiTh === "พฤษภ" && both.astronomical.lagna!.lon % 30 < 3, `${both.astronomical.lagna?.rasiTh} ${both.astronomical.lagna?.degree}`);
ok("Boundary: astronomical lagna becomes เมษ ~9 min earlier", both.astronomical.boundary?.earlier?.rasiTh === "เมษ" && Math.abs((both.astronomical.boundary?.earlier?.minutes ?? 0) - 9) <= 1 && both.astronomical.boundary!.near, JSON.stringify(both.astronomical.boundary?.earlier));
const cm = suriyayatraChart({ date: "2024-09-15", time: "08:30", tz: "Asia/Bangkok", lat: 18.788, lon: 98.985, placeId: "chiangmai" });
ok("Suriyayatra library example (2567-09-15 08:30 Chiang Mai): lagna กันย์, sun สิงห์", cm.lagna?.rasiTh === "กันย์" && cm.planets[0].rasiTh === "สิงห์", `${cm.lagna?.rasiTh}, ${cm.planets[0].rasiTh}`);

console.log(fails ? `\n${fails} FAILED` : "\nALL PASS");
process.exit(fails ? 1 : 0);
