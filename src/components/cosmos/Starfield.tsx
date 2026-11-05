"use client";

import { useEffect, useRef } from "react";

/**
 * Canvas starfield: twinkling stars in 3 depth layers, subtle pointer parallax,
 * and occasional shooting stars. Pauses when the tab is hidden, caps DPR,
 * scales star count to screen area, renders a single static frame when the user
 * prefers reduced motion.
 */
interface Star {
  x: number;
  y: number;
  r: number;
  depth: number;
  phase: number;
  speed: number;
  hue: number;
}

export default function Starfield({ density = 1, className = "" }: { density?: number; className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.75);
    let w = 0;
    let h = 0;
    let stars: Star[] = [];
    let raf = 0;
    let running = true;
    const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
    let shooting: { x: number; y: number; vx: number; vy: number; life: number } | null = null;

    const build = () => {
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.min(900, Math.floor(((w * h) / 2600) * density));
      stars = Array.from({ length: count }, () => {
        const depth = Math.random();
        return {
          x: Math.random() * w,
          y: Math.random() * h,
          r: 0.25 + depth * depth * 1.5,
          depth,
          phase: Math.random() * Math.PI * 2,
          speed: 0.4 + Math.random() * 1.6,
          hue: Math.random() < 0.15 ? 40 : Math.random() < 0.3 ? 260 : 220,
        };
      });
    };

    const draw = (t: number) => {
      ctx.clearRect(0, 0, w, h);
      pointer.x += (pointer.tx - pointer.x) * 0.04;
      pointer.y += (pointer.ty - pointer.y) * 0.04;
      for (const s of stars) {
        const tw = reduce ? 0.8 : 0.55 + 0.45 * Math.sin(t * 0.001 * s.speed + s.phase);
        const px = s.x + pointer.x * s.depth * 18;
        const py = s.y + pointer.y * s.depth * 18 - (reduce ? 0 : (t * 0.002 * s.depth) % h);
        const y = ((py % h) + h) % h;
        ctx.globalAlpha = tw * (0.35 + s.depth * 0.65);
        ctx.fillStyle = `hsl(${s.hue} ${s.hue === 40 ? 80 : 60}% ${s.hue === 40 ? 80 : 92}%)`;
        ctx.beginPath();
        ctx.arc(px, y, s.r, 0, Math.PI * 2);
        ctx.fill();
        if (s.r > 1.3) {
          // soft halo for the brightest stars
          ctx.globalAlpha = tw * 0.12;
          ctx.beginPath();
          ctx.arc(px, y, s.r * 4, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      // shooting star
      if (!reduce) {
        if (!shooting && Math.random() < 0.0025) {
          shooting = { x: Math.random() * w * 0.8 + w * 0.2, y: Math.random() * h * 0.4, vx: -7 - Math.random() * 4, vy: 3 + Math.random() * 2, life: 1 };
        }
        if (shooting) {
          const s = shooting;
          const grad = ctx.createLinearGradient(s.x, s.y, s.x - s.vx * 14, s.y - s.vy * 14);
          grad.addColorStop(0, `rgba(255,240,210,${s.life})`);
          grad.addColorStop(1, "rgba(255,240,210,0)");
          ctx.globalAlpha = 1;
          ctx.strokeStyle = grad;
          ctx.lineWidth = 1.4;
          ctx.beginPath();
          ctx.moveTo(s.x, s.y);
          ctx.lineTo(s.x - s.vx * 14, s.y - s.vy * 14);
          ctx.stroke();
          s.x += s.vx;
          s.y += s.vy;
          s.life -= 0.012;
          if (s.life <= 0 || s.x < -50 || s.y > h + 50) shooting = null;
        }
      }
      ctx.globalAlpha = 1;
    };

    const loop = (t: number) => {
      if (!running) return;
      draw(t);
      raf = requestAnimationFrame(loop);
    };

    const onResize = () => {
      build();
      if (reduce) draw(0);
    };
    const onMove = (e: PointerEvent) => {
      pointer.tx = (e.clientX / window.innerWidth - 0.5) * 2;
      pointer.ty = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    const onVisibility = () => {
      running = !document.hidden && !reduce;
      cancelAnimationFrame(raf);
      if (running) raf = requestAnimationFrame(loop);
    };

    build();
    if (reduce) draw(0);
    else raf = requestAnimationFrame(loop);

    const ro = new ResizeObserver(onResize);
    ro.observe(canvas);
    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      running = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [density]);

  return <canvas ref={ref} aria-hidden className={`pointer-events-none absolute inset-0 h-full w-full ${className}`} />;
}
