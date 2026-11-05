import { NextResponse } from "next/server";
import { config, isDemoMode } from "@/lib/config";
import { buildSystemPrompt, demoReply, resolvePersona } from "@/lib/agents";
import { ROOMS } from "@/lib/data/rooms";
import type { ChatMessage, OracleRequest, OracleResponse } from "@/lib/types";

/**
 * POST /api/oracle — server-side bridge to the Claude Messages API.
 * The API key is read from server env only and never sent to the browser.
 */

const MAX_MESSAGES = 20;
const MAX_CHARS = 2000;

// naive per-instance rate limit (replace with Upstash/Supabase for multi-instance deploys)
const hits = new Map<string, { n: number; t: number }>();
function rateLimited(ip: string) {
  const now = Date.now();
  const h = hits.get(ip);
  if (!h || now - h.t > 60_000) {
    hits.set(ip, { n: 1, t: now });
    return false;
  }
  h.n += 1;
  return h.n > 20;
}

function validate(body: unknown): OracleRequest | string {
  if (!body || typeof body !== "object") return "invalid body";
  const b = body as Partial<OracleRequest>;
  if (!b.room || !ROOMS.some((r) => r.slug === b.room)) return "unknown room";
  if (typeof b.personaId !== "string") return "missing persona";
  if (!Array.isArray(b.messages)) return "messages must be an array";
  const messages: ChatMessage[] = b.messages
    .filter((m): m is ChatMessage => !!m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
    .slice(-MAX_MESSAGES)
    .map((m) => ({ role: m.role, content: m.content.slice(0, MAX_CHARS) }));
  // the Messages API requires the conversation to start with a user turn
  while (messages.length && messages[0].role !== "user") messages.shift();
  if (!messages.length) return "at least one user message is required";
  const reading = b.reading && typeof b.reading === "object" ? b.reading : null;
  if (reading && JSON.stringify(reading).length > 6000) return "reading too large";
  return { room: b.room, personaId: b.personaId, messages, reading, profile: b.profile ?? null };
}

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (rateLimited(ip)) {
    return NextResponse.json({ error: "พลังจักรวาลต้องการพักสักครู่ ลองใหม่ในอีกหนึ่งนาที" }, { status: 429 });
  }

  let parsed: OracleRequest | string;
  try {
    parsed = validate(await request.json());
  } catch {
    parsed = "invalid JSON";
  }
  if (typeof parsed === "string") return NextResponse.json({ error: parsed }, { status: 400 });

  const persona = resolvePersona(parsed.personaId);

  if (isDemoMode()) {
    await new Promise((r) => setTimeout(r, 700)); // let the loading animation breathe
    return NextResponse.json<OracleResponse>({ reply: demoReply(parsed, persona), demo: true });
  }

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": config.anthropicKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: config.anthropicModel,
        max_tokens: 1024,
        system: buildSystemPrompt(parsed, persona),
        messages: parsed.messages,
      }),
      signal: AbortSignal.timeout(45_000),
    });

    if (!res.ok) {
      const detail = await res.text();
      console.error("[oracle] Claude API error", res.status, detail.slice(0, 500));
      return NextResponse.json({ error: "หมอดูกำลังติดต่อจักรวาลไม่ได้ชั่วคราว กรุณาลองใหม่" }, { status: 502 });
    }
    const data = (await res.json()) as { content?: { type: string; text?: string }[] };
    const reply = (data.content ?? [])
      .filter((c) => c.type === "text")
      .map((c) => c.text)
      .join("\n")
      .trim();
    return NextResponse.json<OracleResponse>({ reply: reply || "…", demo: false });
  } catch (err) {
    console.error("[oracle] request failed", err);
    return NextResponse.json({ error: "การเชื่อมต่อขัดข้อง กรุณาลองใหม่อีกครั้ง" }, { status: 504 });
  }
}
