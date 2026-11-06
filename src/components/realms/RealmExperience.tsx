"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { useAstra } from "@/components/providers/AstraProvider";
import PersonaAvatar from "@/components/personas/PersonaAvatar";
import { getLocation, INTRO_PATH, LOCATIONS, OVERVIEW, type LocationId, type Pose, type ShotKind } from "@/lib/realms/locations";
import { detectQuality, webglAvailable, type Quality } from "@/lib/realms/quality";
import type { CameraCommand, CameraCommandInput, IdleMode } from "./camera/CameraDirector";
import MiniMap from "./ui/MiniMap";

const KingdomCanvas = dynamic(() => import("./KingdomCanvas"), { ssr: false });

/**
 * Experience state machine
 *   loading → intro → overview ⇄ travel → focus → entering → (existing ASTRA room)
 * All camera motion is expressed as CameraCommands consumed by <CameraDirector/>.
 */
type Phase = "loading" | "intro" | "overview" | "travel" | "focus" | "entering";

const QUALITY_KEY = "astra.realms.quality";
const SHOTS: { kind: ShotKind; label: string }[] = [
  { kind: "wide", label: "ภาพกว้าง" },
  { kind: "medium", label: "ระยะกลาง" },
  { kind: "close", label: "ระยะใกล้" },
];

/**
 * Next 16 (cacheComponents) keeps visited routes alive in a hidden <Activity>,
 * so coming back from a room would restore the old "entering" state and a
 * suspended WebGL canvas. Effects re-run when the route is revealed, so we bump
 * a visit key there and remount the experience fresh on every visit.
 */
export default function RealmExperience() {
  const [visit, setVisit] = useState(0);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- runs on every reveal of the route
    setVisit((v) => v + 1);
  }, []);
  if (visit === 0) return <div className="fixed inset-0 bg-[#05030d]" />;
  return <RealmSession key={visit} />;
}

function RealmSession() {
  const router = useRouter();
  const reduce = !!useReducedMotion();
  const { travelTo } = useAstra();

  const [supported, setSupported] = useState<boolean | null>(null);
  const [quality, setQuality] = useState<Quality>("medium");
  const [phase, setPhase] = useState<Phase>("loading");
  const [selected, setSelected] = useState<LocationId | null>(null);
  const [shot, setShot] = useState<ShotKind>("wide");
  const [command, setCommand] = useState<CameraCommand | null>(null);
  const [flash, setFlash] = useState(false);
  const [dest, setDest] = useState<"overview" | "site">("overview"); // where the camera is heading
  const [showMap, setShowMap] = useState(true);
  const keyRef = useRef(0);
  const pending = useRef<{ key: number; then: () => void } | null>(null);
  const rest = useRef<Pose>(OVERVIEW); // last settled pose, restored after a quality switch
  const deepLink = useRef<LocationId | null>(null);
  const readyOnce = useRef(false);
  const holdTimer = useRef<number | null>(null);
  const lastInput = useRef<CameraCommandInput | null>(null);
  useEffect(() => () => {
    if (holdTimer.current) window.clearTimeout(holdTimer.current);
  }, []);

  /* ---------- boot ---------- */
  useEffect(() => {
    const ok = webglAvailable();
    let q: Quality = detectQuality();
    try {
      const saved = localStorage.getItem(QUALITY_KEY) as Quality | null;
      if (saved === "low" || saved === "medium" || saved === "high") q = saved;
    } catch {}
    // ?focus=<id> on the Next route; #realms-<id> when ASTRA runs as a single-page bundle
    const focus = new URLSearchParams(window.location.search).get("focus") ?? window.location.hash.match(/^#realms-([a-z]+)$/)?.[1] ?? null;
    if (focus && getLocation(focus)) deepLink.current = focus as LocationId;
    /* eslint-disable react-hooks/set-state-in-effect -- browser capabilities are only known after mount */
    setSupported(ok);
    setQuality(q);
    setShowMap(window.innerWidth >= 768);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  /* ---------- command helper ---------- */
  const issue = useCallback(
    (c: CameraCommandInput, then?: () => void) => {
      const key = ++keyRef.current;
      const input: CameraCommandInput = reduce && c.kind !== "cut" ? { kind: "cut", to: "to" in c ? c.to : OVERVIEW } : c;
      // any new camera move cancels a scheduled one (e.g. the post-entrance rise)
      if (holdTimer.current) window.clearTimeout(holdTimer.current);
      holdTimer.current = null;
      pending.current = then ? { key, then } : null;
      lastInput.current = input;
      setCommand({ ...input, key } as CameraCommand);
    },
    [reduce],
  );

  const onArrive = useCallback((key: number) => {
    if (pending.current?.key === key) {
      const fn = pending.current.then;
      pending.current = null;
      fn();
    }
  }, []);

  /* ---------- sequences ---------- */
  const toOverview = useCallback(
    (cut = false) => {
      setDest("overview");
      setPhase("travel");
      const done = () => {
        rest.current = OVERVIEW;
        setPhase("overview");
      };
      if (cut) issue({ kind: "cut", to: OVERVIEW }, done);
      else issue({ kind: "arc", to: OVERVIEW, duration: 4.6 }, done);
    },
    [issue],
  );

  const flyTo = useCallback(
    (id: LocationId, kind: ShotKind = "wide") => {
      const loc = getLocation(id);
      if (!loc) return;
      const pose = loc.shots[kind];
      setSelected(id);
      setShot(kind);
      setDest("site");
      setPhase("travel");
      const sameSite = selected === id && (phase === "focus" || phase === "travel");
      const done = () => {
        rest.current = pose;
        setPhase("focus");
      };
      if (sameSite) issue({ kind: "arc", to: pose, duration: 2.6, lift: 8 }, done);
      else issue({ kind: "arc", to: pose, duration: 5.2 }, done);
    },
    [issue, phase, selected],
  );

  const playIntro = useCallback(() => {
    setPhase("intro");
    issue({ kind: "path", pos: INTRO_PATH.pos, target: INTRO_PATH.target, duration: 15 }, () => {
      rest.current = getLocation("castle")!.shots.wide;
      // hold the establishing shot a beat, then rise into the overview
      holdTimer.current = window.setTimeout(() => toOverview(), 1400);
    });
  }, [issue, toOverview]);

  const skipIntro = useCallback(() => toOverview(true), [toOverview]);

  const onReady = useCallback(() => {
    if (readyOnce.current) {
      // canvas was re-created by a quality change: restore the camera exactly
      issue({ kind: "cut", to: rest.current }, () => {});
      return;
    }
    readyOnce.current = true;
    if (deepLink.current) {
      const id = deepLink.current;
      issue({ kind: "cut", to: OVERVIEW }, () => {
        setSelected(id);
        setPhase("overview");
      });
    } else if (reduce) {
      issue({ kind: "cut", to: OVERVIEW }, () => setPhase("overview"));
    } else {
      playIntro();
    }
  }, [issue, playIntro, reduce]);

  const enter = useCallback(() => {
    const loc = selected ? getLocation(selected) : null;
    if (!loc) return;
    setPhase("entering");
    const close = loc.shots.close;
    const portal: Pose = {
      pos: [close.pos[0] + (close.target[0] - close.pos[0]) * 0.8, close.pos[1] + (close.target[1] - close.pos[1]) * 0.8, close.pos[2] + (close.target[2] - close.pos[2]) * 0.8],
      target: close.target,
    };
    const go = () => {
      setFlash(true);
      window.setTimeout(() => {
        if (loc.room) travelTo(loc.room);
        else router.push("/profile");
      }, reduce ? 50 : 650);
    };
    if (shot !== "close") issue({ kind: "arc", to: close, duration: 2.4, lift: 10 }, () => issue({ kind: "direct", to: portal, duration: 1.3 }, go));
    else issue({ kind: "direct", to: portal, duration: 1.4 }, go);
  }, [issue, reduce, router, selected, shot, travelTo]);

  const changeQuality = (q: Quality) => {
    if (q === quality) return;
    // the renderer is rebuilt: land the camera where it was heading and finish that move
    const inFlight = pending.current;
    const c = lastInput.current;
    const dest: Pose = inFlight && c && c.kind !== "path" ? c.to : inFlight && c?.kind === "path" ? getLocation("castle")!.shots.wide : rest.current;
    issue({ kind: "cut", to: dest }, inFlight?.then);
    setQuality(q);
    try {
      localStorage.setItem(QUALITY_KEY, q);
    } catch {}
  };

  /* ---------- keyboard ---------- */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === "SELECT") return;
      if (phase === "intro" && (e.key === "Escape" || e.key === "Enter" || e.key === " ")) {
        e.preventDefault();
        skipIntro();
        return;
      }
      if (phase === "loading" || phase === "entering" || phase === "intro") return;
      const idx = selected ? LOCATIONS.findIndex((l) => l.id === selected) : -1;
      if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
        e.preventDefault();
        const n = (idx + (e.key === "ArrowRight" ? 1 : -1) + LOCATIONS.length) % LOCATIONS.length;
        flyTo(LOCATIONS[n].id);
      } else if (e.key === "Escape" && phase !== "overview") {
        toOverview();
      } else if (e.key === "Enter" && phase === "focus" && !(e.target instanceof HTMLButtonElement)) {
        enter();
      } else if (phase === "focus" && ["1", "2", "3"].includes(e.key) && selected) {
        flyTo(selected, SHOTS[Number(e.key) - 1].kind);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, selected, flyTo, toOverview, enter, skipIntro]);

  /* ---------- render ---------- */
  if (supported === false) return <Fallback2D />;

  const loc = selected ? getLocation(selected) : null;
  const idle: IdleMode = reduce ? "none" : phase === "overview" ? "overview" : phase === "focus" ? "focus" : "none";
  const hud = phase === "overview" || phase === "focus" || phase === "travel";

  return (
    <div className="realm-root fixed inset-0 overflow-hidden bg-[#05030d] text-ivory" data-phase={phase} data-dest={dest}>
      {supported && (
        <KingdomCanvas
          quality={quality}
          command={command}
          idle={idle}
          selected={selected}
          focusMode={dest === "site" && phase !== "overview"}
          frame={dest === "site" && (phase === "focus" || phase === "travel") ? "panel" : "center"}
          markersVisible={hud}
          onSelect={(id) => flyTo(id)}
          onPortal={(id) => {
            // the doorway in the scene: enter when this territory is in focus, otherwise fly there first
            if (phase === "focus" && selected === id) enter();
            else if (phase === "overview" || phase === "focus") flyTo(id);
          }}
          onArrive={onArrive}
          onReady={onReady}
        />
      )}

      {/* cinematic letterbox during the entrance */}
      <AnimatePresence>
        {phase === "intro" && (
          <>
            <motion.div key="lb-top" className="pointer-events-none fixed inset-x-0 top-0 z-20 h-[9vh] bg-black" initial={{ y: "-100%" }} animate={{ y: 0 }} exit={{ y: "-100%" }} transition={{ duration: 1.2 }} />
            <motion.div key="lb-bot" className="pointer-events-none fixed inset-x-0 bottom-0 z-20 h-[9vh] bg-black" initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ duration: 1.2 }} />
          </>
        )}
      </AnimatePresence>

      {/* entrance titles */}
      <AnimatePresence>
        {phase === "intro" && (
          <motion.div key="title" className="pointer-events-none fixed inset-0 z-30 flex flex-col items-center justify-center text-center" exit={{ opacity: 0, transition: { duration: 0.8 } }}>
            <motion.p initial={{ opacity: 0, letterSpacing: "1em" }} animate={{ opacity: [0, 1, 1, 0], letterSpacing: "0.55em" }} transition={{ duration: 9, times: [0, 0.15, 0.75, 1], delay: 1 }} className="font-display text-[10px] uppercase text-gold/80 sm:text-xs">
              The Mystic Realms
            </motion.p>
            <motion.h1 initial={{ opacity: 0, scale: 1.08, filter: "blur(12px)" }} animate={{ opacity: [0, 1, 1, 0], scale: 1, filter: "blur(0px)" }} transition={{ duration: 9, times: [0, 0.18, 0.75, 1], delay: 1.4 }} className="mt-4 font-display text-6xl tracking-[0.25em] text-gilded sm:text-8xl">
              ASTRA
            </motion.h1>
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: [0, 1, 1, 0] }} transition={{ duration: 8, times: [0, 0.2, 0.75, 1], delay: 2.6 }} className="mt-5 font-serif text-lg italic text-ivory/85 sm:text-2xl">
              Beyond the Stars. Beyond Destiny.
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>
      {phase === "intro" && (
        <button type="button" onClick={skipIntro} className="fixed bottom-[11vh] right-5 z-40 rounded-full border border-white/20 bg-black/40 px-4 py-2 text-xs tracking-[0.2em] text-ivory/80 backdrop-blur transition hover:border-gold/60 hover:text-gold-bright">
          SKIP ›
        </button>
      )}

      {/* top bar */}
      <AnimatePresence>
        {hud && (
          <motion.header key="top" initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="pointer-events-none fixed inset-x-0 top-0 z-30 flex items-center gap-3 px-4 py-3 sm:px-6 [&>*]:pointer-events-auto">
            <Link href="/" className="font-display text-sm tracking-[0.35em] text-gilded" aria-label="ASTRA หน้าแรก">
              ✦ ASTRA
            </Link>
            <span className="hidden font-display text-[10px] uppercase tracking-[0.35em] text-ivory/50 sm:inline">The Mystic Realms</span>
            <div className="ml-auto flex items-center gap-2 text-xs">
              <label className="sr-only" htmlFor="realm-quality">คุณภาพกราฟิก</label>
              <select id="realm-quality" value={quality} onChange={(e) => changeQuality(e.target.value as Quality)} className="rounded-full border border-white/15 bg-black/50 px-3 py-1.5 text-ivory/80 backdrop-blur">
                <option value="low">กราฟิก: Low</option>
                <option value="medium">กราฟิก: Medium</option>
                <option value="high">กราฟิก: High</option>
              </select>
              <button type="button" onClick={() => setShowMap((s) => !s)} aria-pressed={showMap} className="rounded-full border border-white/15 bg-black/50 px-3 py-1.5 text-ivory/80 backdrop-blur hover:text-ivory">
                แผนที่
              </button>
            </div>
          </motion.header>
        )}
      </AnimatePresence>

      {/* mini-map */}
      <AnimatePresence>
        {hud && showMap && (
          <motion.div key="map" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="fixed right-4 top-16 z-30 rounded-full shadow-[0_0_40px_-10px_#e6c47a] sm:right-6">
            <MiniMap selected={selected} onSelect={(id) => flyTo(id)} size={150} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* location rail */}
      <AnimatePresence>
        {(phase === "overview" || (phase === "travel" && dest === "overview")) && (
          <motion.nav key="rail" aria-label="ดินแดนในอาณาจักร" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 30 }} className="pointer-events-none fixed inset-x-0 bottom-0 z-30 px-3 pb-4 sm:px-6 sm:pb-6">
            <p className="mb-2 text-center font-display text-[10px] uppercase tracking-[0.4em] text-gold/80">Choose your destination · ← → เพื่อเลือก</p>
            <ul className="no-scrollbar pointer-events-auto mx-auto flex w-fit max-w-full gap-2 overflow-x-auto pb-1 sm:flex-wrap sm:justify-center sm:overflow-visible lg:max-w-6xl [@media(max-height:500px)]:flex-nowrap [@media(max-height:500px)]:overflow-x-auto">
              {LOCATIONS.map((l) => (
                <li key={l.id} className="shrink-0">
                  <button type="button" onClick={() => flyTo(l.id)} className={`realm-chip ${selected === l.id ? "is-selected" : ""}`} style={{ ["--c" as string]: l.color }}>
                    <span className="font-display text-[10px] text-gold/70">{l.index}</span>
                    <span className="block text-left">
                      <span className="block font-display text-[12px] tracking-wide text-ivory">{l.name}</span>
                      <span className="block text-[10px] text-mist/70">{l.nameTh}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </motion.nav>
        )}
      </AnimatePresence>

      {/* focus panel */}
      <AnimatePresence>
        {loc && dest === "site" && (phase === "focus" || phase === "travel") && (
          <motion.aside
            key={loc.id}
            aria-label={loc.name}
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: phase === "focus" ? 1 : 0.55, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.6 }}
            className="realm-panel fixed bottom-4 left-4 right-4 z-30 max-h-[calc(100dvh-5.5rem)] max-w-md overflow-y-auto overscroll-contain rounded-3xl p-5 sm:bottom-8 sm:left-8 sm:right-auto sm:max-h-[calc(100dvh-6.5rem)] sm:p-6 [@media(max-height:500px)]:bottom-3 [@media(max-height:500px)]:max-h-[calc(100dvh-4.5rem)] [@media(max-height:500px)]:p-4"
            style={{ ["--c" as string]: loc.color }}
          >
            <p className="font-display text-[10px] uppercase tracking-[0.4em]" style={{ color: loc.color }}>
              Territory {loc.index}
            </p>
            <h2 className="mt-1 font-display text-2xl text-gilded sm:text-3xl">{loc.name}</h2>
            <p className="font-thai-display text-sm text-ivory/80">{loc.nameTh}</p>
            <p className="mt-3 font-serif text-[15px] leading-relaxed text-ivory/80 [@media(max-height:500px)]:hidden">{loc.blurb}</p>

            <div className="mt-4 flex items-center gap-3 rounded-2xl border border-white/10 bg-black/30 p-2 pr-4">
              <PersonaAvatar id={loc.guardian.personaId} size={48} />
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-[0.25em] text-mist/60">Guardian</p>
                <p className="truncate font-display text-sm" style={{ color: loc.color }}>{loc.guardian.name}</p>
                <p className="truncate text-[11px] text-ivory/60">{loc.guardian.title}</p>
              </div>
            </div>

            <div className="mt-4 flex gap-1.5" role="radiogroup" aria-label="มุมกล้อง">
              {SHOTS.map((s, i) => (
                <button key={s.kind} type="button" role="radio" aria-checked={shot === s.kind} disabled={phase !== "focus"} onClick={() => flyTo(loc.id, s.kind)} className={`flex-1 rounded-full px-2 py-1.5 text-[11px] transition disabled:opacity-50 ${shot === s.kind ? "bg-white/15 text-white" : "border border-white/10 text-ivory/60 hover:text-ivory"}`}>
                  <span className="mr-1 text-gold/60">{i + 1}</span>
                  {s.label}
                </button>
              ))}
            </div>

            <div className="mt-4 flex gap-2">
              <button type="button" onClick={enter} disabled={phase !== "focus"} className="flex-1 rounded-full bg-gradient-to-b from-gold-bright to-gold-deep px-4 py-2.5 font-display text-xs tracking-[0.2em] text-void transition enabled:hover:brightness-110 disabled:opacity-50">
                {loc.room ? "ENTER ✦ เข้าสู่ห้อง" : "ENTER ✦ ท้องพระโรง"}
              </button>
              <button type="button" onClick={() => toOverview()} disabled={phase !== "focus"} className="rounded-full border border-white/20 px-4 py-2.5 text-xs text-ivory/80 transition hover:border-gold/60 disabled:opacity-50">
                ↖ อาณาจักร
              </button>
            </div>
            <p className="mt-3 hidden text-[10px] text-mist/50 sm:block [@media(max-height:500px)]:hidden">Enter = เข้าห้อง · 1/2/3 = มุมกล้อง · Esc = กลับภาพรวม</p>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* portal flash */}
      <AnimatePresence>
        {(phase === "entering" || flash) && loc && (
          <motion.div
            key="portal"
            className="pointer-events-none fixed inset-0 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: flash ? 1 : 0.35 }}
            transition={{ duration: flash ? 0.5 : 1.4 }}
            style={{ background: `radial-gradient(circle at 50% 50%, #fff 0%, ${loc.color} 18%, ${loc.color}55 40%, transparent 70%)` }}
          />
        )}
      </AnimatePresence>

      {/* loading veil */}
      <AnimatePresence>
        {phase === "loading" && (
          <motion.div key="loading" className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#05030d]" exit={{ opacity: 0, transition: { duration: 1.2 } }} role="status" aria-live="polite">
            <div className="relative h-24 w-24">
              <div className="absolute inset-0 animate-spin rounded-full border border-gold/20 border-t-gold [animation-duration:2.4s]" />
              <div className="absolute inset-3 animate-spin rounded-full border border-lilac/20 border-b-lilac [animation-direction:reverse] [animation-duration:3.2s]" />
              <span className="absolute inset-0 flex items-center justify-center text-2xl text-gold">✦</span>
            </div>
            <p className="mt-6 font-display text-xs uppercase tracking-[0.5em] text-gold/80">Summoning the Realm</p>
            <p className="mt-2 text-xs text-mist/60">กำลังเสกอาณาจักรขึ้นจากความมืด…</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/** 2D navigator for devices without WebGL. */
function Fallback2D() {
  const { travelTo } = useAstra();
  const router = useRouter();
  const [sel, setSel] = useState<LocationId>("castle");
  const loc = getLocation(sel)!;
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-[radial-gradient(ellipse_at_top,#1a0f3a,#05030d)] px-4 py-16 text-center text-ivory">
      <h1 className="font-display text-4xl tracking-[0.25em] text-gilded">ASTRA</h1>
      <p className="font-serif italic text-ivory/80">Beyond the Stars. Beyond Destiny.</p>
      <p className="max-w-md text-xs text-mist/70">อุปกรณ์นี้ไม่รองรับ WebGL จึงแสดงแผนที่ 2 มิติแทน</p>
      <MiniMap selected={sel} onSelect={setSel} size={320} labels />
      <div className="realm-panel max-w-md rounded-3xl p-5" style={{ ["--c" as string]: loc.color }}>
        <h2 className="font-display text-xl text-gilded">{loc.name}</h2>
        <p className="mt-2 text-sm text-ivory/80">{loc.blurb}</p>
        <button type="button" onClick={(e) => (loc.room ? travelTo(loc.room, { x: e.clientX, y: e.clientY }) : router.push("/profile"))} className="mt-4 rounded-full bg-gradient-to-b from-gold-bright to-gold-deep px-6 py-2 text-xs text-void">
          เข้าสู่ {loc.nameTh}
        </button>
      </div>
    </div>
  );
}
