"use client";

import { useEffect, useMemo, useState } from "react";
import { ZODIAC } from "@/lib/engines";
import { thaiChartExact } from "@/lib/engines/astro";
import { thaiChartBoth, type ThaiMethod } from "@/lib/engines/thai-methods";
import BoundaryNote from "../birth/BoundaryNote";
import BirthDataForm, { birthInput, useBirthData } from "../birth/BirthDataForm";
import { useShareReading } from "../RoomContext";

const PLANETS: Record<string, string> = {
  "๑": "อาทิตย์ — อำนาจ เกียรติยศ",
  "๒": "จันทร์ — จิตใจ ความรู้สึก",
  "๓": "อังคาร — ความกล้า การต่อสู้",
  "๔": "พุธ — การสื่อสาร สติปัญญา",
  "๕": "พฤหัสบดี — ครู ความรู้ โชค",
  "๖": "ศุกร์ — ความรัก ความงาม ทรัพย์",
  "๗": "เสาร์ — ความอดทน อุปสรรค",
  "๘": "ราหู — ความทะเยอทะยาน สิ่งลวงตา",
  "๙": "เกตุ — ญาณ สิ่งศักดิ์สิทธิ์",
  "๐": "มฤตยู — ความเปลี่ยนแปลงฉับพลัน",
  "ล": "ลัคนา — ตัวตน จุดเริ่มต้นของดวง",
};

export default function ThaiAstrologyScene({ glow }: { glow: string }) {
  const [focus, setFocus] = useState<string>("ล");
  const [birth, setBirth] = useBirthData();
  const share = useShareReading();
  const place = birthInput(birth);
  const [method, setMethodState] = useState<ThaiMethod>("suriyayatra");
  useEffect(() => {
    try {
      const saved = localStorage.getItem("astra.thaiMethod");
      // eslint-disable-next-line react-hooks/set-state-in-effect -- remembered choice, read after hydration
      if (saved === "astronomical") setMethodState(saved);
    } catch {}
  }, []);
  const setMethod = (m: ThaiMethod) => {
    setMethodState(m);
    try {
      localStorage.setItem("astra.thaiMethod", m);
    } catch {}
  };
  // birthday facts (weekday, day planet) come from the civil date and are method-independent
  const base = useMemo(() => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(birth.date)) return null;
    try {
      const input = { date: birth.date, time: birth.time || undefined, lat: place.lat, lon: place.lon, tz: place.tz, placeId: birth.placeId };
      return { exact: thaiChartExact(input), both: thaiChartBoth(input) };
    } catch {
      return null;
    }
  }, [birth.date, birth.time, birth.placeId, place.lat, place.lon, place.tz]);
  const chart = base ? { ...base.both[method], birthDay: base.exact.birthDay, utc: base.exact.utc, ayanamsa: base.exact.ayanamsa, sunRasiTh: base.both[method].planets[0].rasiTh } : null;
  const other = base ? base.both[method === "suriyayatra" ? "astronomical" : "suriyayatra"] : null;
  // rasi index (0 = เมษ) → planets standing in it, from the sidereal ephemeris
  const placements: Record<number, string[]> = {};
  if (chart) {
    if (chart.lagna) placements[chart.lagna.rasi] = ["ล"];
    for (const p of chart.planets) (placements[p.rasi] ??= []).push(p.num);
  }
  const focusPlanet = chart?.planets.find((p) => p.num === focus);
  return (
    <div className="grid items-center gap-8 md:grid-cols-[1.2fr_1fr]">
      <div className="relative mx-auto aspect-square w-full max-w-[420px]">
        <svg viewBox="0 0 240 240" className="h-full w-full" aria-label="ผังดวงแบบไทย">
          {/* kanok-like ornamental ring */}
          <g className="animate-spin-slower" style={{ transformOrigin: "120px 120px" }}>
            {Array.from({ length: 36 }, (_, i) => (
              <path key={i} d="M120 4 Q126 12 120 18 Q114 12 120 4 Z" fill={glow} opacity=".5" transform={`rotate(${i * 10} 120 120)`} />
            ))}
          </g>
          <circle cx="120" cy="120" r="98" fill="#1a0803" stroke={glow} strokeWidth="1.5" />
          <circle cx="120" cy="120" r="40" fill="none" stroke={glow} strokeOpacity=".6" />
          {ZODIAC.map((z, i) => {
            // Thai charts run counter-clockwise from เมษ at the top
            const a0 = -Math.PI / 2 - (i / 12) * Math.PI * 2 + Math.PI / 12;
            const am = a0 - Math.PI / 12;
            const planets = placements[i] ?? [];
            return (
              <g key={z.key}>
                <line x1={120 + Math.cos(a0) * 40} y1={120 + Math.sin(a0) * 40} x2={120 + Math.cos(a0) * 98} y2={120 + Math.sin(a0) * 98} stroke={glow} strokeOpacity=".45" />
                <text x={120 + Math.cos(am) * 86} y={120 + Math.sin(am) * 86} fontSize="7.5" fill="#f2c35b" fillOpacity=".75" textAnchor="middle" dominantBaseline="central">
                  {z.th}
                </text>
                {planets.map((p, j) => (
                  <text
                    key={p}
                    x={120 + Math.cos(am) * (planets.length > 3 && j >= 3 ? 52 : 66) + ((j % 3) - (Math.min(planets.length, 3) - 1) / 2) * 10 * -Math.sin(am)}
                    y={120 + Math.sin(am) * (planets.length > 3 && j >= 3 ? 52 : 66) + ((j % 3) - (Math.min(planets.length, 3) - 1) / 2) * 10 * Math.cos(am)}
                    fontSize={planets.length > 3 ? 10.5 : 13}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fill={focus === p ? "#fff" : "#f7e1a6"}
                    className="cursor-pointer"
                    style={{ filter: focus === p ? `drop-shadow(0 0 6px ${glow})` : undefined }}
                    onClick={() => setFocus(p)}
                  >
                    {p}
                  </text>
                ))}
              </g>
            );
          })}
          <text x="120" y="114" fontSize="10" textAnchor="middle" fill="#f2c35b">ราศีจักร</text>
          {!chart && <text x="120" y="130" fontSize="7" textAnchor="middle" fill="#f2c35b" fillOpacity=".6">กรอกวันเกิด</text>}
        </svg>
      </div>

      <div className="glass frame-gold rounded-2xl p-5">
        <p className="font-display text-sm tracking-[0.2em] text-gold">ดาวพระเคราะห์</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {Object.keys(PLANETS).map((p) => (
            <button key={p} type="button" onClick={() => setFocus(p)} className={`h-9 w-9 rounded-full border text-lg transition ${focus === p ? "border-gold bg-gold/20 text-white" : "border-white/15 text-gold-bright hover:border-gold/60"}`}>
              {p}
            </button>
          ))}
        </div>
        <p className="mt-4 min-h-[3rem] text-sm text-ivory/85">
          {PLANETS[focus]}
          {focus === "ล" && chart?.lagna && <span className="block text-gold-bright">สถิตราศี{chart.lagna.rasiTh} {chart.lagna.degree}</span>}
          {focusPlanet && <span className="block text-gold-bright">สถิตราศี{focusPlanet.rasiTh} {focusPlanet.degree}</span>}
        </p>
        <div className="mt-4 flex gap-1.5 text-xs" role="radiogroup" aria-label="วิธีคำนวณ">
          {(
            [
              ["suriyayatra", "สุริยยาตร์ (ตำราไทย)"],
              ["astronomical", "ดาราศาสตร์ (นิรายนะ)"],
            ] as const
          ).map(([m, label]) => (
            <button key={m} type="button" role="radio" aria-checked={method === m} onClick={() => setMethod(m)} className={`flex-1 rounded-full px-3 py-1.5 transition ${method === m ? "bg-gold text-void" : "border border-white/15 text-ivory/70 hover:text-ivory"}`}>
              {label}
            </button>
          ))}
        </div>
        <p className="mt-1.5 text-[11px] text-mist/60">
          {method === "suriyayatra" ? "ตามคัมภีร์สุริยยาตร์ แบบที่โหรและเว็บผูกดวงไทยส่วนใหญ่ใช้" : "ตำแหน่งดาวจริงบนท้องฟ้า แปลงเป็นนิรายนะด้วยอายนางศ์ลาหิรี"}
        </p>
        <div className="mt-4">
          <BirthDataForm value={birth} onChange={setBirth} needsTime="ใช้หาลัคนา" />
        </div>
        {chart && (
          <div className="mt-3 space-y-2 rounded-xl bg-black/30 p-3 text-sm">
            <p>เกิดวัน<span className="text-gold-bright">{chart.birthDay.day}</span> · ดาวประจำวัน {chart.birthDay.planet} · สีประจำวัน{chart.birthDay.color}</p>
            <p>
              ลัคนาสถิตราศี<span className="text-gold-bright">{chart.lagna ? `${chart.lagna.rasiTh} ${chart.lagna.degree}` : "— (ต้องมีเวลาเกิด)"}</span> · อาทิตย์สถิตราศี<span className="text-gold-bright">{chart.sunRasiTh}</span>
            </p>
            {other?.lagna && chart.lagna && (
              <p className="text-[11px] text-ivory/60">
                เทียบวิธี{method === "suriyayatra" ? "ดาราศาสตร์" : "สุริยยาตร์"}: ลัคนา{other.lagna.rasiTh} {other.lagna.degree}
                {other.lagna.rasi !== chart.lagna.rasi && " — ต่างราศีกัน"}
              </p>
            )}
            {chart.boundary && <BoundaryNote b={chart.boundary} rasiTh={chart.lagna?.rasiTh ?? ""} />}
            <p className="text-xs leading-relaxed text-ivory/70">{chart.planets.map((p) => `${p.num} ${p.rasiTh}`).join(" · ")}</p>
            <button
              type="button"
              onClick={() =>
                share({
                  room: "thai-astrology",
                  title: `ดวงไทย (${method === "suriyayatra" ? "สุริยยาตร์" : "ดาราศาสตร์"}) ลัคนา${chart.lagna?.rasiTh ?? "(ไม่ทราบเวลาเกิด)"} · เกิดวัน${chart.birthDay.day}`,
                  summary: `ลัคนา${chart.lagna ? `ราศี${chart.lagna.rasiTh}` : " ไม่ทราบ"} · ${chart.planets.map((p) => `${p.th}(${p.num}) ราศี${p.rasiTh}`).join(" · ")}`,
                  facts: {
                    birth: { date: birth.date, time: birth.time || "unknown", place: place.placeName, utc: chart.utc },
                    method: method === "suriyayatra" ? "Thai Suriyayatra (classical treatise)" : `astronomical sidereal (Lahiri ayanamsa ${chart.ayanamsa}°)`,
                    lagna: chart.lagna && { rasi: chart.lagna.rasiTh, degree: chart.lagna.degree },
                    lagnaOtherMethod: other?.lagna && { method: method === "suriyayatra" ? "astronomical" : "suriyayatra", rasi: other.lagna.rasiTh, degree: other.lagna.degree },
                    lagnaBoundary: chart.boundary && { minutesEarlierToChange: chart.boundary.earlier?.minutes ?? null, earlierRasi: chart.boundary.earlier?.rasiTh ?? null, minutesLaterToChange: chart.boundary.later?.minutes ?? null, laterRasi: chart.boundary.later?.rasiTh ?? null },
                    planets: chart.planets.map((p) => ({ planet: `${p.num} ${p.th}`, rasi: p.rasiTh, degree: p.degree })),
                    birthDay: chart.birthDay,
                  },
                })
              }
              className="mt-1 w-full rounded-full bg-gradient-to-b from-gold-bright to-gold-deep py-2 text-sm text-void transition hover:brightness-110"
            >
              ✦ ส่งผังดวงให้โหรอ่าน
            </button>
          </div>
        )}
        <p className="mt-4 text-[11px] text-mist/70">
          {method === "suriyayatra"
            ? "สุริยยาตร์: ลัคนาจากสมผุสอาทิตย์และอันโตนาทีตามตำรา ใช้เวลาอาทิตย์ขึ้นของจังหวัดเกิด · ตำแหน่งดาวตามสูตรคัมภีร์ จึงต่างจากท้องฟ้าจริงได้บ้าง (โดยเฉพาะพุธ) · คำนวณด้วยไลบรารีโอเพนซอร์ส thai-astrology"
            : `ดาราศาสตร์: ตำแหน่งดาวจริงแบบนิรายนะ (อายนางศ์ลาหิรี ≈ ${chart?.ayanamsa.toFixed(2) ?? "24.2"}°) · ราหูใช้จุดโหนดเฉลี่ย · เกตุเป็นโหนดใต้ ซึ่งต่างจากเกตุตามสูตรไทย`}
        </p>
      </div>
    </div>
  );
}
