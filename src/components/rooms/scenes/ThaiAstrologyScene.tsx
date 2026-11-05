"use client";

import { useState } from "react";
import { thaiChart, ZODIAC } from "@/lib/engines";
import { useShareReading } from "../RoomContext";
import { Field } from "./AstrologyScene";

// Demo placements: house index (0 = เมษ) → planets (Thai numerals). Real positions come from the Thai calc engine (Phase 2).
const DEMO_PLACEMENTS: Record<number, string[]> = { 0: ["ล"], 2: ["๑", "๔"], 4: ["๕"], 6: ["๗"], 7: ["๒"], 9: ["๓", "๘"], 10: ["๖"], 11: ["๙", "๐"] };
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
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const share = useShareReading();
  const chart = date ? thaiChart(date, time || undefined) : null;
  // engine-computed ๑ (sun) and ลัคนา replace the demo positions; other planets stay illustrative
  const placements: Record<number, string[]> = {};
  for (const [k, v] of Object.entries(DEMO_PLACEMENTS)) placements[Number(k)] = v.filter((p) => !chart || (p !== "๑" && (p !== "ล" || chart.lagna === null)));
  if (chart) {
    (placements[chart.sunRasi] ??= []).push("๑");
    if (chart.lagna !== null) (placements[chart.lagna] ??= []).unshift("ล");
  }
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
                    x={120 + Math.cos(am) * (62 - j * 0) + (j - (planets.length - 1) / 2) * 11 * -Math.sin(am)}
                    y={120 + Math.sin(am) * 62 + (j - (planets.length - 1) / 2) * 11 * Math.cos(am)}
                    fontSize="13"
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
          <text x="120" y="130" fontSize="7" textAnchor="middle" fill="#f2c35b" fillOpacity=".6">DEMO</text>
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
        <p className="mt-4 min-h-[3rem] text-sm text-ivory/85">{PLANETS[focus]}</p>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <Field label="วันเกิด"><input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="astra-input" /></Field>
          <Field label="เวลาเกิด"><input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="astra-input" /></Field>
        </div>
        {chart && (
          <div className="mt-3 space-y-1 rounded-xl bg-black/30 p-3 text-sm">
            <p>เกิดวัน<span className="text-gold-bright">{chart.birthDay.day}</span> · ดาวประจำวัน {chart.birthDay.planet} · สีประจำวัน{chart.birthDay.color}</p>
            <p>อาทิตย์สถิตราศี<span className="text-gold-bright">{chart.sunRasiTh}</span>{chart.lagnaTh && <> · ลัคนาราศี<span className="text-gold-bright">{chart.lagnaTh}</span></>}</p>
            <button type="button" onClick={() => share({ room: "thai-astrology", title: `ดวงไทย ลัคนา${chart.lagnaTh ?? "(ไม่ทราบเวลา)"}`, summary: `เกิดวัน${chart.birthDay.day} · อาทิตย์ราศี${chart.sunRasiTh}${chart.lagnaTh ? ` · ลัคนาราศี${chart.lagnaTh}` : ""}`, facts: { birthDate: date, birthTime: time || null, ...chart } })} className="mt-2 w-full rounded-full bg-gradient-to-b from-gold-bright to-gold-deep py-2 text-sm text-void transition hover:brightness-110">✦ ส่งผังดวงให้หมอดูอ่าน</button>
          </div>
        )}
        <p className="mt-4 text-xs text-mist/70">ตำแหน่งอาทิตย์และลัคนาคำนวณจากวันเวลาเกิด (สูตรประมาณ ลัคนาเลื่อน 1 ราศีทุก ~2 ชม.) · ดาวอื่นเป็นข้อมูลตัวอย่างจนกว่าจะเชื่อม engine สมผุสดาวเต็มรูปแบบ</p>
      </div>
    </div>
  );
}
