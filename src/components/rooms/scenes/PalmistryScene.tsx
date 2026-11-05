"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { useShareReading } from "../RoomContext";

const LINES = [
  { key: "life", th: "เส้นชีวิต", d: "M118 150 C 96 178, 88 222, 98 268 C 104 292, 116 308, 126 318", meaning: "พลังชีวิต ความมีชีวิตชีวา และการเปลี่ยนแปลงครั้งสำคัญในชีวิต เส้นลึกยาวบอกถึงความแข็งแรงทางกายและใจ" },
  { key: "head", th: "เส้นสมอง", d: "M116 172 C 148 184, 186 196, 226 222", meaning: "วิธีคิดและการตัดสินใจ เส้นตรงคือนักตรรกะ เส้นโค้งลงคือนักจินตนาการ" },
  { key: "heart", th: "เส้นหัวใจ", d: "M226 166 C 204 150, 170 144, 132 160", meaning: "อารมณ์และความรัก เส้นที่จบใต้นิ้วชี้คือคนรักมั่นคงและอบอุ่น" },
  { key: "fate", th: "เส้นวาสนา", d: "M170 322 C 172 280, 172 230, 176 172", meaning: "เส้นทางอาชีพและโชคชะตา เส้นชัดเจนบอกถึงเป้าหมายที่มั่นคง" },
] as const;
type LineKey = (typeof LINES)[number]["key"];

/** Interactive glowing palm. Tap a line to reveal its meaning. Photo upload is stubbed for a future vision agent. */
export default function PalmistryScene({ glow }: { glow: string }) {
  const [active, setActive] = useState<LineKey | null>(null);
  const [hand, setHand] = useState<"ซ้าย" | "ขวา">("ขวา");
  const share = useShareReading();
  const line = LINES.find((l) => l.key === active);

  const choose = (k: LineKey) => {
    setActive(k);
    const l = LINES.find((x) => x.key === k)!;
    share({ room: "palmistry", title: `${l.th} (มือ${hand})`, summary: l.meaning, facts: { hand, line: l.key, lineTh: l.th } });
  };

  return (
    <div className="grid items-center gap-8 md:grid-cols-[1.2fr_1fr]">
      <div className="relative mx-auto w-full max-w-[360px]">
        <div className="absolute inset-0 rounded-full blur-3xl" style={{ background: `radial-gradient(circle, ${glow}33, transparent 65%)` }} />
        <svg viewBox="0 0 340 420" className={`relative h-auto w-full ${hand === "ซ้าย" ? "-scale-x-100" : ""}`} aria-label="ฝ่ามือแบบโต้ตอบ">
          <defs>
            <linearGradient id="palm-skin" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#3b1a3a" />
              <stop offset="1" stopColor="#1c0b1c" />
            </linearGradient>
          </defs>
          {/* stylised hand silhouette */}
          <path
            d="M96 400 C 70 330, 64 270, 70 214 L 46 150 C 38 128, 62 118, 74 138 L 100 184 L 98 70 C 98 48, 126 48, 128 70 L 132 150 L 140 40 C 142 16, 172 16, 172 40 L 172 148 L 186 52 C 190 30, 218 32, 216 56 L 208 156 L 232 90 C 240 68, 266 76, 258 100 L 236 200 C 232 250, 250 300, 236 350 C 228 380, 220 400, 216 410 Z"
            fill="url(#palm-skin)"
            stroke={glow}
            strokeOpacity=".7"
            strokeWidth="1.4"
            className="avatar-breathe"
          />
          {/* mounts / palm sparkles */}
          {[[130, 120], [175, 112], [214, 124], [120, 300], [214, 290]].map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r="2" fill={glow} className="avatar-twinkle" style={{ animationDelay: `${-i * 0.6}s` }} />
          ))}
          {LINES.map((l) => {
            const on = active === l.key;
            return (
              <g key={l.key} onClick={() => choose(l.key)} className="cursor-pointer" role="button" tabIndex={0} aria-label={l.th} onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && choose(l.key)}>
                <path d={l.d} fill="none" stroke="transparent" strokeWidth="22" />
                <path d={l.d} fill="none" stroke={on ? "#fff" : glow} strokeWidth={on ? 3.5 : 2.2} strokeLinecap="round" style={{ filter: `drop-shadow(0 0 ${on ? 10 : 4}px ${glow})`, transition: "all .3s" }} strokeDasharray={on ? undefined : "1 0"} />
              </g>
            );
          })}
        </svg>
      </div>

      <div className="glass frame-gold space-y-4 rounded-2xl p-5">
        <p className="font-display text-sm tracking-[0.2em] text-gold">PALM READING</p>
        <div className="flex gap-2 text-xs" role="radiogroup" aria-label="เลือกมือ">
          {(["ขวา", "ซ้าย"] as const).map((h) => (
            <button key={h} type="button" role="radio" aria-checked={hand === h} onClick={() => setHand(h)} className={`rounded-full px-4 py-1.5 transition ${hand === h ? "bg-gold text-void" : "border border-white/15 text-ivory/70"}`}>
              มือ{h}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {LINES.map((l) => (
            <button key={l.key} type="button" onClick={() => choose(l.key)} className={`rounded-full border px-3 py-1 text-xs transition ${active === l.key ? "border-gold bg-gold/15 text-white" : "border-white/15 text-ivory/70 hover:border-gold/50"}`}>
              {l.th}
            </button>
          ))}
        </div>
        <AnimatePresence mode="wait">
          <motion.p key={active ?? "none"} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="min-h-[4.5rem] rounded-xl bg-black/30 p-3 text-sm">
            {line ? (
              <>
                <span className="text-gold-bright">{line.th}</span> — {line.meaning}
              </>
            ) : (
              <span className="text-mist/70">แตะเส้นบนฝ่ามือเพื่ออ่านความหมาย</span>
            )}
          </motion.p>
        </AnimatePresence>
        <label className="block cursor-not-allowed rounded-xl border border-dashed border-white/15 p-3 text-center text-xs text-mist/60" title="เร็ว ๆ นี้">
          📷 อัปโหลดภาพฝ่ามือ — <span className="text-gold/70">เร็ว ๆ นี้ (Vision Agent)</span>
          <input type="file" accept="image/*" disabled className="sr-only" />
        </label>
      </div>
    </div>
  );
}
