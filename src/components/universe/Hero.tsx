"use client";

import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import CrystalOrb from "@/components/cosmos/CrystalOrb";
import { useAstra } from "@/components/providers/AstraProvider";

const LETTERS = "ASTRA".split("");

export default function Hero() {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { travelTo } = useAstra();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const orbY = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : 140]);
  const fade = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  return (
    <section ref={ref} className="relative flex min-h-[100svh] flex-col items-center justify-center overflow-hidden px-4 pb-16 pt-28 text-center">
      {/* floating objects (desktop) */}
      <FloatingObjects />

      <motion.div style={{ opacity: fade }} className="relative z-10 flex flex-col items-center">
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="font-display text-[10px] uppercase tracking-[0.5em] text-gold/80 sm:text-xs"
        >
          The Fortune Teller Universe
        </motion.p>

        <h1 className="mt-4 flex font-display text-[22vw] leading-none sm:text-[9rem] md:text-[11rem]" aria-label="ASTRA">
          {LETTERS.map((l, i) => (
            <motion.span
              key={i}
              aria-hidden
              className="text-gilded text-gilded-animate inline-block drop-shadow-[0_0_30px_rgba(230,196,122,.25)]"
              initial={reduce ? false : { opacity: 0, y: 40, filter: "blur(12px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ duration: 1.1, delay: 0.35 + i * 0.12, ease: [0.2, 0.7, 0.2, 1] }}
            >
              {l}
            </motion.span>
          ))}
        </h1>

        <motion.div style={{ y: orbY }} className="relative -mt-4 h-[300px] w-[300px] sm:-mt-8 sm:h-[400px] sm:w-[400px]">
          <motion.div
            initial={reduce ? false : { opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.6, delay: 0.6, ease: "easeOut" }}
            className="origin-top scale-[0.83] sm:scale-100"
          >
            <div className="animate-float [animation-duration:9s]">
              <CrystalOrb size={360} />
            </div>
          </motion.div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, delay: 1.3 }} className="-mt-6 sm:-mt-2">
          <p className="font-serif text-2xl italic text-ivory/90 sm:text-3xl">Enter the Universe. Discover Your Destiny.</p>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-mist/80">
            เดินทางผ่านประตูเจ็ดบาน สู่ห้องแห่งศาสตร์พยากรณ์ และพบกับหมอดู AI ที่รอคุณอยู่ในแสงดาว
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a
              href="#chambers"
              className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full border border-gold/60 bg-gradient-to-b from-gold-bright to-gold-deep px-7 py-3 font-display text-sm tracking-[0.15em] text-void shadow-[0_0_30px_-4px_rgba(230,196,122,.6)] transition hover:shadow-[0_0_44px_-2px_rgba(230,196,122,.85)]"
            >
              <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/50 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
              <span className="relative">ENTER THE UNIVERSE</span>
            </a>
            <button
              type="button"
              onClick={(e) => travelTo("tarot", { x: e.clientX, y: e.clientY })}
              className="rounded-full border border-ivory/20 px-7 py-3 text-sm text-ivory/85 backdrop-blur transition hover:border-gold/60 hover:text-gold-bright"
            >
              เปิดไพ่ทันที ✦
            </button>
          </div>
        </motion.div>
      </motion.div>

      {/* scroll cue */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.2 }} className="absolute bottom-6 left-1/2 -translate-x-1/2 text-[10px] tracking-[0.4em] text-ivory/40">
        <div className="flex flex-col items-center gap-2">
          SCROLL
          <span className="block h-8 w-px animate-pulse bg-gradient-to-b from-gold/70 to-transparent" />
        </div>
      </motion.div>
    </section>
  );
}

function FloatingObjects() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 hidden md:block">
      {/* tarot cards */}
      {[
        { l: "9%", t: "28%", r: -14, d: 0 },
        { l: "14%", t: "62%", r: 10, d: -2.5 },
        { l: "84%", t: "34%", r: 12, d: -1.2 },
      ].map((c, i) => (
        <div key={i} className="absolute animate-float" style={{ left: c.l, top: c.t, animationDelay: `${c.d}s`, animationDuration: "8s" }}>
          <div
            className="h-28 w-[4.5rem] rounded-md border border-gold/50 shadow-[0_0_30px_-6px_rgba(230,196,122,.6)]"
            style={{ transform: `rotate(${c.r}deg)`, background: "linear-gradient(160deg,#2a1650,#120826)" }}
          >
            <div className="m-1.5 flex h-[calc(100%-12px)] items-center justify-center rounded-sm border border-gold/30 text-xl text-gold/80">{["☾", "✦", "☉"][i]}</div>
          </div>
        </div>
      ))}
      {/* planets */}
      <div className="absolute right-[10%] top-[66%] animate-float [animation-duration:11s]">
        <div className="relative h-16 w-16 rounded-full shadow-[0_0_40px_rgba(90,160,255,.4)]" style={{ background: "radial-gradient(circle at 35% 30%,#bcd8ff,#3a5fb0 55%,#0b1a45)" }}>
          <div className="absolute left-1/2 top-1/2 h-4 w-28 -translate-x-1/2 -translate-y-1/2 -rotate-12 rounded-[50%] border border-gold/50" />
        </div>
      </div>
      <div className="absolute left-[22%] top-[16%] h-6 w-6 animate-float rounded-full [animation-duration:13s]" style={{ background: "radial-gradient(circle at 35% 30%,#ffe1c9,#c45a3a 60%,#3a1406)", boxShadow: "0 0 24px rgba(224,90,74,.45)" }} />
      <div className="absolute right-[24%] top-[14%] text-2xl text-lilac/70 animate-twinkle">✧</div>
    </div>
  );
}
