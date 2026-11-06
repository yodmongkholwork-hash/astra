"use client";

import { useEffect, useState } from "react";
import { PLACES, resolvePlace } from "@/lib/data/places";
import { loadProfile, saveProfile } from "@/lib/store";

/** Birth data shared by every chart room; remembered in the profile so it is typed once. */
export interface BirthData {
  date: string;
  time: string; // "" = unknown
  placeId: string; // place id or "custom"
  lat?: number;
  lon?: number;
  tz: string;
}

const TIMEZONES = ["Asia/Bangkok", "Asia/Shanghai", "Asia/Tokyo", "Asia/Kolkata", "Asia/Dubai", "Europe/London", "Europe/Paris", "America/New_York", "America/Chicago", "America/Los_Angeles", "Australia/Sydney", "UTC"];

/** Resolves the chart inputs (coordinates + zone) from the form value. */
export function birthInput(b: BirthData) {
  if (b.placeId === "custom") {
    return { lat: b.lat, lon: b.lon, tz: b.tz || "Asia/Bangkok", placeName: Number.isFinite(b.lat) ? `${b.lat?.toFixed(2)}, ${b.lon?.toFixed(2)}` : "" };
  }
  const p = PLACES.find((x) => x.id === b.placeId) ?? PLACES[0];
  return { lat: p.lat, lon: p.lon, tz: p.tz, placeName: p.name };
}

export function useBirthData() {
  const [birth, setBirth] = useState<BirthData>({ date: "", time: "", placeId: "bangkok", tz: "Asia/Bangkok" });
  useEffect(() => {
    const p = loadProfile();
    const place = p.birthPlace === "custom" ? null : resolvePlace(p.birthPlace);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate from the saved profile after mount
    setBirth({
      date: p.birthDate,
      time: p.birthTime,
      placeId: p.birthPlace === "custom" ? "custom" : (place?.id ?? "bangkok"),
      lat: p.birthLat,
      lon: p.birthLon,
      tz: p.birthTz ?? place?.tz ?? "Asia/Bangkok",
    });
  }, []);
  const update = (patch: Partial<BirthData>) => {
    const next = { ...birth, ...patch };
    setBirth(next);
    // remember for the other rooms and the profile page
    const prof = loadProfile();
    void saveProfile({ ...prof, birthDate: next.date, birthTime: next.time, birthPlace: next.placeId, birthLat: next.lat, birthLon: next.lon, birthTz: next.placeId === "custom" ? next.tz : undefined });
  };
  return [birth, update] as const;
}

export default function BirthDataForm({ value, onChange, needsTime = "แนะนำ" }: { value: BirthData; onChange: (p: Partial<BirthData>) => void; needsTime?: string }) {
  const unknownTime = value.time === "";
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="mb-1 block text-xs text-mist/80">วันเกิด</span>
          <input type="date" value={value.date} onChange={(e) => onChange({ date: e.target.value })} className="astra-input" />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs text-mist/80">เวลาเกิด <span className="text-mist/50">({needsTime})</span></span>
          <input type="time" value={value.time} onChange={(e) => onChange({ time: e.target.value })} className="astra-input" />
        </label>
      </div>
      {unknownTime && value.date && <p className="text-[11px] text-mist/60">ไม่ทราบเวลาเกิด: คำนวณที่เที่ยงวัน (ลัคนา/เรือนจะไม่แสดง และตำแหน่งดวงจันทร์คลาดได้ ±6°)</p>}
      <label className="block">
        <span className="mb-1 block text-xs text-mist/80">สถานที่เกิด</span>
        <select value={value.placeId} onChange={(e) => onChange({ placeId: e.target.value, tz: PLACES.find((p) => p.id === e.target.value)?.tz ?? value.tz })} className="astra-input">
          {PLACES.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} · {p.en}
            </option>
          ))}
          <option value="custom">อื่น ๆ — กรอกพิกัดเอง</option>
        </select>
      </label>
      {value.placeId === "custom" && (
        <div className="grid grid-cols-3 gap-2">
          <label className="block">
            <span className="mb-1 block text-[11px] text-mist/70">ละติจูด</span>
            <input type="number" step="0.01" min={-90} max={90} value={value.lat ?? ""} onChange={(e) => onChange({ lat: e.target.value === "" ? undefined : Number(e.target.value) })} className="astra-input" placeholder="13.75" />
          </label>
          <label className="block">
            <span className="mb-1 block text-[11px] text-mist/70">ลองจิจูด</span>
            <input type="number" step="0.01" min={-180} max={180} value={value.lon ?? ""} onChange={(e) => onChange({ lon: e.target.value === "" ? undefined : Number(e.target.value) })} className="astra-input" placeholder="100.50" />
          </label>
          <label className="block">
            <span className="mb-1 block text-[11px] text-mist/70">เขตเวลา</span>
            <select value={value.tz} onChange={(e) => onChange({ tz: e.target.value })} className="astra-input">
              {TIMEZONES.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </label>
        </div>
      )}
    </div>
  );
}
