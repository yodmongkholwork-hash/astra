"use client";

import { motion, useReducedMotion } from "framer-motion";
import dynamic from "next/dynamic";
import { useCallback, useState, type ComponentType } from "react";
import { useAstra } from "@/components/providers/AstraProvider";
import PersonaAvatar from "@/components/personas/PersonaAvatar";
import OracleChat from "@/components/chat/OracleChat";
import Starfield from "@/components/cosmos/Starfield";
import { Motes, Nebula } from "@/components/cosmos/Atmosphere";
import { getPersona } from "@/lib/data/personas";
import { getRoom, ROOMS, type RoomSlug } from "@/lib/data/rooms";
import { locationForRoom } from "@/lib/realms/locations";
import Link from "next/link";
import type { ReadingPayload } from "@/lib/types";
import { RoomReadingContext } from "./RoomContext";

const Loading = () => <div className="mx-auto h-80 w-80 animate-pulse rounded-full bg-white/5" aria-label="กำลังโหลดห้อง" />;

/** Scenes are code-split so each room only ships its own animation code. */
const SCENES: Record<RoomSlug, ComponentType<{ glow: string }>> = {
  tarot: dynamic(() => import("./scenes/TarotScene"), { loading: Loading }),
  astrology: dynamic(() => import("./scenes/AstrologyScene"), { loading: Loading }),
  "thai-astrology": dynamic(() => import("./scenes/ThaiAstrologyScene"), { loading: Loading }),
  "chinese-astrology": dynamic(() => import("./scenes/ChineseAstrologyScene"), { loading: Loading }),
  numerology: dynamic(() => import("./scenes/NumerologyScene"), { loading: Loading }),
  dreams: dynamic(() => import("./scenes/DreamScene"), { loading: Loading }),
  palmistry: dynamic(() => import("./scenes/PalmistryScene"), { loading: Loading }),
};

export default function RoomShell({ slug }: { slug: RoomSlug }) {
  const room = getRoom(slug)!;
  const reduce = useReducedMotion();
  const { travelTo, setPersonaId } = useAstra();
  const resident = getPersona(room.residentId)!;
  const [personaId, setLocalPersona] = useState(resident.id);
  const [reading, setReading] = useState<ReadingPayload | null>(null);
  const share = useCallback((r: ReadingPayload) => setReading(r), []);
  const Scene = SCENES[slug];
  const p = room.palette;

  const changePersona = (id: string) => {
    setLocalPersona(id);
    setPersonaId(id);
  };

  return (
    <RoomReadingContext.Provider value={{ share }}>
      <main className="relative min-h-screen overflow-hidden pb-24">
        {/* room environment */}
        <div className="fixed inset-0 -z-10" style={{ background: `radial-gradient(ellipse at 50% 0%, ${p.via} 0%, ${p.from} 40%, ${p.to} 100%)` }}>
          <Nebula colors={[p.via, p.from, `${p.glow}55`]} />
          <Starfield density={0.6} />
          <Motes count={16} color={p.glow} />
        </div>

        {/* arrival: the doors part */}
        {!reduce && (
          <div aria-hidden className="pointer-events-none fixed inset-0 z-50 flex">
            {[0, 1].map((side) => (
              <motion.div
                key={side}
                className="h-full w-1/2"
                style={{ background: `linear-gradient(${side ? 270 : 90}deg, ${p.to}, ${p.from})`, borderRight: side ? undefined : `1px solid ${p.glow}66`, borderLeft: side ? `1px solid ${p.glow}66` : undefined }}
                initial={{ x: 0 }}
                animate={{ x: side ? "100%" : "-100%" }}
                transition={{ duration: 1.1, delay: 0.15, ease: [0.7, 0, 0.2, 1] }}
              />
            ))}
          </div>
        )}

        {/* top bar */}
        <nav className="sticky top-0 z-40 flex items-center gap-3 border-b border-white/5 bg-black/30 px-4 py-3 backdrop-blur-md" aria-label="เดินทางระหว่างห้อง">
          <button type="button" onClick={(e) => travelTo("universe", { x: e.clientX, y: e.clientY })} className="flex shrink-0 items-center gap-2 font-display text-sm tracking-[0.25em] text-gold-bright">
            <span aria-hidden>←</span> ASTRA
          </button>
          <Link href={`/realms?focus=${locationForRoom(slug)?.id ?? "castle"}`} className="hidden shrink-0 rounded-full border border-gold/30 px-3 py-1 font-display text-[10px] uppercase tracking-[0.25em] text-gold/90 transition hover:border-gold sm:inline-block" title="กลับสู่อาณาจักร 3 มิติ">
            ✦ Realms
          </Link>
          <div className="no-scrollbar ml-auto flex gap-1 overflow-x-auto">
            {ROOMS.map((r) => (
              <button
                key={r.slug}
                type="button"
                title={r.nameTh}
                aria-label={r.nameTh}
                aria-current={r.slug === slug ? "page" : undefined}
                onClick={(e) => travelTo(r.slug, { x: e.clientX, y: e.clientY })}
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-base transition ${r.slug === slug ? "border-gold bg-gold/15 text-white" : "border-white/10 text-ivory/60 hover:border-gold/50 hover:text-ivory"}`}
                style={r.slug === slug ? { boxShadow: `0 0 16px -2px ${r.palette.glow}` } : undefined}
              >
                {r.glyph}
              </button>
            ))}
          </div>
        </nav>

        {/* room header with resident oracle */}
        <header className="mx-auto mt-10 grid max-w-6xl items-center gap-8 px-4 md:mt-16 md:grid-cols-[1fr_auto]">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: reduce ? 0 : 0.7, duration: 0.8 }}>
            <p className="font-display text-xs uppercase tracking-[0.4em]" style={{ color: p.glow }}>{room.glyph} {room.name}</p>
            <h1 className="mt-3 font-thai-display text-4xl leading-tight text-gilded text-gilded-animate sm:text-5xl md:text-6xl">{room.nameTh}</h1>
            <p className="mt-4 max-w-xl font-serif text-lg text-ivory/80">{room.description}</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: reduce ? 0 : 0.9, duration: 0.8 }} className="flex items-center gap-4 md:flex-col md:text-center">
            <PersonaAvatar id={resident.id} size={150} />
            <div className="max-w-[240px]">
              <p className="text-[10px] uppercase tracking-[0.3em] text-mist/70">ผู้พิทักษ์ห้อง</p>
              <p className="font-display" style={{ color: resident.accent }}>{resident.name}</p>
              <p className="mt-1 font-serif text-sm italic text-ivory/70">“{resident.greeting}”</p>
            </div>
          </motion.div>
        </header>

        {/* interactive scene */}
        <section className="relative mx-auto mt-14 max-w-6xl px-4" aria-label="พื้นที่ทำนาย">
          <Scene glow={p.glow} />
        </section>

        {/* oracle chat */}
        <section className="mx-auto mt-16 max-w-3xl px-4">
          <OracleChat
            room={slug}
            personaId={personaId}
            onPersonaChange={changePersona}
            reading={reading}
            onReadingConsumed={() => setReading(null)}
          />
        </section>
      </main>
    </RoomReadingContext.Provider>
  );
}
