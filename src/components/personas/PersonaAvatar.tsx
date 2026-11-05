import type { ReactNode } from "react";

/**
 * Hand-built SVG portraits for each AI oracle.
 * Idle animation is pure CSS (breathe / blink / sway / aura) so dozens of
 * avatars can be on screen cheaply; reduced-motion users get a still portrait.
 * Replace with commissioned illustrations / Lottie later by keeping the same props.
 */

type Props = { id: string; size?: number; className?: string; animated?: boolean };

const STAR = "M100 18 L121 78 L184 80 L134 118 L152 180 L100 143 L48 180 L66 118 L16 80 L79 78 Z";

function Face({ skin, shade }: { skin: string; shade: string }) {
  return (
    <>
      <path d="M91 122 L91 150 Q100 156 109 150 L109 122 Z" fill={shade} />
      <path d="M70 92 Q70 56 100 56 Q130 56 130 92 Q130 122 100 134 Q70 122 70 92 Z" fill={skin} />
      <path d="M70 92 Q70 122 100 134 Q84 120 80 96 Z" fill={shade} opacity=".35" />
    </>
  );
}

function Eyes({ iris, mode = "open" }: { iris: string; mode?: "open" | "soft" | "closed" | "glow" }) {
  if (mode === "closed")
    return (
      <g className="avatar-blink">
        <path d="M82 96 Q88 91 94 96" stroke="#3a2230" strokeWidth="2" fill="none" strokeLinecap="round" />
        <path d="M106 96 Q112 91 118 96" stroke="#3a2230" strokeWidth="2" fill="none" strokeLinecap="round" />
      </g>
    );
  const lid = mode === "soft";
  return (
    <g className="avatar-blink">
      {[88, 112].map((cx) => (
        <g key={cx}>
          <path d={`M${cx - 7} 96 Q${cx} ${lid ? 92 : 89} ${cx + 7} 96 Q${cx} ${lid ? 99 : 101} ${cx - 7} 96 Z`} fill={mode === "glow" ? "#0b0b14" : "#fbf7ff"} />
          <circle cx={cx} cy={lid ? 96.2 : 95.5} r={lid ? 2.6 : 3.2} fill={iris} />
          {mode === "glow" && <circle cx={cx} cy={95.5} r="6" fill={iris} opacity=".35" />}
          <circle cx={cx + 1} cy={94.5} r=".9" fill="#fff" />
          <path d={`M${cx - 7.5} 95.5 Q${cx} ${lid ? 91 : 88} ${cx + 7.5} 95.5`} stroke="#241428" strokeWidth="1.6" fill="none" strokeLinecap="round" />
        </g>
      ))}
    </g>
  );
}

function Avatar({ aura, children, animated }: { aura: string; children: ReactNode; animated: boolean }) {
  return (
    <>
      <defs>
        <radialGradient id={`aura-${aura.slice(1)}`}>
          <stop offset="0" stopColor={aura} stopOpacity=".75" />
          <stop offset=".55" stopColor={aura} stopOpacity=".18" />
          <stop offset="1" stopColor={aura} stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="100" cy="110" r="96" fill={`url(#aura-${aura.slice(1)})`} className={animated ? "avatar-aura" : ""} />
      <g className={animated ? "avatar-breathe" : ""}>{children}</g>
    </>
  );
}

const PORTRAITS: Record<string, { aura: string; draw: () => ReactNode }> = {
  "madame-luna": {
    aura: "#9b7bff",
    draw: () => (
      <>
        {/* hood back */}
        <path d="M52 112 Q46 38 100 30 Q154 38 148 112 L160 200 Q100 176 40 200 Z" fill="#2b1650" />
        {/* robe */}
        <path d="M26 240 Q32 168 100 152 Q168 168 174 240 Z" fill="#3a1d6b" />
        <path d="M100 152 L86 240 M100 152 L114 240" stroke="#e6c47a" strokeWidth="1.4" opacity=".7" />
        <Face skin="#f1d9cf" shade="#c79f9a" />
        {/* silver hair */}
        <path d="M68 96 Q66 54 100 50 Q134 54 132 96 Q126 70 100 66 Q76 68 68 96 Z" fill="#dcd8ee" />
        <path d="M68 92 Q60 130 70 160 Q74 130 76 100 Z M132 92 Q140 130 130 160 Q126 130 124 100 Z" fill="#cfcae6" />
        {/* hood front rim */}
        <path d="M58 112 Q54 44 100 38 Q146 44 142 112" stroke="#6b3fa0" strokeWidth="6" fill="none" />
        {/* crescent circlet */}
        <path d="M100 58 a7 7 0 1 0 6 10 a5.5 5.5 0 1 1 -6 -10 Z" fill="#f7e1a6" />
        <circle cx="100" cy="71" r="1.6" fill="#c9b6ff" />
        <Eyes iris="#8b6cff" mode="soft" />
        <path d="M82 86 Q88 83 94 85 M106 85 Q112 83 118 86" stroke="#8d86a8" strokeWidth="1.3" fill="none" />
        <path d="M94 115 Q100 119 106 115 Q100 117 94 115 Z" fill="#8a2f5f" stroke="#8a2f5f" strokeWidth="1.2" strokeLinejoin="round" />
        <circle cx="100" cy="166" r="5" fill="#c9b6ff" opacity=".85" />
      </>
    ),
  },
  "the-truth": {
    aura: "#e05a4a",
    draw: () => (
      <>
        <path d="M24 240 Q30 166 100 150 Q170 166 176 240 Z" fill="#1a0f14" />
        <path d="M100 150 L70 240 L84 240 L100 176 L116 240 L130 240 Z" fill="#7a1c1c" />
        <path d="M78 150 L100 182 L122 150" stroke="#e6c47a" strokeWidth="2" fill="none" />
        <Face skin="#d9b49a" shade="#a57d66" />
        {/* sharp dark hair */}
        <path d="M68 92 Q64 50 100 48 Q138 50 132 92 L126 70 L116 78 L108 64 L98 76 L88 62 L80 78 L74 70 Z" fill="#15101a" />
        {/* angular gold mask */}
        <path d="M68 84 L100 76 L132 84 L128 102 L112 106 L100 100 L88 106 L72 102 Z" fill="#c99a45" />
        <path d="M68 84 L100 76 L132 84 L128 90 L100 82 L72 90 Z" fill="#f7e1a6" opacity=".6" />
        <g className="avatar-blink">
          <path d="M80 93 L94 92 L90 97 Z M120 93 L106 92 L110 97 Z" fill="#120a0a" />
        </g>
        {/* all-seeing third eye */}
        <g className="avatar-twinkle">
          <ellipse cx="100" cy="66" rx="7" ry="4" fill="#120a0a" stroke="#f7e1a6" strokeWidth="1" />
          <circle cx="100" cy="66" r="2.4" fill="#ff5a3d" />
          <circle cx="100" cy="66" r="7" fill="#ff5a3d" opacity=".25" />
        </g>
        <path d="M92 118 L108 118" stroke="#5a2a24" strokeWidth="2.2" strokeLinecap="round" />
      </>
    ),
  },
  aurora: {
    aura: "#ff9ec7",
    draw: () => (
      <>
        {/* aurora halo */}
        <path d="M44 80 Q100 2 156 80" stroke="#7af0e0" strokeWidth="5" fill="none" opacity=".55" />
        <path d="M52 84 Q100 18 148 84" stroke="#ff9ec7" strokeWidth="4" fill="none" opacity=".6" />
        <path d="M60 88 Q100 32 140 88" stroke="#f7e1a6" strokeWidth="3" fill="none" opacity=".7" />
        {/* long hair back */}
        <path d="M64 90 Q56 150 46 210 Q100 196 154 210 Q144 150 136 90 Q130 52 100 50 Q70 52 64 90 Z" fill="#e7a974" />
        <path d="M30 240 Q36 172 100 156 Q164 172 170 240 Z" fill="#f2d1c4" />
        <path d="M30 240 Q36 172 100 156 Q164 172 170 240 L150 240 Q140 190 100 178 Q60 190 50 240 Z" fill="#ffb6a0" opacity=".6" />
        <Face skin="#f7dccb" shade="#d9a892" />
        {/* fringe */}
        <path d="M70 92 Q72 58 100 56 Q128 58 130 92 Q118 72 104 70 Q96 82 80 80 Q74 86 70 92 Z" fill="#f0b884" />
        {/* flower */}
        <g transform="translate(126 70)">
          {[0, 72, 144, 216, 288].map((r) => (
            <ellipse key={r} cx="0" cy="-5" rx="3.6" ry="5.5" fill="#ff9ec7" transform={`rotate(${r})`} />
          ))}
          <circle r="2.6" fill="#f7e1a6" />
        </g>
        <Eyes iris="#7a4a2a" mode="closed" />
        <ellipse cx="82" cy="106" rx="6" ry="3.2" fill="#ff8fa8" opacity=".45" />
        <ellipse cx="118" cy="106" rx="6" ry="3.2" fill="#ff8fa8" opacity=".45" />
        <path d="M93 114 Q100 121 107 114" stroke="#b5485a" strokeWidth="2" fill="none" strokeLinecap="round" />
      </>
    ),
  },
  "professor-orion": {
    aura: "#5aa0ff",
    draw: () => (
      <>
        <path d="M26 240 Q32 166 100 150 Q168 166 174 240 Z" fill="#14234f" />
        {/* star scarf */}
        <path d="M70 148 Q100 168 130 148 L136 160 Q100 184 64 160 Z" fill="#c99a45" />
        <path d="M112 166 L124 240 L108 240 L104 172 Z" fill="#c99a45" />
        {[78, 96, 116].map((x) => (
          <circle key={x} cx={x} cy={160} r="1.6" fill="#14234f" />
        ))}
        <Face skin="#e8c3a6" shade="#b98e74" />
        {/* grey hair */}
        <path d="M68 96 Q62 60 90 52 Q120 46 132 74 Q134 86 132 96 Q126 74 104 70 Q82 70 72 82 Z" fill="#b9bfd0" />
        {/* beret with star pin */}
        <path d="M64 70 Q70 40 106 42 Q144 46 140 66 Q120 58 96 60 Q76 62 64 70 Z" fill="#1d2f6e" />
        <path d="M128 52 l2 4.5 5 .5 -3.8 3.2 1.2 4.8 -4.4 -2.6 -4.4 2.6 1.2 -4.8 -3.8 -3.2 5 -.5 Z" fill="#f7e1a6" />
        {/* beard */}
        <path d="M78 110 Q80 138 100 142 Q120 138 122 110 Q112 124 100 124 Q88 124 78 110 Z" fill="#c9cede" />
        <Eyes iris="#3b5a8a" mode="open" />
        {/* spectacles */}
        <g fill="none" stroke="#e6c47a" strokeWidth="1.6">
          <circle cx="88" cy="96" r="9.5" />
          <circle cx="112" cy="96" r="9.5" />
          <path d="M97.5 96 Q100 93 102.5 96 M78.5 94 L70 90 M121.5 94 L130 90" />
        </g>
        <circle cx="88" cy="96" r="9.5" fill="#9cc6ff" opacity=".12" />
        <circle cx="112" cy="96" r="9.5" fill="#9cc6ff" opacity=".12" />
        <path d="M80 82 Q88 79 95 82 M105 82 Q112 79 120 82" stroke="#8d93a8" strokeWidth="2" fill="none" strokeLinecap="round" />
        <path d="M93 118 Q100 122 107 118" stroke="#7a4a3a" strokeWidth="1.8" fill="none" strokeLinecap="round" />
      </>
    ),
  },
  "mystic-raven": {
    aura: "#2bc4b0",
    draw: () => (
      <>
        {/* feathered cowl */}
        <path d="M48 120 Q40 36 100 28 Q160 36 152 120 L166 196 L150 186 L156 206 L136 192 L138 212 L118 196 L100 214 L82 196 L62 212 L64 192 L44 206 L50 186 L34 196 Z" fill="#0d0d16" />
        <path d="M24 240 Q30 170 100 154 Q170 170 176 240 Z" fill="#14141f" />
        {/* feather collar */}
        {Array.from({ length: 9 }, (_, i) => {
          const x = 52 + i * 12;
          return <path key={i} d={`M${x} 160 L${x + 6} 186 L${x + 12} 160 Z`} fill={i % 2 ? "#1d2a33" : "#0f1a20"} stroke="#2bc4b0" strokeOpacity=".35" strokeWidth=".6" />;
        })}
        <Face skin="#c9bdc4" shade="#8f7f8c" />
        {/* dark hair center part */}
        <path d="M70 100 Q66 54 100 52 Q134 54 130 100 Q124 66 100 64 Q76 66 70 100 Z" fill="#090910" />
        <path d="M54 118 Q48 44 100 36 Q152 44 146 118" stroke="#1f3a3f" strokeWidth="3" fill="none" />
        {/* forehead sigil */}
        <path d="M100 68 L104 76 L100 84 L96 76 Z" fill="#2bc4b0" className="avatar-twinkle" />
        <Eyes iris="#7af0e0" mode="glow" />
        <path d="M80 85 L95 88 M120 85 L105 88" stroke="#22121c" strokeWidth="2" strokeLinecap="round" />
        <path d="M93 116 Q100 113 107 116 Q100 120 93 116 Z" fill="#3a1030" />
        {/* raven on shoulder */}
        <g transform="translate(140 132)" className="avatar-sway">
          <path d="M0 22 Q-2 6 10 0 Q20 -2 24 6 L32 6 L24 10 Q26 22 14 30 L6 40 L4 30 Z" fill="#05050a" />
          <circle cx="16" cy="6" r="1.4" fill="#7af0e0" />
        </g>
      </>
    ),
  },
  "little-star": {
    aura: "#ffd35a",
    draw: () => (
      <>
        <defs>
          <linearGradient id="star-body" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#fff4c2" />
            <stop offset="1" stopColor="#ffc94a" />
          </linearGradient>
        </defs>
        <g className="avatar-sway">
          <path d={STAR} transform="translate(0 32)" fill="url(#star-body)" stroke="#f7e1a6" strokeWidth="3" strokeLinejoin="round" />
          {/* face */}
          <g transform="translate(0 30)">
            <g className="avatar-blink">
              <ellipse cx="86" cy="104" rx="5" ry="7" fill="#3a2420" />
              <ellipse cx="114" cy="104" rx="5" ry="7" fill="#3a2420" />
              <circle cx="88" cy="101" r="2" fill="#fff" />
              <circle cx="116" cy="101" r="2" fill="#fff" />
            </g>
            <ellipse cx="76" cy="116" rx="6" ry="3.5" fill="#ff8fa8" opacity=".6" />
            <ellipse cx="124" cy="116" rx="6" ry="3.5" fill="#ff8fa8" opacity=".6" />
            <path d="M92 116 Q100 126 108 116 Z" fill="#c2414f" />
          </g>
        </g>
        {/* orbiting sparkles */}
        {[
          [36, 50, 0],
          [168, 64, 0.8],
          [160, 196, 1.6],
          [30, 180, 2.4],
        ].map(([x, y, d]) => (
          <path key={x} d={`M${x} ${y - 7} L${x + 2} ${y - 2} L${x + 7} ${y} L${x + 2} ${y + 2} L${x} ${y + 7} L${x - 2} ${y + 2} L${x - 7} ${y} L${x - 2} ${y - 2} Z`} fill="#fff6dc" className="avatar-twinkle" style={{ animationDelay: `${d}s` }} />
        ))}
      </>
    ),
  },
};

export default function PersonaAvatar({ id, size = 160, className = "", animated = true }: Props) {
  const p = PORTRAITS[id] ?? PORTRAITS["madame-luna"];
  return (
    <svg viewBox="0 0 200 240" width={size} height={size * 1.2} className={className} role="img" aria-label={id.replace("-", " ")}>
      <Avatar aura={p.aura} animated={animated}>
        {p.draw()}
      </Avatar>
    </svg>
  );
}
