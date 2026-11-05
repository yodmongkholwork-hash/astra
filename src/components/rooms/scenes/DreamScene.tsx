"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { Mist } from "@/components/cosmos/Atmosphere";
import { useShareReading } from "../RoomContext";

// Demo symbol dictionary — the Dream agent (Phase 5) replaces this with AI interpretation.
const SYMBOLS: { keys: string[]; icon: string; name: string; meaning: string }[] = [
  { keys: ["งู", "snake"], icon: "🐍", name: "งู", meaning: "เนื้อคู่ หรือการเปลี่ยนแปลงครั้งใหญ่ที่กำลังมา" },
  { keys: ["น้ำ", "ทะเล", "แม่น้ำ", "water"], icon: "🌊", name: "น้ำ", meaning: "อารมณ์ภายใน น้ำใสคือใจสงบ น้ำขุ่นคือความกังวล" },
  { keys: ["บิน", "fly"], icon: "🕊", name: "การบิน", meaning: "ความปรารถนาอิสระ และการก้าวข้ามข้อจำกัด" },
  { keys: ["ฟัน", "teeth"], icon: "🦷", name: "ฟันหลุด", meaning: "ความกังวลเรื่องคนใกล้ตัวหรือภาพลักษณ์ของตนเอง" },
  { keys: ["ตก", "fall"], icon: "🍂", name: "การตกจากที่สูง", meaning: "ความรู้สึกขาดการควบคุมในบางเรื่อง" },
  { keys: ["บ้าน", "house"], icon: "🏛", name: "บ้าน", meaning: "ตัวตนและความมั่นคงทางใจ" },
  { keys: ["ไฟ", "fire"], icon: "🔥", name: "ไฟ", meaning: "พลัง ความหลงใหล หรือการชำระล้าง" },
  { keys: ["ช้าง", "elephant"], icon: "🐘", name: "ช้าง", meaning: "บารมีและผู้ใหญ่ที่จะเข้ามาช่วยเหลือ" },
];

const FLOATERS = ["☾", "✧", "◯", "✦", "☁", "⟡", "☽", "✶"];

export default function DreamScene({ glow }: { glow: string }) {
  const [text, setText] = useState("");
  const [found, setFound] = useState<typeof SYMBOLS | null>(null);
  const share = useShareReading();

  const interpret = () => {
    const t = text.toLowerCase();
    const hits = SYMBOLS.filter((s) => s.keys.some((k) => t.includes(k)));
    setFound(hits);
    share({ room: "dreams", title: `ความฝัน: “${text.trim().slice(0, 40)}${text.trim().length > 40 ? "…" : ""}”`, summary: hits.length ? `สัญลักษณ์ที่พบ: ${hits.map((h) => `${h.name} (${h.meaning})`).join(", ")}` : "ยังไม่พบสัญลักษณ์ในพจนานุกรม", facts: { dream: text.trim().slice(0, 1500), symbols: hits.map((h) => h.name) } });
  };

  return (
    <div className="relative">
      {/* floating dream symbols */}
      <div aria-hidden className="pointer-events-none absolute -inset-10 overflow-hidden">
        {FLOATERS.map((f, i) => (
          <span key={i} className="absolute animate-float text-2xl opacity-40" style={{ left: `${8 + i * 12}%`, top: `${10 + ((i * 37) % 70)}%`, color: glow, animationDuration: `${7 + i}s`, animationDelay: `-${i}s` }}>
            {f}
          </span>
        ))}
      </div>
      <Mist className="inset-y-0" opacity={0.9} />

      <div className="glass frame-gold relative mx-auto max-w-2xl rounded-3xl p-5 sm:p-8">
        <label htmlFor="dream" className="font-display text-sm tracking-[0.2em] text-gold">
          DREAM JOURNAL
        </label>
        <textarea
          id="dream"
          rows={5}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="เมื่อคืนฉันฝันว่า… (ลองพิมพ์ว่า ฝันเห็นงูในน้ำ)"
          className="astra-input mt-3 resize-none font-serif text-lg"
          maxLength={2000}
        />
        <div className="mt-3 flex items-center justify-between">
          <span className="text-[11px] text-mist/60">{text.length}/2000</span>
          <button type="button" disabled={!text.trim()} onClick={interpret} className="rounded-full bg-gradient-to-b from-gold-bright to-gold-deep px-5 py-2 text-sm text-void transition enabled:hover:brightness-110 disabled:opacity-40">
            ถอดสัญลักษณ์ความฝัน
          </button>
        </div>

        {found && (
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {found.length ? (
              found.map((s, i) => (
                <motion.div key={s.name} initial={{ opacity: 0, y: 10, filter: "blur(6px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} transition={{ delay: i * 0.15 }} className="rounded-xl border border-white/10 bg-black/30 p-3">
                  <p className="text-sm text-gold-bright">
                    {s.icon} {s.name}
                  </p>
                  <p className="mt-1 text-xs text-ivory/80">{s.meaning}</p>
                </motion.div>
              ))
            ) : (
              <p className="text-sm text-mist/80 sm:col-span-2">ยังไม่พบสัญลักษณ์ในพจนานุกรมตัวอย่าง — เลื่อนลงเพื่อให้หมอดูตีความความฝันทั้งเรื่อง</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
