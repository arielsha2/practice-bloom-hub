import { supabase } from "@/integrations/supabase/client";
import type { Gender } from "@/lib/challengeTools";

// Client side of the second challenge tool (day 2): a conversation with Neri that builds "the four lines" and a
// personal letter to one person. The conversation lives in this browser (localStorage, per account) and is sent
// whole with every turn to challenge-tool-generate (tool = 'personal-note', action "chat"); the server adds the
// prompt and yesterday's card itself. "finish" turns the conversation into the day's products and saves them in
// therapist_deliverables (tool = 'personal-note'); the therapist's own edit of the letter is saved on the same row.

export const LETTER_TOOL = "personal-note";

export interface ChatMsg {
  role: "user" | "assistant";
  content: string;
}

export interface LetterContent {
  gender: Gender;
  four_lines: string[];
  letter: string;
  sentence: string;
  client_words: string[];
  reader: string;
  bridge: string;
}

export interface LetterEdit {
  letter?: string | null;
}

export interface LetterRow {
  id: string;
  version: number;
  content: LetterContent;
  edited_content: LetterEdit | null;
  created_at: string;
}

const storeKey = (userId: string) => `challenge_letter_chat:${userId}`;

export interface SavedChat {
  messages: ChatMsg[];
  draft: boolean; // Neri has written a first draft (the "sum up" button shows)
}

export function loadChat(userId: string): SavedChat | null {
  try {
    const raw = localStorage.getItem(storeKey(userId));
    if (!raw) return null;
    const v = JSON.parse(raw) as SavedChat;
    return Array.isArray(v?.messages) ? { messages: v.messages, draft: !!v.draft } : null;
  } catch {
    return null;
  }
}

export function saveChat(userId: string, chat: SavedChat | null) {
  try {
    if (chat) localStorage.setItem(storeKey(userId), JSON.stringify(chat));
    else localStorage.removeItem(storeKey(userId));
  } catch {
    // storage blocked: the conversation only lasts while the page is open
  }
}

export type ChatResult = { status: "ok"; reply: string; draft: boolean } | { status: "limit" } | { status: "error" };

export async function sendChat(messages: ChatMsg[], gender: Gender, name: string): Promise<ChatResult> {
  try {
    const { data, error } = await supabase.functions.invoke("challenge-tool-generate", {
      body: { tool: LETTER_TOOL, action: "chat", messages, gender, name },
    });
    if (error) {
      const status = (error as { context?: Response }).context?.status;
      return { status: status === 429 ? "limit" : "error" };
    }
    if (data?.status === "ok" && typeof data.reply === "string") return { status: "ok", reply: data.reply, draft: !!data.draft };
    return { status: "error" };
  } catch {
    return { status: "error" };
  }
}

export type FinishResult = { status: "ok"; row: LetterRow } | { status: "no_letter" } | { status: "limit" } | { status: "error" };

export async function finishLetter(messages: ChatMsg[], gender: Gender, source: string | null): Promise<FinishResult> {
  try {
    const { data, error } = await supabase.functions.invoke("challenge-tool-generate", {
      body: { tool: LETTER_TOOL, action: "finish", messages, gender, source },
    });
    if (error) {
      const status = (error as { context?: Response }).context?.status;
      return { status: status === 429 ? "limit" : "error" };
    }
    if (data?.status === "ok") {
      const d = data.deliverable;
      return { status: "ok", row: { id: d.id, version: d.version, content: d.content, edited_content: null, created_at: new Date().toISOString() } };
    }
    if (data?.status === "no_letter") return { status: "no_letter" };
    return { status: "error" };
  } catch {
    return { status: "error" };
  }
}

export async function loadLatestLetter(): Promise<LetterRow | null> {
  const { data, error } = await supabase
    .from("therapist_deliverables")
    .select("id, version, content, edited_content, created_at")
    .eq("tool", LETTER_TOOL)
    .order("version", { ascending: false })
    .limit(1);
  if (error) throw error;
  const row = (data ?? [])[0];
  return row ? (row as unknown as LetterRow) : null;
}

export async function hasCard(): Promise<boolean> {
  const { count, error } = await supabase.from("therapist_deliverables").select("id", { count: "exact", head: true }).eq("tool", "professional-card");
  return !error && (count ?? 0) > 0;
}

export async function saveLetterEdit(id: string, edit: LetterEdit): Promise<void> {
  const { error } = await supabase
    .from("therapist_deliverables")
    .update({ edited_content: edit as unknown as never, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

export async function recordLetterEvent(kind: "viewed" | "copied" | "downloaded" | "edited" | "regenerated", deliverableId: string | null) {
  try {
    const { data } = await supabase.auth.getUser();
    if (!data.user) return;
    await supabase.from("deliverable_events").insert({ user_id: data.user.id, deliverable_id: deliverableId, tool: LETTER_TOOL, kind });
  } catch (e) {
    console.error("failed to record letter event", e);
  }
}

// Admin only (checked by the function): deletes the admin's own letter rows, to try the exercise again.
export async function resetMyLetter(): Promise<boolean> {
  const { data, error } = await supabase.functions.invoke("challenge-tool-generate", { body: { tool: LETTER_TOOL, action: "reset" } });
  return !error && data?.status === "ok";
}
