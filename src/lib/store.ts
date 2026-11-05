"use client";

import { getSupabase } from "@/lib/supabase/client";
import type { HistoryEntry, UserProfile } from "@/lib/types";

/**
 * Persistence layer for profile + reading history.
 * Always writes to localStorage (works offline / Demo Mode) and, when a
 * Supabase user is signed in, mirrors to the `profiles` and `readings` tables.
 */

const HISTORY_KEY = "astra.history";
const PROFILE_KEY = "astra.profile";
export const STORE_EVENT = "astra:store";

const emptyProfile: UserProfile = { name: "", birthDate: "", birthTime: "", birthPlace: "" };

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage full or blocked */
  }
  window.dispatchEvent(new Event(STORE_EVENT));
}

export const loadProfile = () => ({ ...emptyProfile, ...read<Partial<UserProfile>>(PROFILE_KEY, {}) });
export const loadHistory = () => read<HistoryEntry[]>(HISTORY_KEY, []);

async function currentUserId() {
  const sb = getSupabase();
  if (!sb) return null;
  const { data } = await sb.auth.getUser();
  return data.user?.id ?? null;
}

export async function saveProfile(p: UserProfile) {
  write(PROFILE_KEY, p);
  const uid = await currentUserId();
  if (uid) {
    await getSupabase()!.from("profiles").upsert({
      id: uid,
      display_name: p.name || null,
      birth_date: p.birthDate || null,
      birth_time: p.birthTime || null,
      birth_place: p.birthPlace || null,
    });
  }
}

export async function saveReading(entry: Omit<HistoryEntry, "id" | "createdAt">) {
  const full: HistoryEntry = { ...entry, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
  write(HISTORY_KEY, [full, ...loadHistory()].slice(0, 200));
  const uid = await currentUserId();
  if (uid) {
    await getSupabase()!.from("readings").insert({
      user_id: uid,
      discipline_slug: entry.room,
      persona_id: entry.personaId,
      title: entry.title,
      summary: entry.summary,
      interpretation: entry.interpretation ?? null,
      engine_result: entry.facts ?? {},
    });
  }
  return full;
}

export function deleteReading(id: string) {
  write(
    HISTORY_KEY,
    loadHistory().filter((h) => h.id !== id),
  );
}
