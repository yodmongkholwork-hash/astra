/**
 * Static/CSS-animated atmosphere layers (server-safe, no JS):
 *  - Nebula: layered radial gradients that slowly breathe
 *  - Mist: two parallax fog strips drifting horizontally
 *  - Motes: floating golden particles
 */

export function Nebula({ colors = ["#4b1d6e", "#13235e", "#6b2a5a"] }: { colors?: [string, string, string] | string[] }) {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div
        className="absolute -left-[20%] -top-[20%] h-[80vmax] w-[80vmax] rounded-full opacity-60 blur-3xl animate-pulse-glow"
        style={{ background: `radial-gradient(circle, ${colors[0]}aa 0%, transparent 65%)` }}
      />
      <div
        className="absolute -right-[25%] top-[10%] h-[70vmax] w-[70vmax] rounded-full opacity-50 blur-3xl animate-pulse-glow [animation-delay:-2s]"
        style={{ background: `radial-gradient(circle, ${colors[1]}aa 0%, transparent 65%)` }}
      />
      <div
        className="absolute bottom-[-30%] left-[20%] h-[60vmax] w-[60vmax] rounded-full opacity-40 blur-3xl animate-pulse-glow [animation-delay:-3.5s]"
        style={{ background: `radial-gradient(circle, ${colors[2]}aa 0%, transparent 65%)` }}
      />
    </div>
  );
}

export function Mist({ className = "", opacity = 1 }: { className?: string; opacity?: number }) {
  return (
    <div aria-hidden className={`pointer-events-none absolute inset-x-0 overflow-hidden ${className}`} style={{ opacity }}>
      <div className="mist-layer absolute inset-y-0 left-0 animate-mist blur-xl" />
      <div className="mist-layer absolute inset-y-0 left-0 animate-mist opacity-70 blur-2xl [animation-duration:95s] [animation-direction:reverse]" />
    </div>
  );
}

/** Deterministic pseudo-random so server and client markup match. */
const prand = (i: number, salt: number) => {
  const x = Math.sin(i * 127.1 + salt * 311.7) * 43758.5453;
  return x - Math.floor(x);
};

export function Motes({ count = 28, color = "#e6c47a" }: { count?: number; color?: string }) {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {Array.from({ length: count }, (_, i) => {
        const size = 1.5 + prand(i, 1) * 3;
        return (
          <span
            key={i}
            className="absolute rounded-full animate-twinkle"
            style={{
              left: `${prand(i, 2) * 100}%`,
              top: `${prand(i, 3) * 100}%`,
              width: size,
              height: size,
              background: color,
              boxShadow: `0 0 ${size * 4}px ${color}`,
              animationDuration: `${3 + prand(i, 4) * 5}s`,
              animationDelay: `-${prand(i, 5) * 6}s`,
            }}
          />
        );
      })}
    </div>
  );
}

/** Large constellation lines drawn in SVG with a slow stroke reveal. */
export function Constellations() {
  const groups = [
    // [x,y] in a 1000x600 viewbox
    [[90, 120], [150, 90], [215, 130], [260, 95], [320, 140]],
    [[760, 80], [800, 140], [870, 120], [905, 185], [840, 210]],
    [[640, 470], [700, 430], [760, 455], [735, 520]],
    [[120, 430], [170, 470], [150, 530], [220, 545]],
  ];
  return (
    <svg aria-hidden viewBox="0 0 1000 600" preserveAspectRatio="xMidYMid slice" className="pointer-events-none absolute inset-0 h-full w-full opacity-40">
      <defs>
        <filter id="cglow">
          <feGaussianBlur stdDeviation="1.5" />
        </filter>
      </defs>
      {groups.map((pts, gi) => (
        <g key={gi}>
          <polyline
            points={pts.map((p) => p.join(",")).join(" ")}
            fill="none"
            stroke="#e6c47a"
            strokeWidth="0.6"
            strokeDasharray="600"
            strokeDashoffset="600"
          >
            <animate attributeName="stroke-dashoffset" from="600" to="0" dur="6s" begin={`${gi * 1.2}s`} fill="freeze" />
          </polyline>
          {pts.map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r="2" fill="#f7e1a6" filter="url(#cglow)" className="animate-twinkle" style={{ animationDelay: `${(gi + i) * 0.4}s`, transformOrigin: `${x}px ${y}px` }} />
          ))}
        </g>
      ))}
    </svg>
  );
}
