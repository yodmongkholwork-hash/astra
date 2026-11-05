import type { RoomSlug } from "@/lib/data/rooms";

/** Small animated illustration of each room, used inside portal doorways. */
export default function RoomEmblem({ slug, glow }: { slug: RoomSlug; glow: string }) {
  const common = { viewBox: "0 0 120 120", className: "h-full w-full", "aria-hidden": true } as const;
  switch (slug) {
    case "tarot":
      return (
        <svg {...common}>
          {[-24, 0, 24].map((r, i) => (
            <g key={r} transform={`rotate(${r} 60 96)`}>
              <g className="animate-float" style={{ animationDelay: `${-i * 1.3}s` }}>
                <rect x="45" y="28" width="30" height="48" rx="3" fill="#1b0d33" stroke={glow} strokeWidth="1.2" />
                <rect x="49" y="32" width="22" height="40" rx="2" fill="none" stroke={glow} strokeOpacity=".5" strokeWidth=".6" />
                <path d="M60 42 l3 8 8 .5 -6 5 2 8 -7 -4.5 -7 4.5 2 -8 -6 -5 8 -.5Z" fill={glow} opacity=".85" />
              </g>
            </g>
          ))}
        </svg>
      );
    case "astrology":
      return (
        <svg {...common}>
          <g className="animate-spin-slow [animation-duration:40s]" style={{ transformOrigin: "60px 60px" }}>
            <circle cx="60" cy="60" r="40" fill="none" stroke={glow} strokeOpacity=".7" strokeWidth=".8" />
            <circle cx="60" cy="60" r="30" fill="none" stroke={glow} strokeOpacity=".35" strokeWidth=".6" />
            {Array.from({ length: 12 }, (_, i) => {
              const a = (i / 12) * Math.PI * 2;
              return <line key={i} x1={60 + Math.cos(a) * 30} y1={60 + Math.sin(a) * 30} x2={60 + Math.cos(a) * 40} y2={60 + Math.sin(a) * 40} stroke={glow} strokeOpacity=".6" strokeWidth=".6" />;
            })}
            <circle cx="100" cy="60" r="3" fill="#f7e1a6" />
            <circle cx="30" cy="38" r="2.2" fill="#9cc6ff" />
          </g>
          <circle cx="60" cy="60" r="8" fill="#f7e1a6" opacity=".9" />
          <circle cx="60" cy="60" r="14" fill="#f7e1a6" opacity=".15" />
        </svg>
      );
    case "thai-astrology":
      return (
        <svg {...common}>
          <path d="M20 46 L60 18 L100 46" fill="none" stroke={glow} strokeWidth="1.4" />
          <path d="M14 48 L60 14 L106 48 M30 46 L22 40 M90 46 L98 40" fill="none" stroke={glow} strokeOpacity=".6" strokeWidth=".8" />
          <circle cx="60" cy="74" r="28" fill="none" stroke={glow} strokeWidth="1" />
          {Array.from({ length: 12 }, (_, i) => {
            const a = (i / 12) * Math.PI * 2;
            return <line key={i} x1={60} y1={74} x2={60 + Math.cos(a) * 28} y2={74 + Math.sin(a) * 28} stroke={glow} strokeOpacity=".35" strokeWidth=".5" />;
          })}
          {["๑", "๕", "๙"].map((n, i) => {
            const a = (i / 3) * Math.PI * 2 - 1;
            return (
              <text key={n} x={60 + Math.cos(a) * 18} y={74 + Math.sin(a) * 18} fontSize="9" fill="#f7e1a6" textAnchor="middle" dominantBaseline="central" className="animate-twinkle" style={{ transformOrigin: "center", transformBox: "fill-box", animationDelay: `${i}s` }}>
                {n}
              </text>
            );
          })}
        </svg>
      );
    case "chinese-astrology":
      return (
        <svg {...common}>
          <g className="animate-spin-slow [animation-duration:24s]" style={{ transformOrigin: "60px 60px" }}>
            <circle cx="60" cy="60" r="30" fill="#0b0b0b" stroke={glow} strokeWidth="1" />
            <path d="M60 30 A30 30 0 0 1 60 90 A15 15 0 0 1 60 60 A15 15 0 0 0 60 30 Z" fill="#f4ead5" />
            <circle cx="60" cy="45" r="4.5" fill="#0b0b0b" />
            <circle cx="60" cy="75" r="4.5" fill="#f4ead5" />
          </g>
          {["#3fbf8f", "#e05a4a", "#c99a45", "#d8dcef", "#5aa0ff"].map((c, i) => {
            const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
            return <circle key={c} cx={60 + Math.cos(a) * 46} cy={60 + Math.sin(a) * 46} r="5" fill={c} className="animate-pulse-glow" style={{ transformOrigin: "center", transformBox: "fill-box", animationDelay: `${i * 0.6}s` }} />;
          })}
        </svg>
      );
    case "numerology":
      return (
        <svg {...common}>
          <g className="animate-spin-reverse [animation-duration:50s]" style={{ transformOrigin: "60px 60px" }}>
            {Array.from({ length: 9 }, (_, i) => {
              const a = (i / 9) * Math.PI * 2 - Math.PI / 2;
              return (
                <text key={i} x={60 + Math.cos(a) * 38} y={60 + Math.sin(a) * 38} fontSize="11" fill={glow} textAnchor="middle" dominantBaseline="central" style={{ fontFamily: "Cinzel, serif", filter: `drop-shadow(0 0 3px ${glow})` }}>
                  {i + 1}
                </text>
              );
            })}
          </g>
          <circle cx="60" cy="60" r="26" fill="none" stroke={glow} strokeOpacity=".4" strokeDasharray="2 3" />
          <text x="60" y="61" fontSize="26" fill="#fff" textAnchor="middle" dominantBaseline="central" style={{ fontFamily: "Cinzel, serif", filter: `drop-shadow(0 0 6px ${glow})` }}>
            7
          </text>
        </svg>
      );
    case "dreams":
      return (
        <svg {...common}>
          <path d="M70 26 a26 26 0 1 0 22 40 a20 20 0 1 1 -22 -40 Z" fill="#f6dff0" opacity=".9" className="animate-float" />
          {[
            [24, 86, 30],
            [54, 98, 34],
            [80, 84, 26],
          ].map(([x, y, rx], i) => (
            <ellipse key={i} cx={x} cy={y} rx={rx} ry="9" fill="#fff" opacity=".12" className="animate-float" style={{ animationDelay: `${-i * 2}s` }} />
          ))}
          <path d="M34 40 l1.5 4 4 1.5 -4 1.5 -1.5 4 -1.5 -4 -4 -1.5 4 -1.5Z" fill={glow} className="animate-twinkle" style={{ transformOrigin: "center", transformBox: "fill-box" }} />
        </svg>
      );
    case "palmistry":
      return (
        <svg {...common}>
          <path
            d="M44 104 Q34 84 36 66 L34 40 Q34 34 39 34 Q44 34 44 40 L46 60 L46 26 Q46 20 51 20 Q56 20 56 26 L57 56 L58 22 Q58 16 63 16 Q68 16 68 22 L68 56 L70 28 Q70 22 75 22 Q80 22 80 28 L80 66 L86 56 Q90 50 95 53 Q99 56 96 62 L84 86 Q78 100 70 106 Z"
            fill="#2a0f22"
            stroke={glow}
            strokeWidth="1.2"
          />
          <path d="M48 72 Q52 90 60 100" stroke="#ff9ec7" strokeWidth="1.6" fill="none" className="animate-pulse-glow" />
          <path d="M46 70 Q60 72 76 80" stroke="#7af0e0" strokeWidth="1.4" fill="none" />
          <path d="M50 62 Q64 60 80 64" stroke="#f7e1a6" strokeWidth="1.4" fill="none" />
        </svg>
      );
  }
}
