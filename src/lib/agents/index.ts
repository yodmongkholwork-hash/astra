import "server-only";
import { getPersona, PERSONAS, type Persona } from "@/lib/data/personas";
import { getRoom, type RoomSlug } from "@/lib/data/rooms";
import type { OracleRequest } from "@/lib/types";

/**
 * ASTRA Agent Architecture
 * ------------------------
 * system prompt = BASE (safety + format)  +  DISCIPLINE agent (what the room knows)
 *               + PERSONA layer (how the oracle speaks)  +  CONTEXT (engine facts, profile)
 *
 * The calculation engines (src/lib/engines) compute; agents only interpret.
 * To add a new discipline: add a Room, a scene, an engine, and an entry below.
 */

const BASE = `You are an oracle inside ASTRA, an immersive fortune-telling universe.
Rules:
- Reply in Thai unless the user writes in another language.
- Readings are for reflection and entertainment. Never state predictions as certain facts.
- Do not give medical, legal or financial instructions; gently suggest a qualified professional when those topics come up.
- If the user expresses thoughts of self-harm or crisis, drop the persona's mystique, respond with care, and encourage them to contact someone they trust or a local crisis line (in Thailand: 1323 mental-health hotline).
- When engine facts are provided, base the interpretation on them and do not invent different cards, numbers or signs.
- Keep replies focused: 2–5 short paragraphs, optionally ending with one reflective question.`;

const DISCIPLINES: Record<RoomSlug, string> = {
  tarot:
    "Discipline: Tarot. Interpret each drawn card in its spread position, note upright/reversed when given, then weave the cards into one story answering the querent's question.",
  astrology:
    "Discipline: Western astrology (tropical). Use the supplied sun sign and any chart data; explain elements, modalities and planetary themes. If birth time is missing, say Rising sign cannot be determined.",
  "thai-astrology":
    "Discipline: Thai astrology (โหราศาสตร์ไทย). Use concepts of ลัคนา, ดาวพระเคราะห์ ๑–๙ และราหู/เกตุ, ทักษา, and เรือนชะตา. Respectful, contemporary tone.",
  "chinese-astrology":
    "Discipline: Chinese astrology. Use the zodiac animal, Heavenly Stem element, yin/yang and Five Elements cycles; mention BaZi pillars when supplied.",
  numerology:
    "Discipline: Numerology (Pythagorean). Interpret Life Path and number-root results, including master numbers 11/22/33.",
  dreams:
    "Discipline: Dream interpretation. Combine Thai folk dream lore (ทำนายฝัน) with symbolic/psychological reading. Ask about feelings in the dream if unclear.",
  palmistry:
    "Discipline: Palmistry. Interpret the palm lines the user selected (life, head, heart, fate). Image analysis is not yet available; rely on the user's description.",
};

export function buildSystemPrompt(req: OracleRequest, persona: Persona): string {
  const room = getRoom(req.room);
  const parts = [BASE, DISCIPLINES[req.room], `Persona: ${persona.name} (${persona.title}). ${persona.systemPrompt}`];
  if (room) parts.push(`Current room: ${room.name} / ${room.nameTh}.`);
  if (req.profile && Object.values(req.profile).some(Boolean)) {
    parts.push(`Querent profile (may be partial): ${JSON.stringify(req.profile)}`);
  }
  if (req.reading) {
    parts.push(`Engine facts for this reading (authoritative): ${JSON.stringify({ title: req.reading.title, facts: req.reading.facts })}`);
  }
  return parts.join("\n\n");
}

export function resolvePersona(id: string): Persona {
  return getPersona(id) ?? PERSONAS[0];
}

/* ------------------------------------------------------------------
 * Demo Mode responder — used when ANTHROPIC_API_KEY is not configured.
 * Produces persona-flavoured replies from the engine facts so every
 * room is fully explorable offline.
 * ------------------------------------------------------------------ */
const OPENERS: Record<string, string> = {
  "madame-luna": "แสงจันทร์กระซิบกับฉันแล้ว ที่รัก…",
  "the-truth": "ตรง ๆ นะ",
  aurora: "ขอบคุณที่เล่าให้ฟังนะ ฉันรู้สึกได้ถึงสิ่งที่คุณกำลังเผชิญ",
  "professor-orion": "มาวิเคราะห์จากข้อมูลกันเป็นลำดับครับ",
  "mystic-raven": "ดวงดาวทั้งเก้าได้เผยลางแล้ว…",
  "little-star": "ว้าว! ✨ ดาวน้อยเห็นอะไรบางอย่างแล้วล่ะ",
};
const CLOSERS: Record<string, string> = {
  "madame-luna": "จงฟังเสียงกระแสน้ำในใจ… แล้วคุณจะรู้ว่าควรก้าวไปทางไหน 🌙",
  "the-truth": "ที่เหลือขึ้นอยู่กับการตัดสินใจของคุณ ลงมือเลย",
  aurora: "ค่อย ๆ เป็นค่อย ๆ ไปนะ คุณทำได้ดีกว่าที่คิดเสมอ 💛",
  "professor-orion": "สรุป: ข้อมูลชี้แนวโน้ม แต่ตัวแปรสำคัญที่สุดคือการกระทำของคุณเอง",
  "mystic-raven": "จงจดจำลางนี้ไว้ เมื่อเวลามาถึง เจ้าจะเข้าใจ",
  "little-star": "สู้ ๆ นะ! ดาวน้อยเป็นกำลังใจให้ 🌟",
};

export function demoReply(req: OracleRequest, persona: Persona): string {
  const last = [...req.messages].reverse().find((m) => m.role === "user")?.content ?? "";
  const opener = OPENERS[persona.id] ?? "";
  const closer = CLOSERS[persona.id] ?? "";
  const body: string[] = [];

  if (req.reading) {
    body.push(`จากผล「${req.reading.title}」— ${req.reading.summary}`);
    body.push(
      persona.id === "the-truth"
        ? "สิ่งที่ผลนี้บอกคือ อย่ารอให้สถานการณ์ตัดสินแทนคุณ จุดอ่อนที่ต้องระวังคือความลังเล"
        : persona.id === "professor-orion"
          ? "1) พลังหลักของผลนี้คือการเปลี่ยนผ่าน 2) ปัจจัยหนุนคือความตั้งใจที่ชัดเจน 3) ปัจจัยเสี่ยงคือการตัดสินใจด้วยอารมณ์"
          : "พลังที่ปรากฏบอกถึงช่วงเวลาแห่งการเปลี่ยนแปลงที่ค่อย ๆ ก่อตัว สิ่งที่คุณหว่านไว้กำลังเริ่มผลิดอก",
    );
  }
  if (last && !(req.reading && last.startsWith("ช่วยตีความผล"))) {
    body.push(`สำหรับคำถาม “${last.slice(0, 120)}${last.length > 120 ? "…" : ""}” — ช่วงนี้เหมาะกับการตั้งเป้าให้ชัด ฟังเสียงตัวเอง และเปิดรับโอกาสที่มาในรูปแบบที่ไม่คาดคิด`);
  }
  if (!body.length) body.push(persona.greeting);

  return [opener, ...body, closer, "\n(โหมดสาธิต — เชื่อมต่อ Claude API เพื่อรับคำทำนายจริง)"].filter(Boolean).join("\n\n");
}
