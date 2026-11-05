"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useState, type MouseEvent } from "react";
import { useRouter } from "next/navigation";
import type { Room } from "@/lib/data/rooms";
import { getPersona } from "@/lib/data/personas";
import { useAstra } from "@/components/providers/AstraProvider";
import RoomEmblem from "@/components/rooms/RoomEmblem";
import PersonaAvatar from "@/components/personas/PersonaAvatar";

/**
 * An arched doorway into a room. Hover/focus: the doors part and light spills out.
 * Click: doors swing open fully, then the travel veil carries the user inside.
 */
export default function RoomPortal({ room, index }: { room: Room; index: number }) {
  const { travelTo, traveling } = useAstra();
  const router = useRouter();
  const reduce = useReducedMotion();
  const [state, setState] = useState<"closed" | "ajar" | "open">("closed");
  const resident = getPersona(room.residentId);
  const p = room.palette;

  // closed doors still rest slightly parted so the room inside is teased (touch users never hover)
  const angle = state === "open" ? 104 : state === "ajar" ? 38 : 14;

  const enter = (e: MouseEvent<HTMLButtonElement>) => {
    if (traveling) return;
    setState("open");
    const rect = e.currentTarget.getBoundingClientRect();
    const origin = e.clientX ? { x: e.clientX, y: e.clientY } : { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    window.setTimeout(() => travelTo(room.slug, origin), reduce ? 0 : 320);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.8, delay: (index % 4) * 0.08, ease: [0.2, 0.7, 0.2, 1] }}
      className="group flex flex-col items-center"
    >
      <button
        type="button"
        onClick={enter}
        onMouseEnter={() => {
          setState((s) => (s === "open" ? s : "ajar"));
          router.prefetch(`/rooms/${room.slug}`);
        }}
        onMouseLeave={() => setState((s) => (s === "open" ? s : "closed"))}
        onFocus={() => setState((s) => (s === "open" ? s : "ajar"))}
        onBlur={() => setState((s) => (s === "open" ? s : "closed"))}
        aria-label={`เข้าสู่${room.nameTh} (${room.name})`}
        className="relative w-full max-w-[220px] cursor-pointer rounded-t-full outline-none focus-visible:ring-2 focus-visible:ring-gold/80 focus-visible:ring-offset-4 focus-visible:ring-offset-void"
        style={{ aspectRatio: "3 / 4.3" }}
      >
        {/* ground glow */}
        <div
          className="absolute -bottom-6 left-1/2 h-10 w-[120%] -translate-x-1/2 rounded-[50%] blur-xl transition-opacity duration-700"
          style={{ background: p.glow, opacity: state === "closed" ? 0.18 : 0.45 }}
        />

        {/* arch frame */}
        <div className="absolute inset-0 rounded-t-full p-[5px]" style={{ background: "linear-gradient(180deg,#f7e1a6,#a97c33 40%,#5a3a14 100%)" }}>
          <div className="relative h-full w-full overflow-hidden rounded-t-full" style={{ perspective: 900 }}>
            {/* interior */}
            <div className="absolute inset-0" style={{ background: `radial-gradient(circle at 50% 45%, ${p.glow}66 0%, ${p.via} 35%, ${p.from} 65%, ${p.to} 100%)` }}>
              <div className="absolute inset-x-[14%] top-[16%] aspect-square">
                <RoomEmblem slug={room.slug} glow={p.glow} />
              </div>
              {resident && (
                <div className="absolute bottom-0 left-1/2 w-[62%] -translate-x-1/2 opacity-95">
                  <PersonaAvatar id={resident.id} size={140} className="h-auto w-full drop-shadow-[0_0_14px_rgba(0,0,0,.6)]" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
            </div>

            {/* light seam */}
            <div
              className="pointer-events-none absolute inset-y-0 left-1/2 w-1 -translate-x-1/2 blur-[3px] transition-opacity duration-500"
              style={{ background: p.glow, opacity: state === "closed" ? 0.55 : 0 }}
            />

            {/* doors */}
            {(["left", "right"] as const).map((side) => (
              <motion.div
                key={side}
                className="absolute inset-y-0 w-1/2"
                style={{
                  [side]: 0,
                  transformOrigin: side === "left" ? "left center" : "right center",
                  backfaceVisibility: "hidden",
                  background: `linear-gradient(${side === "left" ? 90 : 270}deg, #1a0f2b 0%, #2a1748 70%, #3b2160 100%)`,
                  borderRadius: side === "left" ? "999px 0 0 0" : "0 999px 0 0",
                }}
                animate={{ rotateY: side === "left" ? -angle : angle }}
                transition={reduce ? { duration: 0 } : { type: "spring", stiffness: state === "open" ? 70 : 120, damping: 16 }}
              >
                {/* door ornament */}
                <svg viewBox="0 0 50 140" preserveAspectRatio="none" className="absolute inset-0 h-full w-full" aria-hidden>
                  <path
                    d={side === "left" ? "M8 136 L8 50 Q8 16 46 8 L46 136 Z" : "M42 136 L42 50 Q42 16 4 8 L4 136 Z"}
                    fill="none"
                    stroke="#e6c47a"
                    strokeOpacity=".45"
                    strokeWidth=".8"
                    vectorEffect="non-scaling-stroke"
                  />
                </svg>
                <div className={`absolute top-[46%] ${side === "left" ? "right-2" : "left-2"} flex flex-col items-center gap-1`}>
                  <span className="block h-3 w-3 rounded-full border border-gold/70 bg-gradient-to-br from-gold-bright to-gold-deep shadow-[0_0_8px_rgba(230,196,122,.6)]" />
                </div>
                <div className="absolute inset-x-0 top-[22%] text-center font-display text-2xl text-gold/70" style={{ textShadow: `0 0 12px ${p.glow}` }}>
                  {side === "left" ? room.glyph : ""}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
        {/* keystone */}
        <div className="absolute -top-2 left-1/2 h-5 w-5 -translate-x-1/2 rotate-45 border border-gold/70 bg-void shadow-[0_0_14px_rgba(230,196,122,.5)]" />
      </button>

      <div className="mt-6 text-center">
        <p className="font-thai-display text-base text-ivory md:text-lg">{room.nameTh}</p>
        <p className="mt-0.5 font-display text-[10px] uppercase tracking-[0.25em] text-gold/70 md:text-[11px]">{room.name}</p>
        <p className="mx-auto mt-2 hidden max-w-[220px] text-xs leading-relaxed text-mist/80 sm:block">{room.tagline}</p>
        {resident && <p className="mt-2 text-[11px] text-ivory/50">ประจำห้อง · {resident.name}</p>}
      </div>
    </motion.div>
  );
}
