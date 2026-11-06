// Standalone bundle: there is no Next server, so /api/oracle is answered in the browser.
//  1. Inside a Claude viewer the page asks Claude itself through the `sample`
//     capability (the viewer's own Claude account — no API key in the page).
//  2. Anywhere else (a local file, consent declined, rate limit) it falls back to
//     the same Demo Mode responder the server uses without an API key.
// The prompt is built by the same agent layer as the server route (lib/agents).
import { buildSystemPrompt, demoReply, resolvePersona } from "@/lib/agents";
import type { OracleRequest } from "@/lib/types";

type SampleFn = ((input: { role: "user" | "assistant"; content: string }[], opts?: Record<string, unknown>) => Promise<{ text: string; truncated: boolean }>) | null;
type ClaudeGlobal = { use?: (name: string) => Promise<unknown> };

let samplePromise: Promise<SampleFn> | null = null;
function getSample(): Promise<SampleFn> {
  if (!samplePromise) {
    const c = (window as unknown as { claude?: ClaudeGlobal }).claude;
    samplePromise = c?.use ? (c.use("sample") as Promise<SampleFn>).catch(() => null) : Promise.resolve(null);
  }
  return samplePromise;
}
// start resolving early so the first question does not wait for the runtime
setTimeout(() => void getSample(), 0);

let sampleBlocked = false; // a declined consent / policy refusal is final for this page load

async function answer(req: OracleRequest): Promise<{ reply: string; demo: boolean; error?: string }> {
  const persona = resolvePersona(req.personaId);
  const messages = (req.messages ?? []).filter((m) => m && typeof m.content === "string").slice(-20);
  const sample = sampleBlocked ? null : await getSample();
  if (sample && messages.length) {
    const system = buildSystemPrompt({ ...req, messages }, persona);
    // `sample` has no system prompt: the oracle's brief rides on the first user turn
    const turns = messages.map((m, i) => ({
      role: m.role,
      content: i === 0 ? `<oracle_brief>\n${system}\n</oracle_brief>\n\nคำถามของผู้มาดูดวง:\n${m.content.slice(0, 2000)}` : m.content.slice(0, 2000),
    }));
    if (turns[0].role !== "user") turns.shift();
    try {
      const { text } = await sample(turns, { modelTier: "default", cache: false });
      if (text.trim()) return { reply: text.trim(), demo: false };
    } catch (e) {
      const code = (e as { code?: string }).code ?? "upstream_error";
      // permanently unavailable in this view → Demo Mode for the rest of the visit
      if (["not_granted", "sampling_disabled", "not_declared", "capability_disabled", "capability_removed"].includes(code)) sampleBlocked = true;
      else {
        const msg: Record<string, string> = {
          rate_limited: "ถามถี่เกินไป หรือถึงขีดจำกัดการใช้งาน Claude ของบัญชี ลองใหม่อีกสักครู่",
          session_expired: "เซสชันหมดอายุ กรุณาเข้าสู่ระบบ Claude ใหม่แล้วลองอีกครั้ง",
          refused: "หมอดูตอบคำถามนี้ไม่ได้ ลองถามด้วยถ้อยคำอื่น",
          prompt_too_large: "บทสนทนายาวเกินไป ลองเริ่มคำถามใหม่",
        };
        return { reply: "", demo: false, error: msg[code] ?? "การเชื่อมต่อกับหมอดูขัดข้องชั่วคราว กดส่งอีกครั้ง" };
      }
    }
  }
  await new Promise((r) => setTimeout(r, 600));
  return { reply: demoReply({ ...req, messages }, persona), demo: true };
}

const realFetch = window.fetch.bind(window);
window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
  const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
  if (url.endsWith("/api/oracle")) {
    const req = JSON.parse(String(init?.body ?? "{}")) as OracleRequest;
    const out = await answer(req);
    if (out.error) return new Response(JSON.stringify({ error: out.error }), { status: 503, headers: { "content-type": "application/json" } });
    return new Response(JSON.stringify({ reply: out.reply, demo: out.demo }), { status: 200, headers: { "content-type": "application/json" } });
  }
  return realFetch(input, init);
};
