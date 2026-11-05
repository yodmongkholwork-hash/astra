"use client";

import { LOCATIONS, type LocationId } from "@/lib/realms/locations";

const R = 340; // world radius represented by the map

/** Top-down SVG map of the kingdom. Used as the HUD mini-map and as the 2D fallback navigator. */
export default function MiniMap({ selected, onSelect, size = 168, labels = false }: { selected: LocationId | null; onSelect: (id: LocationId) => void; size?: number; labels?: boolean }) {
  const toMap = (x: number, z: number) => [50 + (x / R) * 44, 50 + (z / R) * 44];
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} className="block" role="group" aria-label="แผนที่อาณาจักร">
      <defs>
        <radialGradient id="mm-bg">
          <stop offset="0" stopColor="#1c1238" />
          <stop offset="0.7" stopColor="#0d0820" />
          <stop offset="1" stopColor="#05030d" />
        </radialGradient>
      </defs>
      <circle cx="50" cy="50" r="49" fill="url(#mm-bg)" stroke="#e6c47a" strokeOpacity=".45" strokeWidth=".6" />
      <circle cx="50" cy="50" r="44" fill="none" stroke="#e6c47a" strokeOpacity=".12" strokeDasharray="1 2" />
      {/* mountain rim */}
      {Array.from({ length: 28 }, (_, i) => {
        const a = (i / 28) * Math.PI * 2;
        const x = 50 + Math.sin(a) * 46;
        const y = 50 + Math.cos(a) * 46;
        return <path key={i} d={`M${x - 2} ${y + 1.2} L${x} ${y - 1.8} L${x + 2} ${y + 1.2}Z`} fill="#3a3656" opacity=".8" />;
      })}
      {/* moat + river */}
      <circle cx="50" cy="50" r={(111 / R) * 44} fill="none" stroke="#2a8fd6" strokeOpacity=".7" strokeWidth="1.4" />
      <path d={`M${toMap(-160, -560).join(" ")} Q ${toMap(-120, -330).join(" ")} ${toMap(-8, -118).join(" ")}`} fill="none" stroke="#1fb8b0" strokeOpacity=".6" strokeWidth="1" />
      {LOCATIONS.map((l) => {
        const [x, y] = toMap(l.position[0], l.position[2]);
        const on = selected === l.id;
        return (
          <g key={l.id} className="cursor-pointer" onClick={() => onSelect(l.id)}>
            <circle cx={x} cy={y} r={on ? 5.5 : 4} fill={l.color} opacity={on ? 0.25 : 0.12} />
            <circle cx={x} cy={y} r={l.id === "castle" ? 2.6 : 1.8} fill={l.color} stroke={on ? "#fff" : "none"} strokeWidth=".6" />
            {labels && (
              <text x={x} y={y + 7} fontSize="3.2" textAnchor="middle" fill="#f4ead5" opacity=".85">
                {l.name}
              </text>
            )}
            <title>{`${l.name} — ${l.nameTh}`}</title>
          </g>
        );
      })}
    </svg>
  );
}
