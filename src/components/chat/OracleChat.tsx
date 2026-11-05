"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState, type FormEvent } from "react";
import PersonaAvatar from "@/components/personas/PersonaAvatar";
import { getPersona, PERSONAS } from "@/lib/data/personas";
import type { RoomSlug } from "@/lib/data/rooms";
import { loadProfile, saveReading } from "@/lib/store";
import type { ChatMessage, OracleResponse, ReadingPayload } from "@/lib/types";

interface Props {
  room: RoomSlug;
  personaId: string;
  onPersonaChange: (id: string) => void;
  reading: ReadingPayload | null;
  onReadingConsumed: () => void;
}

/** Per-persona conversation window. Each persona keeps its own thread inside the room. */
export default function OracleChat({ room, personaId, onPersonaChange, reading, onReadingConsumed }: Props) {
  const persona = getPersona(personaId) ?? PERSONAS[0];
  const [threads, setThreads] = useState<Record<string, ChatMessage[]>>({});
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [demo, setDemo] = useState<boolean | null>(null);
  const [saved, setSaved] = useState(false);
  const lastReading = useRef<ReadingPayload | null>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const messages = threads[personaId] ?? [];

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" });
  }, [messages.length, loading]);

  async function send(text: string, withReading: ReadingPayload | null) {
    const content = text.trim();
    if (!content || loading) return;
    const next = [...messages, { role: "user" as const, content }];
    setThreads((t) => ({ ...t, [personaId]: next }));
    setInput("");
    setError(null);
    setLoading(true);
    setSaved(false);
    if (withReading) lastReading.current = withReading;
    try {
      const res = await fetch("/api/oracle", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ room, personaId, messages: next, reading: withReading ?? lastReading.current, profile: loadProfile() }),
      });
      const data = (await res.json()) as OracleResponse & { error?: string };
      if (!res.ok || data.error) throw new Error(data.error || `HTTP ${res.status}`);
      setDemo(data.demo);
      setThreads((t) => ({ ...t, [personaId]: [...next, { role: "assistant", content: data.reply }] }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "เกิดข้อผิดพลาด");
      setThreads((t) => ({ ...t, [personaId]: messages })); // roll back so the user can retry
      setInput(content);
    } finally {
      setLoading(false);
    }
  }

  const askReading = () => {
    if (!reading) return;
    onReadingConsumed();
    send(`ช่วยตีความผล「${reading.title}」ให้หน่อย`, reading);
  };

  const saveLast = async () => {
    const answer = [...messages].reverse().find((m) => m.role === "assistant");
    const r = lastReading.current;
    if (!answer) return;
    await saveReading({
      room,
      personaId,
      title: r?.title ?? `สนทนากับ ${persona.name}`,
      summary: r?.summary ?? messages.find((m) => m.role === "user")?.content.slice(0, 140) ?? "",
      interpretation: answer.content,
      facts: r?.facts,
    });
    setSaved(true);
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    send(input, null);
  };

  return (
    <section aria-label={`สนทนากับ ${persona.name}`} className="glass frame-gold relative overflow-hidden rounded-3xl" style={{ boxShadow: `0 0 80px -30px ${persona.aura}` }}>
      {/* persona selector */}
      <div className="no-scrollbar flex gap-2 overflow-x-auto border-b border-white/10 p-3" role="tablist" aria-label="เลือกหมอดู">
        {PERSONAS.map((p) => (
          <button
            key={p.id}
            type="button"
            role="tab"
            aria-selected={p.id === personaId}
            onClick={() => onPersonaChange(p.id)}
            className={`flex shrink-0 items-center gap-2 rounded-full border py-1 pl-1 pr-3 text-xs transition ${p.id === personaId ? "border-gold/70 bg-gold/10 text-ivory" : "border-white/10 text-ivory/60 hover:text-ivory"}`}
          >
            <PersonaAvatar id={p.id} size={26} animated={false} />
            {p.name}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-4 p-4 sm:p-5">
        <PersonaAvatar id={persona.id} size={72} />
        <div className="min-w-0">
          <p className="font-display text-lg" style={{ color: persona.accent }}>{persona.name}</p>
          <p className="text-xs text-mist/80">{persona.title} · {persona.temperament}</p>
        </div>
        {demo !== null && (
          <span className={`ml-auto shrink-0 rounded-full px-2 py-0.5 text-[10px] ${demo ? "bg-lilac/15 text-lilac" : "bg-emerald-400/15 text-emerald-300"}`}>{demo ? "DEMO" : "LIVE · Claude"}</span>
        )}
      </div>

      <div ref={scroller} className="max-h-[420px] min-h-[220px] space-y-3 overflow-y-auto px-4 pb-4 sm:px-5" aria-live="polite">
        <Bubble role="assistant" accent={persona.accent}>{persona.greeting}</Bubble>
        {messages.map((m, i) => (
          <Bubble key={i} role={m.role} accent={persona.accent}>{m.content}</Bubble>
        ))}
        {loading && (
          <div className="flex items-center gap-2 text-xs text-mist/80" role="status">
            <span className="relative flex h-6 w-6 items-center justify-center">
              <span className="absolute inset-0 animate-ping rounded-full opacity-40" style={{ background: persona.aura }} />
              <span className="h-3 w-3 rounded-full" style={{ background: persona.aura, boxShadow: `0 0 12px ${persona.aura}` }} />
            </span>
            {persona.name} กำลังเพ่งมองลูกแก้ว…
          </div>
        )}
        {error && (
          <p role="alert" className="rounded-xl border border-red-400/30 bg-red-500/10 p-3 text-xs text-red-200">
            {error} — ข้อความของคุณยังอยู่ในช่องพิมพ์ กดส่งอีกครั้งได้เลย
          </p>
        )}
      </div>

      <AnimatePresence>
        {reading && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mx-4 mb-3 flex flex-wrap items-center gap-3 rounded-2xl border border-gold/40 bg-gold/10 p-3 text-xs sm:mx-5">
            <span className="text-gold-bright">✦ ผลใหม่พร้อมแล้ว:</span>
            <span className="min-w-0 flex-1 truncate text-ivory/80">{reading.title}</span>
            <button type="button" onClick={askReading} disabled={loading} className="rounded-full bg-gold px-3 py-1 text-void transition hover:brightness-110 disabled:opacity-50">
              ให้ {persona.name} ตีความ
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={onSubmit} className="flex gap-2 border-t border-white/10 p-3 sm:p-4">
        <label htmlFor={`ask-${room}`} className="sr-only">ข้อความถึงหมอดู</label>
        <input id={`ask-${room}`} value={input} onChange={(e) => setInput(e.target.value)} maxLength={2000} placeholder={`ถาม ${persona.name}…`} className="astra-input" />
        <button type="submit" disabled={!input.trim() || loading} className="shrink-0 rounded-xl bg-gradient-to-b from-gold-bright to-gold-deep px-4 text-sm text-void transition enabled:hover:brightness-110 disabled:opacity-40">
          ส่ง
        </button>
      </form>
      {messages.some((m) => m.role === "assistant") && (
        <div className="flex justify-end px-4 pb-3 sm:px-5">
          <button type="button" onClick={saveLast} disabled={saved} className="text-xs text-gold/80 underline-offset-4 hover:underline disabled:no-underline disabled:opacity-60">
            {saved ? "✓ บันทึกลงประวัติแล้ว" : "☆ บันทึกคำทำนายล่าสุด"}
          </button>
        </div>
      )}
    </section>
  );
}

function Bubble({ role, accent, children }: { role: ChatMessage["role"]; accent: string; children: React.ReactNode }) {
  const mine = role === "user";
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
      <p
        className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${mine ? "rounded-br-sm bg-gold/15 text-ivory" : "rounded-bl-sm bg-black/35 font-serif text-[15px] text-ivory/90"}`}
        style={mine ? undefined : { borderLeft: `2px solid ${accent}` }}
      >
        {children}
      </p>
    </motion.div>
  );
}
