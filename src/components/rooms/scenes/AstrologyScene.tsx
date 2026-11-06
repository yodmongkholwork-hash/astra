"use client";

import { useMemo } from "react";
import { natalChart } from "@/lib/engines/astro";
import { ZODIAC } from "@/lib/engines";
import BirthDataForm, { birthInput, useBirthData } from "../birth/BirthDataForm";
import { useShareReading } from "../RoomContext";

const ASPECT_COLORS: Record<string, string> = { conjunction: "#f7e1a6", opposition: "#ff7a6b", square: "#ff9a6b", trine: "#7fd1ff", sextile: "#9be7c4" };
// text-style astrological glyphs (avoid colour-emoji presentation)
const SYMBOL_FONT = "'Segoe UI Symbol', 'Noto Sans Symbols 2', 'Noto Sans Symbols', 'DejaVu Sans', 'Apple Symbols', serif";
const EL_TH = { fire: "ไฟ", earth: "ดิน", air: "ลม", water: "น้ำ" } as const;

/**
 * Western natal chart from the real ephemeris (lib/engines/astro).
 * Wheel convention: Ascendant on the left (9 o'clock), zodiac counter-clockwise.
 */
export default function AstrologyScene({ glow }: { glow: string }) {
  const [birth, setBirth] = useBirthData();
  const share = useShareReading();
  const place = birthInput(birth);
  const chart = useMemo(() => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(birth.date)) return null;
    try {
      return natalChart({ date: birth.date, time: birth.time || undefined, lat: place.lat, lon: place.lon, tz: place.tz });
    } catch {
      return null;
    }
  }, [birth.date, birth.time, place.lat, place.lon, place.tz]);

  // angle on the wheel: ASC (or 0° Aries) at 180°, counter-clockwise
  const ref = chart?.ascendant?.lon ?? 0;
  const pt = (lon: number, r: number) => {
    const a = ((180 + (lon - ref)) * Math.PI) / 180;
    return [140 + Math.cos(a) * r, 140 - Math.sin(a) * r] as const;
  };
  // spread planets that sit within 6° of each other onto inner tracks
  const placed = useMemo(() => {
    if (!chart) return [];
    const sorted = [...chart.planets].sort((a, b) => a.lon - b.lon);
    let track = 0;
    return sorted.map((p, i) => {
      const prev = sorted[i - 1];
      track = prev && Math.abs(p.lon - prev.lon) < 6 ? (track + 1) % 3 : 0;
      return { ...p, r: 92 - track * 13 };
    });
  }, [chart]);

  const submit = () => {
    if (!chart) return;
    const sun = chart.planets[0];
    const moon = chart.planets[1];
    share({
      room: "astrology",
      title: `ดวงกำเนิด: อาทิตย์${sun.signTh} · จันทร์${moon.signTh}${chart.ascendant ? ` · ลัคนา${chart.ascendant.signTh}` : ""}`,
      summary: `${chart.planets.map((p) => `${p.th} ${p.signTh} ${p.degree}${p.retrograde ? " (R)" : ""}${p.house ? ` เรือน ${p.house}` : ""}`).join(" · ")}${chart.ascendant ? ` · ลัคนา ${chart.ascendant.signTh} ${chart.ascendant.degree} · MC ${chart.midheaven!.signTh}` : ""}`,
      facts: {
        birth: { date: birth.date, time: birth.time || "unknown", place: place.placeName, tz: place.tz, utc: chart.utc },
        system: "tropical, whole-sign houses",
        planets: chart.planets.map((p) => ({ planet: p.en, sign: p.signEn, degree: p.degree, house: p.house, retrograde: p.retrograde })),
        ascendant: chart.ascendant && { sign: ZODIAC[chart.ascendant.sign].key, degree: chart.ascendant.degree },
        midheaven: chart.midheaven && { sign: ZODIAC[chart.midheaven.sign].key, degree: chart.midheaven.degree },
        aspects: chart.aspects.slice(0, 12).map((a) => `${a.a} ${a.type} ${a.b} (orb ${a.orb}°)`),
        elementBalance: chart.elements,
      },
    });
  };

  return (
    <div className="grid items-start gap-8 lg:grid-cols-[1.1fr_1fr]">
      <div className="relative mx-auto aspect-square w-full max-w-[460px]">
        <svg viewBox="0 0 280 280" className="h-full w-full" aria-label="ผังดวงกำเนิด">
          <circle cx="140" cy="140" r="134" fill="#07051a" stroke={glow} strokeOpacity=".7" />
          <circle cx="140" cy="140" r="110" fill="none" stroke={glow} strokeOpacity=".45" />
          <circle cx="140" cy="140" r="56" fill="none" stroke="#fff" strokeOpacity=".08" />
          {ZODIAC.map((z, i) => {
            const [x0, y0] = pt(i * 30, 110);
            const [x1, y1] = pt(i * 30, 134);
            const [tx, ty] = pt(i * 30 + 15, 122);
            return (
              <g key={z.key}>
                <line x1={x0} y1={y0} x2={x1} y2={y1} stroke={glow} strokeOpacity=".55" />
                <text x={tx} y={ty} fontSize="11" textAnchor="middle" dominantBaseline="central" fill={chart && chart.planets[0].sign === i ? "#fff" : "#f7e1a6"} style={{ fontFamily: SYMBOL_FONT }}>
                  {z.glyph.replace("\uFE0F", "") + "\uFE0E"}
                </text>
              </g>
            );
          })}
          {/* whole-sign house cusps */}
          {chart?.ascendant &&
            Array.from({ length: 12 }, (_, k) => {
              const cusp = (chart.ascendant!.sign + k) * 30;
              const [x0, y0] = pt(cusp, 56);
              const [x1, y1] = pt(cusp, 110);
              const [hx, hy] = pt(cusp + 15, 62);
              return (
                <g key={k}>
                  <line x1={x0} y1={y0} x2={x1} y2={y1} stroke="#fff" strokeOpacity=".1" />
                  <text x={hx} y={hy} fontSize="6" fill="#fff" fillOpacity=".35" textAnchor="middle" dominantBaseline="central">
                    {k + 1}
                  </text>
                </g>
              );
            })}
          {/* aspects */}
          {chart?.aspects
            .filter((a) => a.type !== "conjunction")
            .map((a, i) => {
              const pa = chart.planets.find((p) => p.en === a.a)!;
              const pb = chart.planets.find((p) => p.en === a.b)!;
              const [x0, y0] = pt(pa.lon, 54);
              const [x1, y1] = pt(pb.lon, 54);
              return <line key={i} x1={x0} y1={y0} x2={x1} y2={y1} stroke={ASPECT_COLORS[a.type]} strokeOpacity={Math.max(0.25, 0.8 - a.orb * 0.08)} strokeWidth=".8" />;
            })}
          {/* angles */}
          {chart?.ascendant && (
            <>
              <line x1="6" y1="140" x2="30" y2="140" stroke="#fff" strokeWidth="1.4" />
              <text x="10" y="132" fontSize="7" fill="#fff">ASC</text>
              {(() => {
                const [x0, y0] = pt(chart.midheaven!.lon, 110);
                const [x1, y1] = pt(chart.midheaven!.lon, 134);
                const [tx, ty] = pt(chart.midheaven!.lon - 5, 128);
                return (
                  <>
                    <line x1={x0} y1={y0} x2={x1} y2={y1} stroke="#fff" strokeWidth="1.4" />
                    <text x={tx} y={ty} fontSize="7" fill="#fff" textAnchor="middle">MC</text>
                  </>
                );
              })()}
            </>
          )}
          {/* planets */}
          {placed.map((p) => {
            const [x, y] = pt(p.lon, p.r);
            const [tx, ty] = pt(p.lon, 109);
            return (
              <g key={p.key}>
                <line x1={x} y1={y} x2={tx} y2={ty} stroke="#fff" strokeOpacity=".15" strokeWidth=".5" />
                <circle cx={x} cy={y} r="6.2" fill="#140c2e" stroke={glow} strokeOpacity=".6" strokeWidth=".6" />
                <text x={x} y={y} fontSize="8.5" textAnchor="middle" dominantBaseline="central" fill="#f7e1a6" style={{ fontFamily: SYMBOL_FONT }}>
                  {p.glyph + "\uFE0E"}
                </text>
              </g>
            );
          })}
          {!chart && (
            <text x="140" y="140" fontSize="9" fill="#cdbfe6" textAnchor="middle">
              กรอกวันเกิดเพื่อสร้างผังดวง
            </text>
          )}
        </svg>
      </div>

      <div className="glass frame-gold space-y-4 rounded-2xl p-5">
        <p className="font-display text-sm tracking-[0.2em] text-gold">BIRTH DATA</p>
        <BirthDataForm value={birth} onChange={setBirth} needsTime="ใช้หาลัคนาและเรือน" />
        {chart && (
          <>
            <div className="grid grid-cols-3 gap-2 text-center">
              {[
                ["อาทิตย์", chart.planets[0].signTh],
                ["จันทร์", chart.planets[1].signTh],
                ["ลัคนา", chart.ascendant?.signTh ?? "—"],
              ].map(([k, v]) => (
                <div key={k} className="rounded-xl bg-black/30 p-2">
                  <p className="text-[10px] text-mist/70">{k}</p>
                  <p className="text-gold-bright">{v}</p>
                </div>
              ))}
            </div>
            <div className="max-h-56 overflow-y-auto rounded-xl bg-black/25">
              <table className="w-full text-left text-xs">
                <tbody>
                  {chart.planets.map((p) => (
                    <tr key={p.key} className="border-b border-white/5">
                      <td className="py-1.5 pl-3 text-gold">{p.glyph}</td>
                      <td className="py-1.5">{p.th}</td>
                      <td className="py-1.5">{p.signTh}</td>
                      <td className="py-1.5 tabular-nums text-ivory/70">{p.degree}</td>
                      <td className="py-1.5 pr-3 text-right text-ivory/60">{p.house ? `เรือน ${p.house}` : ""}{p.retrograde ? " ℞" : ""}</td>
                    </tr>
                  ))}
                  {chart.ascendant && (
                    <tr>
                      <td className="py-1.5 pl-3 text-gold">↑</td>
                      <td>ลัคนา / MC</td>
                      <td colSpan={3} className="pr-3 text-ivory/80">
                        {chart.ascendant.signTh} {chart.ascendant.degree} · MC {chart.midheaven!.signTh} {chart.midheaven!.degree}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-ivory/70">
              ธาตุเด่น: {(Object.entries(chart.elements) as [keyof typeof EL_TH, number][]).map(([k, n]) => `${EL_TH[k]} ${n}`).join(" · ")} · มุมสัมพันธ์ {chart.aspects.length} คู่
            </p>
            <button type="button" onClick={submit} className="w-full rounded-full bg-gradient-to-b from-gold-bright to-gold-deep py-2 text-sm text-void transition hover:brightness-110">
              ✦ ส่งผังดวงให้หมอดูอ่าน
            </button>
            <p className="text-[10px] text-mist/60">คำนวณจากตำแหน่งดาวจริง (ephemeris) · ระบบ Tropical · เรือนแบบ Whole Sign</p>
          </>
        )}
      </div>
    </div>
  );
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs text-mist/80">{label}</span>
      {children}
    </label>
  );
}
