// Standalone bundle: there is no Next server, so /api/oracle is answered in the browser.
//  1. Inside a Claude viewer the page asks Claude itself through the `sample`
//     capability (the viewer's own Claude account — no API key in the page).
//  2. Anywhere else (a local file, a separate browser tab, consent declined) it
//     falls back to Demo Mode and tells the viewer why and how to switch to Claude.
// The prompt is built by the same agent layer as the server route (lib/agents).
import { buildSystemPrompt, demoReply, resolvePersona } from "@/lib/agents";
import type { OracleRequest, OracleResponse } from "@/lib/types";

type SampleFn = ((input: { role: "user" | "assistant"; content: string }[], opts?: Record<string, unknown>) => Promise<{ text: string; truncated: boolean }>) | null;
type Permissions = { state: (name: string) => Promise<string>; manage: () => Promise<void> } | null;
type ClaudeGlobal = { use?: (name: string) => Promise<unknown> };

const claudeGlobal = () => (window as unknown as { claude?: ClaudeGlobal }).claude;

let samplePromise: Promise<SampleFn> | null = null;
function getSample(): Promise<SampleFn> {
  if (!samplePromise) {
    const c = claudeGlobal();
    samplePromise = c?.use ? (c.use("sample") as Promise<SampleFn>).catch(() => null) : Promise.resolve(null);
  }
  return samplePromise;
}
const getPermissions = (): Promise<Permissions> => {
  const c = claudeGlobal();
  return c?.use ? (c.use("permissions") as Promise<Permissions>).catch(() => null) : Promise.resolve(null);
};
setTimeout(() => void getSample(), 0); // start resolving early

// "เปิดการตั้งค่าสิทธิ์" button in the chat
window.addEventListener("astra:ai-permissions", async () => {
  const p = await getPermissions();
  try {
    await p?.manage();
    blocked = null; // the viewer may have allowed Claude: try again on the next question
  } catch {
    /* panel unavailable: the note already explains the artifact menu */
  }
});

const NOTES = {
  outside: "หน้านี้ไม่ได้เปิดอยู่ภายใน Claude (เช่น เปิดจากไฟล์ในเครื่อง หรือเปิดลิงก์ในแท็บเบราว์เซอร์แยก) จึงเรียก Claude ไม่ได้ — เปิดหน้า ASTRA จากการ์ดในแชท Claude แล้วถามใหม่",
  denied: "หน้านี้ยังไม่ได้รับอนุญาตให้ใช้ Claude — กดปุ่มด้านล่างแล้วเปิดสิทธิ์ \"Claude\" (หรือรีโหลดหน้าแล้วกด Allow ตอนที่ระบบถาม)",
  disabled: "บัญชีหรือองค์กรของคุณปิดการใช้ Claude ภายในหน้า Artifact ไว้",
  empty: "Claude ไม่ได้ส่งคำตอบกลับมา ลองถามใหม่อีกครั้ง",
};
let blocked: { note: string; action?: "permissions" } | null = null;

async function answer(req: OracleRequest): Promise<OracleResponse & { error?: string }> {
  const persona = resolvePersona(req.personaId);
  const messages = (req.messages ?? []).filter((m) => m && typeof m.content === "string").slice(-20);
  const demo = async (why: { note: string; action?: "permissions" }) => {
    await new Promise((r) => setTimeout(r, 500));
    return { reply: demoReply({ ...req, messages }, persona), demo: true, ...why };
  };
  if (blocked) return demo(blocked);
  if (!claudeGlobal()?.use) return demo({ note: NOTES.outside });
  const sample = await getSample();
  if (!sample) return demo({ note: NOTES.outside });

  const perms = await getPermissions();
  const st = perms ? await perms.state("sample").catch(() => "prompt") : "prompt";
  if (st === "denied") return demo({ note: NOTES.denied, action: "permissions" });
  if (st === "unavailable") return demo({ note: NOTES.disabled });

  const system = buildSystemPrompt({ ...req, messages }, persona);
  // `sample` has no system prompt: the oracle's brief rides on the first user turn
  const turns = messages.map((m, i) => ({
    role: m.role,
    content: i === 0 ? `<oracle_brief>\n${system}\n</oracle_brief>\n\nคำถามของผู้มาดูดวง:\n${m.content.slice(0, 2000)}` : m.content.slice(0, 2000),
  }));
  while (turns.length && turns[0].role !== "user") turns.shift();
  try {
    const { text } = await sample(turns, { modelTier: "default", cache: false });
    if (text.trim()) return { reply: text.trim(), demo: false };
    return { reply: "", demo: false, error: NOTES.empty };
  } catch (e) {
    const code = (e as { code?: string }).code ?? "upstream_error";
    if (code === "not_granted") {
      blocked = { note: NOTES.denied, action: "permissions" };
      return demo(blocked);
    }
    if (["sampling_disabled", "not_declared", "capability_disabled", "capability_removed"].includes(code)) {
      blocked = { note: `${NOTES.disabled} (${code})` };
      return demo(blocked);
    }
    const msg: Record<string, string> = {
      rate_limited: "ถามถี่เกินไป หรือถึงขีดจำกัดการใช้งาน Claude ของบัญชี ลองใหม่อีกสักครู่",
      session_expired: "เซสชันหมดอายุ กรุณาเข้าสู่ระบบ Claude ใหม่แล้วลองอีกครั้ง",
      refused: "หมอดูตอบคำถามนี้ไม่ได้ ลองถามด้วยถ้อยคำอื่น",
      prompt_too_large: "บทสนทนายาวเกินไป ลองเริ่มคำถามใหม่",
    };
    return { reply: "", demo: false, error: `${msg[code] ?? "การเชื่อมต่อกับหมอดูขัดข้องชั่วคราว กดส่งอีกครั้ง"} (${code})` };
  }
}

const realFetch = window.fetch.bind(window);
window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
  const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
  if (url.endsWith("/api/oracle")) {
    const req = JSON.parse(String(init?.body ?? "{}")) as OracleRequest;
    const { error, ...out } = await answer(req);
    if (error) return new Response(JSON.stringify({ error }), { status: 503, headers: { "content-type": "application/json" } });
    return new Response(JSON.stringify(out), { status: 200, headers: { "content-type": "application/json" } });
  }
  return realFetch(input, init);
};
