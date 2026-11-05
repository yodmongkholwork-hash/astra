"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";
import { drawCards, SPREADS, type DrawnCard, type SpreadKey } from "@/lib/data/tarot";
import { seededRandom } from "@/lib/engines";
import { useShareReading } from "../RoomContext";

/** Floating 78-card tarot: choose a spread, flip each card, then send the spread to the oracle. */
export default function TarotScene({ glow }: { glow: string }) {
  const reduce = useReducedMotion();
  const share = useShareReading();
  const [spread, setSpread] = useState<SpreadKey>("three-card");
  const [question, setQuestion] = useState("");
  const [reversals, setReversals] = useState(true);
  // deterministic first render (SSR-safe), real shuffle happens on user action
  const [cards, setCards] = useState<DrawnCard[]>(() => drawCards(3, seededRandom("astra"), false));
  const [flipped, setFlipped] = useState<boolean[]>([false, false, false]);
  const positions = SPREADS[spread].positions;
  const allOpen = flipped.length > 0 && flipped.every(Boolean);

  const shuffle = (key: SpreadKey = spread, rev = reversals) => {
    const n = SPREADS[key].positions.length;
    setSpread(key);
    setCards(drawCards(n, Math.random, rev));
    setFlipped(Array(n).fill(false));
  };

  useEffect(() => {
    if (!allOpen) return;
    share({
      room: "tarot",
      title: `${SPREADS[spread].label}${question ? ` — “${question.slice(0, 40)}”` : ""}`,
      summary: cards.map((c, i) => `${positions[i]}: ${c.nameTh}${c.isReversed ? " (กลับหัว)" : ""}`).join(" · "),
      facts: {
        spread,
        question: question || null,
        cards: cards.map((c, i) => ({ position: positions[i], card: c.name, cardTh: c.nameTh, reversed: c.isReversed, meaning: c.isReversed ? c.reversed : c.upright })),
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fire once when the last card opens
  }, [allOpen]);

  const small = cards.length >= 5;

  return (
    <div className="flex flex-col items-center">
      <div className="glass frame-gold mb-8 w-full max-w-2xl space-y-3 rounded-2xl p-4">
        <label className="block">
          <span className="mb-1 block text-xs text-mist/80">คำถามในใจ (ไม่บังคับ)</span>
          <input value={question} onChange={(e) => setQuestion(e.target.value)} maxLength={200} placeholder="เช่น ความรักของฉันในเดือนนี้จะเป็นอย่างไร" className="astra-input" />
        </label>
        <div className="flex flex-wrap items-center gap-2 text-xs" role="radiogroup" aria-label="รูปแบบการวางไพ่">
          {(Object.keys(SPREADS) as SpreadKey[]).map((k) => (
            <button key={k} type="button" role="radio" aria-checked={spread === k} onClick={() => shuffle(k)} className={`rounded-full px-3 py-1.5 transition ${spread === k ? "bg-gold text-void" : "border border-white/15 text-ivory/70 hover:text-ivory"}`}>
              {SPREADS[k].label}
            </button>
          ))}
          <label className="ml-auto flex items-center gap-2 text-ivory/70">
            <input type="checkbox" checked={reversals} onChange={(e) => { setReversals(e.target.checked); shuffle(spread, e.target.checked); }} className="accent-[#e6c47a]" />
            ไพ่กลับหัว
          </label>
        </div>
      </div>

      <div className={`grid justify-center gap-2 sm:gap-5 ${small ? "grid-cols-5" : "grid-flow-col"}`} style={{ perspective: 1200 }}>
        {cards.map((card, i) => (
          <div key={`${card.id}-${i}`} className="flex flex-col items-center gap-2">
            <motion.button
              type="button"
              aria-label={flipped[i] ? `${positions[i]}: ${card.name} — ${card.nameTh}${card.isReversed ? " กลับหัว" : ""}` : `เปิดไพ่ตำแหน่ง ${positions[i]}`}
              onClick={() => setFlipped((f) => f.map((v, j) => (j === i ? true : v)))}
              initial={{ opacity: 0, y: -60, rotate: (i - (cards.length - 1) / 2) * 6 }}
              animate={{ opacity: 1, y: reduce ? 0 : [0, -10, 0], rotate: 0 }}
              transition={{ opacity: { delay: i * 0.1 }, rotate: { delay: i * 0.1 }, y: reduce ? {} : { duration: 5 + (i % 3), repeat: Infinity, ease: "easeInOut", delay: i * 0.35 } }}
              className={`relative ${small ? "h-24 w-14 sm:h-40 sm:w-24" : "h-36 w-24 sm:h-56 sm:w-36"}`}
              style={{ transformStyle: "preserve-3d" }}
            >
              <motion.div className="absolute inset-0" style={{ transformStyle: "preserve-3d" }} animate={{ rotateY: flipped[i] ? 180 : 0 }} transition={{ duration: reduce ? 0 : 0.9, ease: [0.4, 0, 0.2, 1] }}>
                {/* back */}
                <div className="absolute inset-0 flex items-center justify-center rounded-xl border border-gold/60" style={{ backfaceVisibility: "hidden", background: "linear-gradient(160deg,#2a1650,#0f0720)", boxShadow: `0 0 30px -4px ${glow}88` }}>
                  <div className="absolute inset-1.5 rounded-lg border border-gold/30" />
                  <svg viewBox="0 0 60 60" className="h-1/2 w-1/2 animate-spin-slow [animation-duration:30s]" aria-hidden>
                    <circle cx="30" cy="30" r="22" fill="none" stroke={glow} strokeOpacity=".6" />
                    <path d="M30 6 L34 26 L54 30 L34 34 L30 54 L26 34 L6 30 L26 26 Z" fill={glow} opacity=".8" />
                  </svg>
                </div>
                {/* face */}
                <div className="absolute inset-0 rounded-xl border border-gold/80" style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)", background: "linear-gradient(170deg,#f7ecd2,#e8d2a0)", boxShadow: `0 0 40px -2px ${glow}` }}>
                  <div className={`flex h-full flex-col items-center justify-between p-2 text-center sm:p-3 ${card.isReversed ? "rotate-180" : ""}`}>
                    <span className="font-display text-[10px] text-[#5a3a14] sm:text-xs">{card.numeral}</span>
                    <span className={`${small ? "text-xl sm:text-3xl" : "text-3xl sm:text-5xl"} text-[#4b1d6e]`}>{card.symbol}</span>
                    <span>
                      <span className="block font-display text-[9px] leading-tight text-[#3a2410] sm:text-xs">{card.name}</span>
                      <span className="block text-[9px] text-[#6b4a2a] sm:text-[10px]">{card.nameTh}</span>
                    </span>
                  </div>
                </div>
              </motion.div>
            </motion.button>
            <span className="text-[11px] text-gold/80">{positions[i]}</span>
          </div>
        ))}
      </div>

      <div className="mt-8 w-full max-w-2xl space-y-1.5 text-center text-sm text-ivory/80" aria-live="polite">
        {flipped.some(Boolean) ? (
          cards.map(
            (c, i) =>
              flipped[i] && (
                <p key={`${c.id}-m`}>
                  <span className="text-gold">{positions[i]} · {c.nameTh}{c.isReversed && " (กลับหัว)"}</span> — {c.isReversed ? c.reversed : c.upright}
                </p>
              ),
          )
        ) : (
          <p className="text-mist/70">ตั้งคำถามในใจ แล้วแตะที่ไพ่เพื่อพลิกเปิด</p>
        )}
        {allOpen && <p className="pt-2 text-xs text-gold-bright">✦ เปิดครบแล้ว — เลื่อนลงเพื่อให้หมอดูตีความ</p>}
      </div>
      <div className="mt-5 flex gap-3">
        <button type="button" onClick={() => shuffle()} className="rounded-full border border-gold/40 px-5 py-2 text-xs text-gold-bright transition hover:bg-gold/10">↻ สับไพ่ใหม่</button>
        {!allOpen && (
          <button type="button" onClick={() => setFlipped((f) => f.map(() => true))} className="rounded-full border border-white/15 px-5 py-2 text-xs text-ivory/70 transition hover:text-ivory">เปิดทั้งหมด</button>
        )}
      </div>
    </div>
  );
}
