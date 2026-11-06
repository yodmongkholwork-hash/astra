"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";
import PersonaAvatar from "@/components/personas/PersonaAvatar";
import { useAstra } from "@/components/providers/AstraProvider";
import { getPersona, PERSONAS } from "@/lib/data/personas";
import { getRoom } from "@/lib/data/rooms";
import { placeGroups, resolvePlace } from "@/lib/data/places";
import { chineseYear, lifePathNumber, seededRandom, sunSign, thaiChart } from "@/lib/engines";
import { dailyOmen } from "@/lib/data/omens";
import { deleteReading, loadHistory, loadProfile, saveProfile, STORE_EVENT } from "@/lib/store";
import { getSupabase, supabaseEnabled } from "@/lib/supabase/client";
import type { HistoryEntry, UserProfile } from "@/lib/types";

const EMPTY: HistoryEntry[] = [];
let cache: { raw: string | null; list: HistoryEntry[] } = { raw: null, list: EMPTY };
function historySnapshot() {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem("astra.history");
  } catch {}
  if (raw !== cache.raw) cache = { raw, list: loadHistory() };
  return cache.list;
}
const subscribe = (cb: () => void) => {
  window.addEventListener(STORE_EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(STORE_EVENT, cb);
    window.removeEventListener("storage", cb);
  };
};

const FOCUS = ["ความรัก", "การงาน", "การเงิน", "สุขภาพใจ"];

export default function ProfileDashboard() {
  const { personaId, setPersonaId, travelTo } = useAstra();
  const [profile, setProfile] = useState<UserProfile>({ name: "", birthDate: "", birthTime: "", birthPlace: "" });
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const history = useSyncExternalStore(subscribe, historySnapshot, () => EMPTY);
  const [open, setOpen] = useState<string | null>(null);
  const [today, setToday] = useState<Date | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate from storage after mount
    setProfile(loadProfile());
    setToday(new Date());
  }, []);

  const bd = /^\d{4}-\d{2}-\d{2}$/.test(profile.birthDate) ? profile.birthDate : null;
  const stats = bd
    ? {
        life: lifePathNumber(bd),
        sun: sunSign(Number(bd.slice(5, 7)), Number(bd.slice(8, 10))),
        cn: chineseYear(Number(bd.slice(0, 4))),
        thai: thaiChart(bd, profile.birthTime || undefined),
      }
    : null;

  const omen = today ? dailyOmen(today) : null;
  const rand = seededRandom(`${omen?.date}-${stats?.sun.key ?? "all"}`);
  const scores = FOCUS.map((f) => ({ f, v: omen ? 40 + Math.floor(rand() * 60) : 0 }));
  const persona = getPersona(personaId) ?? PERSONAS[0];

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveProfile(profile);
    setSavedAt(Date.now());
  };

  return (
    <div className="mx-auto max-w-6xl space-y-10 px-4">
      <header className="pt-28 md:pt-32">
        <p className="font-display text-xs uppercase tracking-[0.4em] text-gold">Personal Observatory</p>
        <h1 className="mt-3 font-thai-display text-4xl text-gilded sm:text-5xl">{profile.name ? `จักรวาลของ ${profile.name}` : "จักรวาลส่วนตัวของคุณ"}</h1>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        {/* profile form */}
        <form onSubmit={submit} className="glass frame-gold space-y-4 rounded-3xl p-6">
          <p className="font-display text-sm tracking-[0.2em] text-gold">PROFILE</p>
          <Input label="ชื่อเล่น" value={profile.name} onChange={(v) => setProfile({ ...profile, name: v })} placeholder="ชื่อที่อยากให้หมอดูเรียก" />
          <div className="grid grid-cols-2 gap-3">
            <Input label="วันเกิด" type="date" value={profile.birthDate} onChange={(v) => setProfile({ ...profile, birthDate: v })} />
            <Input label="เวลาเกิด" type="time" value={profile.birthTime} onChange={(v) => setProfile({ ...profile, birthTime: v })} />
          </div>
          <label className="block">
            <span className="mb-1 block text-xs text-mist/80">สถานที่เกิด</span>
            <select value={resolvePlace(profile.birthPlace)?.id ?? (profile.birthPlace === "custom" ? "custom" : "bangkok")} onChange={(e) => setProfile({ ...profile, birthPlace: e.target.value })} className="astra-input">
              {placeGroups().map((g) => (
                <optgroup key={g.label} label={g.label}>
                  {g.places.map((pl) => (
                    <option key={pl.id} value={pl.id}>{pl.name} · {pl.en}</option>
                  ))}
                </optgroup>
              ))}
              <option value="custom">อื่น ๆ — กรอกพิกัดในห้องดูดวง</option>
            </select>
          </label>
          <div>
            <p className="mb-2 text-xs text-mist/80">หมอดูประจำตัว</p>
            <div className="flex flex-wrap gap-2">
              {PERSONAS.map((p) => (
                <button key={p.id} type="button" onClick={() => setPersonaId(p.id)} aria-pressed={p.id === personaId} className={`flex items-center gap-2 rounded-full border py-1 pl-1 pr-3 text-xs transition ${p.id === personaId ? "border-gold bg-gold/10" : "border-white/10 text-ivory/60"}`}>
                  <PersonaAvatar id={p.id} size={24} animated={false} /> {p.name}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button type="submit" className="rounded-full bg-gradient-to-b from-gold-bright to-gold-deep px-6 py-2 text-sm text-void transition hover:brightness-110">บันทึกโปรไฟล์</button>
            {savedAt && <span className="text-xs text-emerald-300">✓ บันทึกแล้ว</span>}
          </div>
          <p className="text-[11px] text-mist/60">ข้อมูลเก็บในเบราว์เซอร์นี้{supabaseEnabled() ? " และซิงก์กับบัญชี Supabase เมื่อเข้าสู่ระบบ" : " (เชื่อม Supabase เพื่อซิงก์ข้ามอุปกรณ์)"}</p>
          {supabaseEnabled() && <SignIn />}
        </form>

        {/* dashboard */}
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Life Path" value={stats ? String(stats.life) : "—"} />
            <Stat label="ราศี (สากล)" value={stats ? `${stats.sun.glyph} ${stats.sun.th}` : "—"} />
            <Stat label="ปีนักษัตร" value={stats ? `${stats.cn.animal} · ${stats.cn.element}` : "—"} />
            <Stat label="วันเกิด (ไทย)" value={stats ? stats.thai.birthDay.day : "—"} />
          </div>

          <div className="glass frame-gold rounded-3xl p-6">
            <div className="flex items-center gap-4">
              <PersonaAvatar id={persona.id} size={64} />
              <div>
                <p className="font-display text-sm tracking-[0.2em] text-gold">DAILY HOROSCOPE · {omen?.date ?? "…"}</p>
                <p className="text-xs text-mist/70">{persona.name}{omen && ` · ${omen.moon.name}`}</p>
              </div>
            </div>
            <p className="mt-4 min-h-[3.5rem] font-serif text-lg text-ivory/90">{omen?.message ?? "ดวงดาวกำลังเรียงตัว…"}</p>
            <div className="mt-5 space-y-2">
              {scores.map(({ f, v }) => (
                <div key={f} className="flex items-center gap-3 text-xs">
                  <span className="w-16 text-ivory/70">{f}</span>
                  <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
                    <motion.span className="block h-full rounded-full bg-gradient-to-r from-gold-deep to-gold-bright" initial={{ width: 0 }} animate={{ width: `${v}%` }} transition={{ duration: 1 }} />
                  </span>
                  <span className="w-8 text-right text-gold-bright">{v}</span>
                </div>
              ))}
            </div>
            {omen && <p className="mt-4 text-xs text-ivory/60">เลขนำโชค <span className="text-gold-bright">{omen.luckyNumber}</span> · สีมงคล <span style={{ color: omen.color.hex }}>{omen.color.name}</span>{!stats && " · กรอกวันเกิดเพื่อดวงเฉพาะราศีของคุณ"}</p>}
          </div>
        </div>
      </div>

      {/* history */}
      <section aria-labelledby="history-title" className="pb-24">
        <div className="flex items-end justify-between">
          <h2 id="history-title" className="font-thai-display text-2xl text-ivory">ประวัติการทำนาย</h2>
          <span className="text-xs text-mist/70">{history.length} รายการ</span>
        </div>
        {history.length === 0 ? (
          <div className="glass mt-4 rounded-2xl p-8 text-center text-sm text-mist/80">
            ยังไม่มีคำทำนายที่บันทึกไว้ —{" "}
            <button type="button" className="text-gold underline-offset-4 hover:underline" onClick={(e) => travelTo("tarot", { x: e.clientX, y: e.clientY })}>
              เริ่มที่ห้องไพ่ทาโรต์
            </button>
          </div>
        ) : (
          <ul className="mt-4 space-y-3">
            {history.map((h) => {
              const room = getRoom(h.room);
              const p = getPersona(h.personaId);
              const isOpen = open === h.id;
              return (
                <li key={h.id} className="glass rounded-2xl border border-white/5">
                  <button type="button" onClick={() => setOpen(isOpen ? null : h.id)} aria-expanded={isOpen} className="flex w-full items-center gap-3 p-4 text-left">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border text-lg" style={{ borderColor: room?.palette.glow, color: room?.palette.glow }}>{room?.glyph}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm text-ivory">{h.title}</span>
                      <span className="block text-[11px] text-mist/70">{room?.nameTh} · {p?.name} · {new Date(h.createdAt).toLocaleString("th-TH", { dateStyle: "medium", timeStyle: "short" })}</span>
                    </span>
                    <span className="text-gold/70" aria-hidden>{isOpen ? "−" : "+"}</span>
                  </button>
                  {isOpen && (
                    <div className="space-y-3 border-t border-white/5 p-4 text-sm">
                      <p className="text-ivory/70">{h.summary}</p>
                      {h.interpretation && <p className="whitespace-pre-wrap font-serif text-[15px] text-ivory/90">{h.interpretation}</p>}
                      <div className="flex gap-4 text-xs">
                        {room && <Link href={`/rooms/${room.slug}`} className="text-gold hover:underline">กลับไปที่ห้อง →</Link>}
                        <button type="button" onClick={() => deleteReading(h.id)} className="text-red-300/80 hover:underline">ลบ</button>
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

function Input({ label, value, onChange, type = "text", placeholder }: { label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs text-mist/80">{label}</span>
      <input type={type} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} className="astra-input" />
    </label>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="glass rounded-2xl border border-white/5 p-4 text-center">
      <p className="text-[10px] uppercase tracking-[0.2em] text-mist/70">{label}</p>
      <p className="mt-1 truncate text-lg text-gold-bright">{value}</p>
    </div>
  );
}

/** Supabase magic-link sign-in (rendered only when Supabase env vars exist). */
function SignIn() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sent" | "error" | "in">("idle");
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    getSupabase()
      ?.auth.getUser()
      .then(({ data }) => {
        if (data.user) {
          setUserEmail(data.user.email ?? "");
          setState("in");
        }
      });
  }, []);

  if (state === "in") {
    return (
      <p className="text-xs text-emerald-300">
        ✓ เข้าสู่ระบบเป็น {userEmail} ·{" "}
        <button type="button" className="underline" onClick={() => getSupabase()?.auth.signOut().then(() => setState("idle"))}>ออกจากระบบ</button>
      </p>
    );
  }
  return (
    <div className="flex gap-2">
      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="อีเมลสำหรับลิงก์เข้าสู่ระบบ" className="astra-input" />
      <button
        type="button"
        disabled={!email}
        onClick={async () => {
          const { error } = await getSupabase()!.auth.signInWithOtp({ email, options: { emailRedirectTo: `${location.origin}/profile` } });
          setState(error ? "error" : "sent");
        }}
        className="shrink-0 rounded-xl border border-gold/40 px-3 text-xs text-gold-bright disabled:opacity-40"
      >
        {state === "sent" ? "ส่งแล้ว ✓" : state === "error" ? "ลองใหม่" : "ส่งลิงก์"}
      </button>
    </div>
  );
}
