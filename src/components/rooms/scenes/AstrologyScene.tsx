"use client";

import { useState } from "react";
import { ZODIAC, sunSign } from "@/lib/engines";
import { useShareReading } from "../RoomContext";

const PLANETS = [
  { r: 30, size: 3, color: "#d8d2c4", dur: 18 },
  { r: 42, size: 4, color: "#ffd9a0", dur: 28 },
  { r: 54, size: 4.5, color: "#7ab8ff", dur: 40 },
  { r: 66, size: 3.5, color: "#ff8a6b", dur: 60 },
  { r: 78, size: 6, color: "#f7e1a6", dur: 90 },
];

/** Rotating zodiac wheel with orbiting planets; sun-sign lookup from the calc engine. */
export default function AstrologyScene({ glow }: { glow: string }) {
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [place, setPlace] = useState("");
  const share = useShareReading();
  const sign = date ? sunSign(Number(date.slice(5, 7)), Number(date.slice(8, 10))) : null;

  return (
    <div className="grid items-center gap-8 md:grid-cols-[1.2fr_1fr]">
      <div className="relative mx-auto aspect-square w-full max-w-[420px]">
        <svg viewBox="0 0 240 240" className="h-full w-full" aria-label="วงล้อจักรราศี">
          <g className="animate-spin-slow [animation-duration:90s]" style={{ transformOrigin: "120px 120px" }}>
            <circle cx="120" cy="120" r="116" fill="none" stroke={glow} strokeOpacity=".6" />
            <circle cx="120" cy="120" r="96" fill="none" stroke={glow} strokeOpacity=".35" />
            {ZODIAC.map((z, i) => {
              const a0 = (i / 12) * Math.PI * 2 - Math.PI / 2;
              const am = a0 + Math.PI / 12;
              const active = sign?.key === z.key;
              return (
                <g key={z.key}>
                  <line x1={120 + Math.cos(a0) * 96} y1={120 + Math.sin(a0) * 96} x2={120 + Math.cos(a0) * 116} y2={120 + Math.sin(a0) * 116} stroke={glow} strokeOpacity=".5" />
                  <text x={120 + Math.cos(am) * 106} y={120 + Math.sin(am) * 106} fontSize="11" textAnchor="middle" dominantBaseline="central" fill={active ? "#fff" : "#f7e1a6"} style={{ filter: active ? `drop-shadow(0 0 6px ${glow})` : undefined }}>
                    {z.glyph}
                  </text>
                </g>
              );
            })}
          </g>
          {/* house lines */}
          {Array.from({ length: 12 }, (_, i) => {
            const a = (i / 12) * Math.PI * 2;
            return <line key={i} x1={120 + Math.cos(a) * 22} y1={120 + Math.sin(a) * 22} x2={120 + Math.cos(a) * 92} y2={120 + Math.sin(a) * 92} stroke="#fff" strokeOpacity=".06" />;
          })}
          {PLANETS.map((p, i) => (
            <g key={i} className="animate-spin-slow" style={{ transformOrigin: "120px 120px", animationDuration: `${p.dur}s`, animationDelay: `-${i * 7}s` }}>
              <circle cx="120" cy="120" r={p.r} fill="none" stroke="#fff" strokeOpacity=".07" />
              <circle cx={120 + p.r} cy="120" r={p.size} fill={p.color} style={{ filter: `drop-shadow(0 0 4px ${p.color})` }} />
            </g>
          ))}
          <circle cx="120" cy="120" r="12" fill="#f7e1a6" />
          <circle cx="120" cy="120" r="20" fill="#f7e1a6" opacity=".15" className="avatar-aura" />
        </svg>
      </div>

      <form className="glass frame-gold space-y-4 rounded-2xl p-5" onSubmit={(e) => {
        e.preventDefault();
        if (sign) share({ room: "astrology", title: `ดวงกำเนิด ราศี${sign.th}`, summary: `ราศีอาทิตย์ ${sign.glyph} ${sign.th}${time ? ` · เกิดเวลา ${time}` : ""}${place ? ` · ${place}` : ""}`, facts: { birthDate: date, birthTime: time || null, birthPlace: place || null, sunSign: sign.key, sunSignTh: sign.th } });
      }}>
        <p className="font-display text-sm tracking-[0.2em] text-gold">BIRTH DATA</p>
        <Field label="วันเกิด"><input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="astra-input" /></Field>
        <Field label="เวลาเกิด"><input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="astra-input" /></Field>
        <Field label="สถานที่เกิด"><input type="text" placeholder="เช่น กรุงเทพฯ" value={place} onChange={(e) => setPlace(e.target.value)} className="astra-input" /></Field>
        {sign ? (
          <p className="rounded-xl bg-black/30 p-3 text-sm">
            ราศีอาทิตย์ (Sun sign): <span className="text-lg text-gold-bright">{sign.glyph} ราศี{sign.th}</span>
          </p>
        ) : null}
        {sign && <button type="submit" className="w-full rounded-full bg-gradient-to-b from-gold-bright to-gold-deep py-2 text-sm text-void transition hover:brightness-110">✦ ส่งผังดวงให้หมอดูอ่าน</button>}
        {!sign && (
          <p className="text-xs text-mist/70">กรอกวันเกิดเพื่อดูราศีอาทิตย์ · Moon / Rising / 12 เรือน ต้องเชื่อม ephemeris engine (ดู README › Roadmap)</p>
        )}
      </form>
    </div>
  );
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs text-mist/80">{label}</span>
      {children}
    </label>
  );
}
