"use client";

import { useMemo, useState } from "react";
import { ZODIAC } from "@/lib/engines";
import { thaiChartExact } from "@/lib/engines/astro";
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
  const chart = useMemo(() => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(birth.date)) return null;
    try {
      return thaiChartExact({ date: birth.date, time: birth.time || undefined, lat: place.lat, lon: place.lon, tz: place.tz });
    } catch {
      return null;
    }
  }, [birth.date, birth.time, place.lat, place.lon, place.tz]);
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
        <div className="mt-4">
          <BirthDataForm value={birth} onChange={setBirth} needsTime="ใช้หาลัคนา" />
        </div>
        {chart && (
          <div className="mt-3 space-y-2 rounded-xl bg-black/30 p-3 text-sm">
            <p>เกิดวัน<span className="text-gold-bright">{chart.birthDay.day}</span> · ดาวประจำวัน {chart.birthDay.planet} · สีประจำวัน{chart.birthDay.color}</p>
            <p>ลัคนาสถิตราศี<span className="text-gold-bright">{chart.lagna?.rasiTh ?? "— (ต้องมีเวลาเกิด)"}</span> · อาทิตย์สถิตราศี<span className="text-gold-bright">{chart.sunRasiTh}</span></p>
            <p className="text-xs leading-relaxed text-ivory/70">{chart.planets.map((p) => `${p.num} ${p.rasiTh}`).join(" · ")}</p>
            <button
              type="button"
              onClick={() =>
                share({
                  room: "thai-astrology",
                  title: `ดวงไทย ลัคนา${chart.lagna?.rasiTh ?? "(ไม่ทราบเวลาเกิด)"} · เกิดวัน${chart.birthDay.day}`,
                  summary: `ลัคนา${chart.lagna ? `ราศี${chart.lagna.rasiTh}` : " ไม่ทราบ"} · ${chart.planets.map((p) => `${p.th}(${p.num}) ราศี${p.rasiTh}`).join(" · ")}`,
                  facts: {
                    birth: { date: birth.date, time: birth.time || "unknown", place: place.placeName, utc: chart.utc },
                    system: `sidereal (Lahiri ayanamsa ${chart.ayanamsa}°), Rahu = mean node, Ketu = opposite node`,
                    lagna: chart.lagna && { rasi: chart.lagna.rasiTh, degree: chart.lagna.degree },
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
        <p className="mt-4 text-[11px] text-mist/70">คำนวณสมผุสดาวจากตำแหน่งดาวจริงแบบนิรายนะ (อายนางศ์ลาหิรี ≈ {chart?.ayanamsa.toFixed(2) ?? "24.2"}°) · ราหูใช้จุดโหนดเฉลี่ย · เกตุคำนวณเป็นโหนดใต้ ซึ่งต่างจากสูตรเกตุแบบไทยดั้งเดิม</p>
      </div>
    </div>
  );
}
