"use client";

import { useState } from "react";
import { bazi, CHINESE_ANIMALS, FIVE_ELEMENTS } from "@/lib/engines";
import { useShareReading } from "../RoomContext";
import { Field } from "./AstrologyScene";

const STEMS_YIN = new Set(["乙", "丁", "己", "辛", "癸"]);
const ELEMENT_COLORS: Record<string, string> = { ไม้: "#3fbf8f", ไฟ: "#e05a4a", ดิน: "#c99a45", ทอง: "#d8dcef", น้ำ: "#5aa0ff" };

export default function ChineseAstrologyScene({ glow }: { glow: string }) {
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const share = useShareReading();
  const chart = /^\d{4}-\d{2}-\d{2}$/.test(date) ? bazi(date, time || undefined) : null;
  const yp = chart?.pillars[0];
  const result = yp ? { animal: yp.animal, element: yp.element, polarity: STEMS_YIN.has(yp.stem) ? "หยิน" : "หยาง" } : null;

  return (
    <div className="grid items-center gap-8 md:grid-cols-[1.2fr_1fr]">
      <div className="relative mx-auto aspect-square w-full max-w-[420px]">
        <svg viewBox="0 0 240 240" className="h-full w-full" aria-label="หยินหยาง ธาตุทั้งห้า และนักษัตร">
          {/* zodiac animal ring */}
          <g className="animate-spin-slower" style={{ transformOrigin: "120px 120px" }}>
            <circle cx="120" cy="120" r="114" fill="none" stroke={glow} strokeOpacity=".4" />
            {CHINESE_ANIMALS.map((a, i) => {
              const ang = (i / 12) * Math.PI * 2 - Math.PI / 2;
              const active = result?.animal === a;
              return (
                <text key={a} x={120 + Math.cos(ang) * 104} y={120 + Math.sin(ang) * 104} fontSize="8" textAnchor="middle" dominantBaseline="central" fill={active ? "#fff" : "#f4ead5"} fillOpacity={active ? 1 : 0.6} style={{ filter: active ? `drop-shadow(0 0 5px ${glow})` : undefined }}>
                  {a}
                </text>
              );
            })}
          </g>
          {/* five elements pentagon (generating cycle) */}
          {FIVE_ELEMENTS.map((e, i) => {
            const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
            const b = ((i + 1) / 5) * Math.PI * 2 - Math.PI / 2;
            const active = result?.element === e;
            return (
              <g key={e}>
                <line x1={120 + Math.cos(a) * 76} y1={120 + Math.sin(a) * 76} x2={120 + Math.cos(b) * 76} y2={120 + Math.sin(b) * 76} stroke={ELEMENT_COLORS[e]} strokeOpacity=".5" />
                <circle cx={120 + Math.cos(a) * 76} cy={120 + Math.sin(a) * 76} r={active ? 13 : 10} fill={ELEMENT_COLORS[e]} fillOpacity={active ? 0.9 : 0.25} stroke={ELEMENT_COLORS[e]} className="transition-all" />
                <text x={120 + Math.cos(a) * 76} y={120 + Math.sin(a) * 76} fontSize="7.5" textAnchor="middle" dominantBaseline="central" fill="#fff">
                  {e}
                </text>
              </g>
            );
          })}
          {/* yin yang */}
          <g className="animate-spin-slow [animation-duration:20s]" style={{ transformOrigin: "120px 120px" }}>
            <circle cx="120" cy="120" r="40" fill="#0b0b0b" stroke={glow} strokeWidth="1.2" />
            <path d="M120 80 A40 40 0 0 1 120 160 A20 20 0 0 1 120 120 A20 20 0 0 0 120 80 Z" fill="#f4ead5" />
            <circle cx="120" cy="100" r="6" fill="#0b0b0b" />
            <circle cx="120" cy="140" r="6" fill="#f4ead5" />
          </g>
        </svg>
      </div>

      <div className="glass frame-gold space-y-4 rounded-2xl p-5">
        <p className="font-display text-sm tracking-[0.2em] text-gold">BAZI · สี่เสาแห่งโชคชะตา</p>
        <div className="grid grid-cols-2 gap-3">
          <Field label="วันเกิด"><input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="astra-input" /></Field>
          <Field label="เวลาเกิด"><input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="astra-input" /></Field>
        </div>
        {chart && result ? (
          <>
            <div className="grid grid-cols-4 gap-2 text-center">
              {chart.pillars.map((p) => (
                <div key={p.label} className="rounded-xl border border-white/10 bg-black/30 px-1 py-2">
                  <p className="text-[10px] text-mist/70">{p.label}</p>
                  <p className="text-2xl leading-tight" style={{ color: ELEMENT_COLORS[p.element] }}>{p.stem}</p>
                  <p className="text-2xl leading-tight text-ivory">{p.branch}</p>
                  <p className="text-[10px] text-ivory/60">{p.animal}</p>
                </div>
              ))}
            </div>
            <div className="space-y-1.5">
              {Object.entries(chart.balance).map(([el, n]) => (
                <div key={el} className="flex items-center gap-2 text-xs">
                  <span className="w-8">{el}</span>
                  <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10"><span className="block h-full rounded-full transition-all" style={{ width: `${(n / 8) * 100}%`, background: ELEMENT_COLORS[el] }} /></span>
                  <span className="w-4 text-right text-ivory/60">{n}</span>
                </div>
              ))}
            </div>
            <p className="text-sm">ปี<span className="text-gold-bright">{result.animal}</span> · ธาตุเจ้าวันเกิด (Day Master) <span style={{ color: ELEMENT_COLORS[chart.dayMaster] }}>{chart.dayMaster}</span> · {result.polarity}</p>
            <button type="button" onClick={() => share({ room: "chinese-astrology", title: `ปาจื้อ ${chart.pillars.map((p) => p.stem + p.branch).join(" ")}`, summary: `ปี${result.animal} · Day Master ธาตุ${chart.dayMaster} · สมดุลธาตุ ${Object.entries(chart.balance).map(([k, v]) => `${k}${v}`).join(" ")}`, facts: { birthDate: date, birthTime: time || null, ...chart } })} className="w-full rounded-full bg-gradient-to-b from-gold-bright to-gold-deep py-2 text-sm text-void transition hover:brightness-110">✦ ส่งผังปาจื้อให้หมอดูอ่าน</button>
            <p className="text-[11px] text-mist/70">*ใช้วันเริ่มสารทจีน (节气) แบบประมาณ ผู้เกิดใกล้วันเปลี่ยนสารทอาจคลาดเคลื่อน ±1 วัน</p>
          </>
        ) : (
          <p className="text-xs text-mist/70">กรอกวันเกิด (และเวลา) เพื่อคำนวณผังปาจื้อ 4 เสา ปี-เดือน-วัน-ยาม พร้อมสมดุลธาตุทั้งห้า</p>
        )}
      </div>
    </div>
  );
}
