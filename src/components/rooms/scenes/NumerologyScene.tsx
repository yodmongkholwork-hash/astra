"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { lifePathNumber, numberEnergy } from "@/lib/engines";
import { Field } from "./AstrologyScene";
import { useShareReading } from "../RoomContext";

const MEANINGS: Record<number, string> = {
  1: "ผู้นำ ผู้บุกเบิก มีความเป็นตัวของตัวเองสูง",
  2: "ผู้ประสาน อ่อนโยน เข้าใจผู้อื่น",
  3: "นักสร้างสรรค์ ช่างสื่อสาร มีเสน่ห์",
  4: "ผู้สร้างรากฐาน มั่นคง มีระเบียบ",
  5: "นักผจญภัย รักอิสระ ปรับตัวเก่ง",
  6: "ผู้ดูแล รักครอบครัว มีความรับผิดชอบ",
  7: "นักค้นหาความจริง ลึกซึ้ง ช่างคิด",
  8: "ผู้บริหาร มุ่งความสำเร็จและความมั่งคั่ง",
  9: "ผู้ให้ มีเมตตา มองภาพกว้าง",
  11: "เลขมาสเตอร์ — ผู้มีญาณ แรงบันดาลใจสูง",
  22: "เลขมาสเตอร์ — ผู้สร้างฝันให้เป็นจริง",
  33: "เลขมาสเตอร์ — ครูแห่งความเมตตา",
};

export default function NumerologyScene({ glow }: { glow: string }) {
  const [date, setDate] = useState("");
  const [num, setNum] = useState("");
  const share = useShareReading();
  const life = date ? lifePathNumber(date) : null;
  const energy = num.replace(/\D/g, "").length >= 2 ? numberEnergy(num) : null;

  return (
    <div className="grid items-center gap-8 md:grid-cols-[1.2fr_1fr]">
      <div className="relative mx-auto aspect-square w-full max-w-[400px]">
        <div className="absolute inset-0 animate-spin-reverse [animation-duration:70s]">
          {Array.from({ length: 9 }, (_, i) => {
            const a = (i / 9) * Math.PI * 2 - Math.PI / 2;
            return (
              <span
                key={i}
                className="absolute -translate-x-1/2 -translate-y-1/2 font-display text-2xl sm:text-3xl"
                style={{ left: `${50 + Math.cos(a) * 42}%`, top: `${50 + Math.sin(a) * 42}%`, color: life === i + 1 ? "#fff" : glow, textShadow: `0 0 ${life === i + 1 ? 24 : 12}px ${glow}` }}
              >
                {i + 1}
              </span>
            );
          })}
        </div>
        <div className="absolute inset-[18%] rounded-full border border-dashed animate-spin-slow [animation-duration:50s]" style={{ borderColor: `${glow}55` }} />
        <div className="absolute inset-[30%] flex items-center justify-center rounded-full" style={{ background: `radial-gradient(circle, ${glow}33, transparent 70%)` }}>
          <AnimatePresence mode="wait">
            <motion.span
              key={life ?? "q"}
              initial={{ opacity: 0, scale: 0.5, filter: "blur(10px)" }}
              animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, scale: 1.4 }}
              className="font-display text-6xl text-white sm:text-7xl"
              style={{ textShadow: `0 0 30px ${glow}` }}
            >
              {life ?? "?"}
            </motion.span>
          </AnimatePresence>
        </div>
      </div>

      <div className="glass frame-gold space-y-4 rounded-2xl p-5">
        <p className="font-display text-sm tracking-[0.2em] text-gold">LIFE PATH</p>
        <Field label="วันเกิด">
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="astra-input" />
        </Field>
        {life && <p className="rounded-xl bg-black/30 p-3 text-sm">เลขเส้นทางชีวิต <span className="text-lg text-gold-bright">{life}</span> — {MEANINGS[life]}</p>}
        <Field label="ตัวเลขที่สนใจ (เบอร์โทร / ทะเบียนรถ / เลขบ้าน)">
          <input inputMode="numeric" placeholder="เช่น 089-123-4567" value={num} onChange={(e) => setNum(e.target.value)} className="astra-input" />
        </Field>
        {energy && (
          <p className="rounded-xl bg-black/30 p-3 text-sm">
            ผลรวม <span className="text-gold-bright">{energy.total}</span> → รากเลข <span className="text-lg text-gold-bright">{energy.root}</span> — {MEANINGS[energy.root]}
          </p>
        )}
        {(life || energy) && (
          <button type="button" onClick={() => share({ room: "numerology", title: `เลขศาสตร์${life ? ` · Life Path ${life}` : ""}${energy ? ` · รากเลข ${energy.root}` : ""}`, summary: [life && `เลขเส้นทางชีวิต ${life}: ${MEANINGS[life]}`, energy && `ตัวเลข ${num} ผลรวม ${energy.total} → ${energy.root}: ${MEANINGS[energy.root]}`].filter(Boolean).join(" · "), facts: { birthDate: date || null, lifePath: life, number: energy ? num : null, ...(energy ?? {}) } })} className="w-full rounded-full bg-gradient-to-b from-gold-bright to-gold-deep py-2 text-sm text-void transition hover:brightness-110">
            ✦ ส่งผลให้หมอดูวิเคราะห์
          </button>
        )}
      </div>
    </div>
  );
}
