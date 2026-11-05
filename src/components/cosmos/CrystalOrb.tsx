import { ZODIAC } from "@/lib/engines";

/**
 * The glowing crystal ball at the heart of the Universe.
 * Pure CSS/SVG: layered gradients, a swirling conic core, two counter-rotating
 * astrolabe rings carrying the zodiac glyphs, and a bronze stand.
 */
export default function CrystalOrb({ size = 360 }: { size?: number }) {
  return (
    <div className="relative mx-auto" style={{ width: size, height: size * 1.12 }} aria-hidden>
      {/* outer halo */}
      <div
        className="absolute left-1/2 top-[44%] -translate-x-1/2 -translate-y-1/2 rounded-full blur-2xl animate-pulse-glow"
        style={{ width: size * 1.25, height: size * 1.25, background: "radial-gradient(circle, rgba(155,123,255,.45) 0%, rgba(230,196,122,.12) 45%, transparent 70%)" }}
      />

      {/* astrolabe ring — zodiac */}
      <svg viewBox="0 0 200 200" className="absolute left-1/2 top-[44%] -translate-x-1/2 -translate-y-1/2 animate-spin-slow" style={{ width: size * 1.08, height: size * 1.08 }}>
        <circle cx="100" cy="100" r="96" fill="none" stroke="#e6c47a" strokeOpacity=".45" strokeWidth=".4" />
        <circle cx="100" cy="100" r="86" fill="none" stroke="#e6c47a" strokeOpacity=".25" strokeWidth=".3" strokeDasharray="1 2.2" />
        {ZODIAC.map((z, i) => {
          const a = (i / 12) * Math.PI * 2 - Math.PI / 2;
          const x = 100 + Math.cos(a) * 91;
          const y = 100 + Math.sin(a) * 91;
          return (
            <text key={z.key} x={x} y={y} fontSize="6.5" fill="#f7e1a6" fillOpacity=".85" textAnchor="middle" dominantBaseline="central" style={{ fontFamily: "serif" }}>
              {z.glyph}
            </text>
          );
        })}
        {Array.from({ length: 72 }, (_, i) => {
          const a = (i / 72) * Math.PI * 2;
          const r1 = 96;
          const r2 = i % 6 === 0 ? 99.5 : 97.8;
          return <line key={i} x1={100 + Math.cos(a) * r1} y1={100 + Math.sin(a) * r1} x2={100 + Math.cos(a) * r2} y2={100 + Math.sin(a) * r2} stroke="#e6c47a" strokeOpacity=".5" strokeWidth=".3" />;
        })}
      </svg>

      {/* tilted inner ring */}
      <div className="absolute left-1/2 top-[44%]" style={{ width: size * 0.95, height: size * 0.95, transform: "translate(-50%,-50%) perspective(700px) rotateX(72deg)" }}>
        <div className="h-full w-full rounded-full border border-gold/50 animate-spin-reverse" style={{ boxShadow: "0 0 18px rgba(230,196,122,.35)" }}>
          <span className="absolute -top-1 left-1/2 h-2 w-2 -translate-x-1/2 rounded-full bg-gold-bright shadow-[0_0_12px_#f7e1a6]" />
        </div>
      </div>

      {/* the sphere */}
      <div
        className="absolute left-1/2 top-[44%] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-full"
        style={{
          width: size * 0.66,
          height: size * 0.66,
          background: "radial-gradient(circle at 35% 30%, rgba(255,255,255,.55) 0%, rgba(201,182,255,.35) 12%, rgba(107,63,160,.55) 38%, rgba(26,12,60,.9) 72%, rgba(8,4,20,1) 100%)",
          boxShadow: "inset -18px -24px 60px rgba(0,0,0,.6), inset 10px 14px 40px rgba(255,255,255,.12), 0 0 80px rgba(155,123,255,.55), 0 0 160px rgba(230,196,122,.18)",
        }}
      >
        {/* swirling nebula core */}
        <div
          className="absolute inset-[-30%] animate-spin-slow opacity-70 mix-blend-screen [animation-duration:28s]"
          style={{ background: "conic-gradient(from 0deg, transparent 0deg, rgba(247,225,166,.35) 40deg, transparent 90deg, rgba(155,123,255,.45) 170deg, transparent 230deg, rgba(122,240,224,.25) 300deg, transparent 360deg)", filter: "blur(14px)" }}
        />
        <div
          className="absolute inset-[-20%] animate-spin-reverse opacity-60 mix-blend-screen [animation-duration:40s]"
          style={{ background: "conic-gradient(from 90deg, transparent, rgba(255,158,199,.3) 60deg, transparent 140deg, rgba(90,160,255,.35) 250deg, transparent)", filter: "blur(18px)" }}
        />
        {/* inner star */}
        <div className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-[0_0_30px_10px_rgba(247,225,166,.7)] animate-pulse-glow" />
        {/* glass highlight */}
        <div className="absolute left-[18%] top-[12%] h-[22%] w-[36%] -rotate-[25deg] rounded-full bg-white/25 blur-md" />
      </div>

      {/* stand */}
      <svg viewBox="0 0 200 60" className="absolute left-1/2 -translate-x-1/2" style={{ width: size * 0.62, top: size * 0.44 + size * 0.28 }}>
        <defs>
          <linearGradient id="bronze" x1="0" x2="1">
            <stop offset="0" stopColor="#5a3a14" />
            <stop offset=".35" stopColor="#e6c47a" />
            <stop offset=".55" stopColor="#f7e1a6" />
            <stop offset="1" stopColor="#5a3a14" />
          </linearGradient>
        </defs>
        <path d="M45 6 Q100 22 155 6 L140 30 Q100 40 60 30 Z" fill="url(#bronze)" />
        <path d="M60 30 Q100 40 140 30 L150 48 Q100 60 50 48 Z" fill="url(#bronze)" opacity=".85" />
        <ellipse cx="100" cy="50" rx="58" ry="6" fill="#000" opacity=".4" />
      </svg>
    </div>
  );
}
