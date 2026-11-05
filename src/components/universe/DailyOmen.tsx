"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { dailyOmen } from "@/lib/data/omens";
import { SectionTitle } from "./OracleCourt";

type Omen = ReturnType<typeof dailyOmen>;

/** Daily Horoscope teaser. Computed on the client (user's local date). Demo text until Phase 5. */
export default function DailyOmen() {
  const [omen, setOmen] = useState<Omen | null>(null);
  // eslint-disable-next-line react-hooks/set-state-in-effect -- date must be read on the client
  useEffect(() => setOmen(dailyOmen(new Date())), []);

  return (
    <section id="daily" className="relative mx-auto max-w-5xl scroll-mt-24 px-4 py-24">
      <SectionTitle eyebrow="Daily Omen" title="สารจากดวงดาววันนี้" />
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.9 }}
        className="glass frame-gold relative mt-12 grid gap-8 overflow-hidden rounded-3xl p-6 sm:p-10 md:grid-cols-[auto_1fr]"
      >
        <MoonDisc fraction={omen?.moon.fraction ?? 0.5} />
        <div className="min-h-[180px]">
          {omen ? (
            <>
              <p className="text-xs uppercase tracking-[0.3em] text-gold/70">
                {new Date(`${omen.date}T12:00:00`).toLocaleDateString("th-TH", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
              </p>
              <p className="mt-4 font-serif text-2xl leading-snug text-ivory sm:text-3xl">{omen.message}</p>
              <dl className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
                <Stat label="ดวงจันทร์" value={omen.moon.name} />
                <Stat label="เลขนำโชค" value={String(omen.luckyNumber).padStart(2, "0")} />
                <Stat label="สีมงคล" value={omen.color.name} swatch={omen.color.hex} />
                <Stat label="พลังงานวันนี้" value={`${omen.energy}%`} bar={omen.energy} />
              </dl>
            </>
          ) : (
            <div className="space-y-3" aria-busy>
              <div className="h-3 w-40 animate-pulse rounded bg-white/10" />
              <div className="h-8 w-full animate-pulse rounded bg-white/10" />
              <div className="h-8 w-2/3 animate-pulse rounded bg-white/10" />
            </div>
          )}
          <p className="mt-6 text-[11px] text-ivory/40">Demo Mode · คำทำนายรายวันจะถูกสร้างโดย AI ตามดวงกำเนิดของคุณใน Phase 5–6</p>
        </div>
      </motion.div>
    </section>
  );
}

function Stat({ label, value, swatch, bar }: { label: string; value: string; swatch?: string; bar?: number }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/20 p-3">
      <dt className="text-[11px] text-mist/70">{label}</dt>
      <dd className="mt-1 flex items-center gap-2 font-display text-base text-gold-bright">
        {swatch && <span className="h-3 w-3 rounded-full ring-1 ring-white/30" style={{ background: swatch }} />}
        {value}
      </dd>
      {bar !== undefined && (
        <div className="mt-2 h-1 overflow-hidden rounded bg-white/10">
          <div className="h-full rounded bg-gradient-to-r from-gold-deep to-gold-bright" style={{ width: `${bar}%` }} />
        </div>
      )}
    </div>
  );
}

/** Moon drawn from the real computed phase fraction. */
function MoonDisc({ fraction }: { fraction: number }) {
  // terminator ellipse: x-radius goes 1 → 0 → 1 across the cycle
  const waxing = fraction < 0.5;
  const k = Math.cos(fraction * 2 * Math.PI); // 1 new, -1 full
  const rx = Math.abs(k) * 50;
  const lit = `M50 0 A50 50 0 0 ${waxing ? 1 : 0} 50 100 A${rx} 50 0 0 ${(k > 0) === waxing ? 0 : 1} 50 0 Z`;
  return (
    <div className="relative mx-auto h-40 w-40 sm:h-48 sm:w-48" aria-hidden>
      <div className="absolute inset-0 rounded-full bg-lilac/20 blur-2xl animate-pulse-glow" />
      <svg viewBox="0 0 100 100" className="relative h-full w-full">
        <circle cx="50" cy="50" r="50" fill="#1a1530" />
        <path d={lit} fill="#f2ecdc" />
        <circle cx="34" cy="38" r="6" fill="#000" opacity=".06" />
        <circle cx="62" cy="64" r="9" fill="#000" opacity=".05" />
        <circle cx="58" cy="30" r="4" fill="#000" opacity=".06" />
      </svg>
    </div>
  );
}
