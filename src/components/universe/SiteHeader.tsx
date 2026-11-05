"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { getPersona } from "@/lib/data/personas";
import { useAstra } from "@/components/providers/AstraProvider";
import PersonaAvatar from "@/components/personas/PersonaAvatar";

export default function SiteHeader({ demo }: { demo: boolean }) {
  const { personaId } = useAstra();
  const persona = getPersona(personaId);
  return (
    <motion.header
      initial={{ y: -30, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, delay: 0.2 }}
      className="fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-6 sm:pt-4"
    >
      <div className="glass mx-auto flex max-w-6xl items-center justify-between rounded-full border border-white/10 py-2 pl-4 pr-2 sm:pl-6">
        <Link href="/" className="flex items-center gap-2" aria-label="ASTRA home">
          <span className="text-lg text-gold">✦</span>
          <span className="font-display text-lg tracking-[0.3em] text-gilded">ASTRA</span>
        </Link>
        <nav className="hidden items-center gap-7 text-sm text-ivory/70 md:flex" aria-label="หลัก">
          <Link href="/#chambers" className="transition hover:text-gold-bright">ห้องดูดวง</Link>
          <Link href="/#oracles" className="transition hover:text-gold-bright">หมอดู AI</Link>
          <Link href="/#daily" className="transition hover:text-gold-bright">ดวงรายวัน</Link>
          <Link href="/realms" className="transition hover:text-gold-bright">Mystic Realms</Link>
          <Link href="/profile" className="transition hover:text-gold-bright">จักรวาลของฉัน</Link>
        </nav>
        <div className="flex items-center gap-2">
          {demo && (
            <span className="hidden rounded-full border border-lilac/30 bg-lilac/10 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-lilac sm:inline" title="ยังไม่ได้ตั้งค่า ANTHROPIC_API_KEY — ใช้คำตอบตัวอย่าง">
              Demo Mode
            </span>
          )}
          {persona && (
            <Link href="/profile" className="flex items-center gap-2 rounded-full border border-gold/30 bg-black/30 py-1 pl-1 pr-3 text-xs text-ivory/85 transition hover:border-gold/70" title="หมอดูที่เลือกอยู่ · โปรไฟล์ของฉัน">
              <span className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-white/5">
                <PersonaAvatar id={persona.id} size={40} animated={false} className="h-auto w-9 translate-y-1" />
              </span>
              <span className="hidden sm:inline">{persona.name}</span>
            </Link>
          )}
        </div>
      </div>
    </motion.header>
  );
}
