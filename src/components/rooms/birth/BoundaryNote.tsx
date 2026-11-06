"use client";

import type { BoundaryInfo } from "@/lib/engines/thai-methods";

/** Warns when a small birth-time error would move the ascendant into another sign. */
export default function BoundaryNote({ b, rasiTh }: { b: BoundaryInfo; rasiTh: string }) {
  const parts: string[] = [];
  if (b.earlier) parts.push(`เกิดเร็วขึ้น ${b.earlier.minutes} นาที → ลัคนา${b.earlier.rasiTh}`);
  if (b.later) parts.push(`เกิดช้าลง ${b.later.minutes} นาที → ลัคนา${b.later.rasiTh}`);
  return (
    <div className={`rounded-lg p-2 text-[11px] leading-relaxed ${b.near ? "border border-amber-300/40 bg-amber-300/10 text-amber-100" : "bg-white/5 text-ivory/65"}`}>
      {b.near && <span className="font-semibold">⚠ ลัคนาอยู่ใกล้รอยต่อราศี · </span>}
      ลัคนาอยู่ที่ {b.degIntoSign.toFixed(1)}° ของราศี{rasiTh} (อีก {b.degToNext.toFixed(1)}° ถึงราศีถัดไป)
      {parts.length > 0 && <span className="block">{parts.join(" · ")}</span>}
      {b.near && <span className="block">เวลาเกิดที่คลาดเพียงเล็กน้อยทำให้ลัคนาเปลี่ยนราศีได้ ควรตรวจเวลาจากสูติบัตร</span>}
    </div>
  );
}
