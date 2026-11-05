"use client";

import { AnimatePresence, motion } from "framer-motion";
import { PERSONAS, getPersona } from "@/lib/data/personas";
import { getRoom } from "@/lib/data/rooms";
import { useAstra } from "@/components/providers/AstraProvider";
import PersonaAvatar from "@/components/personas/PersonaAvatar";

/** Persona selection: pick the oracle who will speak in every room. */
export default function OracleCourt() {
  const { personaId, setPersonaId, travelTo } = useAstra();
  const active = getPersona(personaId) ?? PERSONAS[0];
  const home = getRoom(active.specialties[0]);

  return (
    <section id="oracles" className="relative mx-auto max-w-6xl scroll-mt-24 px-4 py-24 md:py-32">
      <SectionTitle eyebrow="The Oracles" title="เลือกหมอดูของคุณ" sub="หมอดู AI หกตน หกบุคลิก หกน้ำเสียง — ผู้ที่คุณเลือกจะพูดกับคุณในทุกห้อง" />

      <div className="mt-14 grid items-center gap-10 lg:grid-cols-[1.1fr_1fr]">
        {/* stage */}
        <div className="relative mx-auto flex w-full max-w-md flex-col items-center">
          <div
            className="absolute inset-x-6 bottom-10 top-6 rounded-t-full opacity-70 blur-2xl transition-colors duration-700"
            style={{ background: `radial-gradient(circle at 50% 40%, ${active.aura}66, transparent 70%)` }}
          />
          <AnimatePresence mode="wait">
            <motion.div
              key={active.id}
              initial={{ opacity: 0, y: 20, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.98 }}
              transition={{ duration: 0.5 }}
              className="relative flex w-full flex-col items-center"
            >
              <div className="animate-float [animation-duration:8s]">
                <PersonaAvatar id={active.id} size={240} className="h-auto w-[220px] sm:w-[260px]" />
              </div>
              {/* pedestal */}
              <div className="-mt-3 h-4 w-48 rounded-[50%] bg-gradient-to-b from-gold/50 to-transparent blur-[2px]" />

              <div className="glass frame-gold relative mt-6 w-full rounded-2xl p-5 text-left">
                <span className="absolute -top-2 left-10 h-4 w-4 rotate-45 border-l border-t border-gold/35 bg-[#1a1230]" />
                <p className="font-serif text-lg leading-relaxed text-ivory/95">“{active.greeting}”</p>
                <p className="mt-3 text-xs text-mist/70">น้ำเสียง: {active.voice}</p>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* roster */}
        <div>
          <div className="grid grid-cols-3 gap-3 sm:gap-4" role="radiogroup" aria-label="เลือกหมอดู AI">
            {PERSONAS.map((p) => {
              const selected = p.id === active.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => setPersonaId(p.id)}
                  className={`group relative flex flex-col items-center rounded-2xl border px-1 pb-3 pt-2 transition duration-300 ${
                    selected ? "border-gold/70 bg-white/[0.06] shadow-[0_0_30px_-8px_rgba(230,196,122,.6)]" : "border-white/10 bg-white/[0.02] hover:border-gold/40 hover:bg-white/[0.04]"
                  }`}
                >
                  <PersonaAvatar id={p.id} size={90} animated={selected} className="h-auto w-[70px] transition-transform duration-500 group-hover:-translate-y-1 sm:w-[88px]" />
                  <span className="mt-1 text-center font-display text-[11px] leading-tight text-ivory sm:text-xs">{p.name}</span>
                  <span className="mt-0.5 text-center text-[10px] text-mist/70">{p.temperament}</span>
                  {selected && <motion.span layoutId="oracle-pick" className="absolute -top-1.5 right-2 text-sm text-gold">✦</motion.span>}
                </button>
              );
            })}
          </div>

          <div className="mt-8 rounded-2xl border border-white/10 bg-black/20 p-5">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="font-display text-2xl text-gilded">{active.name}</h3>
              <span className="text-sm text-gold/80">{active.title}</span>
            </div>
            <p className="mt-2 text-sm text-ivory/75">บุคลิก: {active.temperament}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {active.specialties.map((s) => {
                const r = getRoom(s);
                return (
                  r && (
                    <span key={s} className="rounded-full border border-white/15 px-3 py-1 text-xs text-ivory/80">
                      {r.glyph} {r.nameTh}
                    </span>
                  )
                );
              })}
            </div>
            {home && (
              <button
                type="button"
                onClick={(e) => travelTo(home.slug, { x: e.clientX, y: e.clientY })}
                className="mt-5 w-full rounded-full border border-gold/60 bg-gradient-to-b from-gold-bright to-gold-deep px-6 py-3 font-display text-sm tracking-[0.12em] text-void transition hover:brightness-110"
              >
                เริ่มทำนายกับ {active.name}
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

export function SectionTitle({ eyebrow, title, sub }: { eyebrow: string; title: string; sub?: string }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }} className="text-center">
      <div className="flex items-center justify-center gap-3">
        <span className="h-px w-10 bg-gradient-to-r from-transparent to-gold/70" />
        <p className="font-display text-[11px] uppercase tracking-[0.45em] text-gold/80">{eyebrow}</p>
        <span className="h-px w-10 bg-gradient-to-l from-transparent to-gold/70" />
      </div>
      <h2 className="mt-4 font-thai-display text-3xl text-ivory sm:text-4xl md:text-5xl">{title}</h2>
      {sub && <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-mist/80 sm:text-base">{sub}</p>}
    </motion.div>
  );
}
