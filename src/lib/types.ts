import type { RoomSlug } from "./data/rooms";

/**
 * A computed reading produced by a room's calculation engine.
 * `facts` is the deterministic engine output; the AI only interprets it.
 */
export interface ReadingPayload {
  room: RoomSlug;
  title: string; // short Thai headline, e.g. "ไพ่ 3 ใบ: อดีต-ปัจจุบัน-อนาคต"
  summary: string; // human-readable summary of the engine result (Thai)
  facts: Record<string, unknown>; // structured engine output sent to the agent
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface OracleRequest {
  room: RoomSlug;
  personaId: string;
  messages: ChatMessage[];
  reading?: ReadingPayload | null;
  profile?: { name?: string; birthDate?: string; birthTime?: string; birthPlace?: string } | null;
}

export interface OracleResponse {
  reply: string;
  demo: boolean;
  /** why the answer came from Demo Mode (shown under the chat), if known */
  note?: string;
  /** the viewer can fix it: open the page's permission settings */
  action?: "permissions";
}

export interface HistoryEntry {
  id: string;
  createdAt: string;
  room: RoomSlug;
  personaId: string;
  title: string;
  summary: string;
  interpretation?: string;
  facts?: Record<string, unknown>;
}

export interface UserProfile {
  name: string;
  birthDate: string; // YYYY-MM-DD
  birthTime: string; // HH:mm
  birthPlace: string; // a place id from lib/data/places, a typed name, or "custom"
  birthLat?: number; // for "custom" birthplaces
  birthLon?: number;
  birthTz?: string;
}
