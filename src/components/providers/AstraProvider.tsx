"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { getRoom, type RoomSlug } from "@/lib/data/rooms";
import { PERSONAS } from "@/lib/data/personas";

/* ------------------------------------------------------------
 * Global client state:
 *  - selected persona (persisted to localStorage; Supabase in Phase 6)
 *  - "travel" between rooms: a cinematic veil that opens from the
 *    point the user clicked, then navigates and dissolves on arrival.
 * ------------------------------------------------------------ */

interface Travel {
  slug: RoomSlug | "universe";
  origin: { x: number; y: number };
}

interface AstraCtx {
  personaId: string;
  setPersonaId: (id: string) => void;
  travelTo: (slug: RoomSlug | "universe", origin?: { x: number; y: number }) => void;
  traveling: boolean;
}

const Ctx = createContext<AstraCtx | null>(null);
const STORAGE_KEY = "astra.persona";

export function AstraProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const reduce = useReducedMotion();
  const [personaId, setPersonaState] = useState<string>(PERSONAS[0].id);
  const [travel, setTravel] = useState<Travel | null>(null);
  const departedFrom = useRef<string | null>(null);

  // hydrate persona choice
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time hydration from storage
      if (saved && PERSONAS.some((p) => p.id === saved)) setPersonaState(saved);
    } catch {
      /* storage unavailable — keep default */
    }
  }, []);

  const setPersonaId = useCallback((id: string) => {
    setPersonaState(id);
    try {
      localStorage.setItem(STORAGE_KEY, id);
    } catch {
      /* ignore */
    }
  }, []);

  const travelTo = useCallback<AstraCtx["travelTo"]>(
    (slug, origin) => {
      const href = slug === "universe" ? "/" : `/rooms/${slug}`;
      if (href === pathname) return;
      departedFrom.current = pathname;
      const o = origin ?? { x: window.innerWidth / 2, y: window.innerHeight / 2 };
      setTravel({ slug, origin: o });
      router.prefetch(href);
      window.setTimeout(() => router.push(href, { scroll: true }), reduce ? 120 : 950);
    },
    [pathname, reduce, router],
  );

  // arrival: once the route changed, dissolve the veil
  useEffect(() => {
    if (!travel || departedFrom.current === pathname) return;
    const t = window.setTimeout(() => setTravel(null), reduce ? 50 : 450);
    return () => window.clearTimeout(t);
  }, [pathname, travel, reduce]);

  return (
    <Ctx.Provider value={{ personaId, setPersonaId, travelTo, traveling: !!travel }}>
      {children}
      <AnimatePresence>{travel && <TravelVeil key="veil" travel={travel} reduce={!!reduce} />}</AnimatePresence>
    </Ctx.Provider>
  );
}

export function useAstra() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAstra must be used inside <AstraProvider>");
  return ctx;
}

/* ---------- The veil ---------- */
function TravelVeil({ travel, reduce }: { travel: Travel; reduce: boolean }) {
  const room = travel.slug === "universe" ? null : getRoom(travel.slug);
  const p = room?.palette ?? { from: "#160b2e", via: "#2a1650", to: "#06040d", glow: "#e6c47a" };
  const { x, y } = travel.origin;

  return (
    <motion.div
      className="fixed inset-0 z-[100] pointer-events-auto"
      aria-live="polite"
      role="status"
      initial={reduce ? { opacity: 0 } : { clipPath: `circle(0px at ${x}px ${y}px)` }}
      animate={reduce ? { opacity: 1 } : { clipPath: `circle(150vmax at ${x}px ${y}px)` }}
      exit={{ opacity: 0 }}
      transition={{ duration: reduce ? 0.1 : 0.85, ease: [0.7, 0, 0.2, 1] }}
      style={{
        background: `radial-gradient(circle at ${x}px ${y}px, ${p.glow}55 0%, ${p.via} 18%, ${p.from} 45%, ${p.to} 100%)`,
      }}
    >
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-center">
        <motion.div
          initial={{ scale: 0.4, opacity: 0, rotate: -40 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          transition={{ delay: reduce ? 0 : 0.35, duration: 0.6, ease: "easeOut" }}
          className="text-6xl md:text-7xl"
          style={{ color: p.glow, textShadow: `0 0 40px ${p.glow}` }}
        >
          {room?.glyph ?? "✧"}
        </motion.div>
        <motion.p
          initial={{ opacity: 0, letterSpacing: "0.6em" }}
          animate={{ opacity: 1, letterSpacing: "0.3em" }}
          transition={{ delay: reduce ? 0 : 0.45, duration: 0.6 }}
          className="font-display text-sm uppercase text-ivory/80 md:text-base"
        >
          {room ? `Entering ${room.name}` : "Returning to the Universe"}
        </motion.p>
        {room && <p className="text-sm text-ivory/60">{room.nameTh}</p>}
      </div>
    </motion.div>
  );
}
