import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Expose-Headers": "X-Conversation-Id",
};

// Bots that allow anonymous (unauthenticated) access
const PUBLIC_BOTS: Record<string, string> = {
  "contact-finder": "2026-03-22",
};

interface ChatRequest {
  botKey: string;
  conversationId?: string;
  message: string;
  language?: "he" | "en";
}

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

// What an agent already knows about the therapist from the OTHER tools, so
// moving between tools doesn't mean re-introducing themselves each time.
// Allowlisted fields only (no free-form dumps), each value and the whole
// block length-capped, so this stays a few hundred tokens per message.
const CONTEXT_FIELD_MAX = 220;
const CONTEXT_BLOCK_MAX = 2400;

type ContextField = { key: string; he: string; en: string; max?: number };
type ContextSpec = {
  botKey: string;
  column: string;
  label: { he: string; en: string };
  fields: ContextField[];
};

const CONTEXT_SPECS: ContextSpec[] = [
  {
    botKey: "niche-finder",
    column: "niche_output",
    label: { he: "הנישה (מציאת הנישה)", en: "Niche (Niche Finder)" },
    fields: [
      { key: "ideal_client", he: "המטופל/ת האידיאלי/ת", en: "Ideal client" },
      { key: "core_pain", he: "הכאב המרכזי", en: "Core pain" },
      { key: "transformation", he: "השינוי שהמטופל/ת מקבל/ת", en: "Transformation" },
      { key: "handshake_version", he: "משפט \"לחיצת יד\"", en: "Handshake line" },
    ],
  },
  {
    botKey: "self-presentation",
    column: "self_presentation_output",
    label: { he: "ההצגה העצמית", en: "Self-presentation" },
    fields: [
      { key: "external_pain", he: "הכאב החיצוני של המטופל/ת", en: "Client's external pain" },
      { key: "internal_pain", he: "הכאב הפנימי", en: "Internal pain" },
      { key: "desire", he: "הכמיהה", en: "Desire" },
      { key: "result", he: "התוצאה", en: "Result" },
      { key: "story_version", he: "גרסת הסיפור", en: "Story version", max: 320 },
    ],
  },
  {
    botKey: "pricing-calculator",
    column: "pricing_output",
    label: { he: "התמחור", en: "Pricing" },
    fields: [
      { key: "comfort_range_low", he: "תעריף נוח מינימלי", en: "Comfort rate (low)" },
      { key: "comfort_range_high", he: "תעריף נוח מקסימלי", en: "Comfort rate (high)" },
      { key: "recommended_rate", he: "תעריף מומלץ", en: "Recommended rate" },
      { key: "target_clients_per_week", he: "מטופלים בשבוע (יעד)", en: "Target clients per week" },
      { key: "monthly_income", he: "הכנסה חודשית רצויה", en: "Target monthly income" },
    ],
  },
  {
    botKey: "contact-finder",
    column: "contact_finder_output",
    label: { he: "אנשי קשר להפניות", en: "Referral contacts" },
    fields: [{ key: "contacts", he: "סוגי אנשי קשר שמופו", en: "Contact types mapped", max: 300 }],
  },
  {
    botKey: "connection-bridge",
    column: "connection_bridge_output",
    label: { he: "גשר הקשר", en: "Connection Bridge" },
    fields: [
      { key: "contact_type", he: "סוג איש הקשר שתורגל", en: "Contact type practiced" },
      { key: "next_action", he: "הצעד הבא שסוכם", en: "Agreed next step" },
      { key: "key_improvement", he: "השיפור המרכזי", en: "Key improvement" },
    ],
  },
  {
    botKey: "first-call-practice",
    column: "first_call_practice_output",
    label: { he: "תרגול שיחת הטלפון הראשונה", en: "First-call practice" },
    fields: [
      { key: "presenting_concern", he: "הקושי שתורגל", en: "Concern practiced" },
      { key: "weakest_trust", he: "האמון החלש ביותר", en: "Weakest trust" },
      { key: "internal_blockers", he: "חסמים פנימיים", en: "Internal blockers" },
      { key: "pricing_moment", he: "התנהלות סביב המחיר", en: "Handling of price" },
      { key: "key_improvement", he: "השיפור המרכזי", en: "Key improvement" },
    ],
  },
];

// The extractors fill gaps with placeholders ("something general", "not
// said"). Passing those on would present filler to the next agent as fact.
const CONTEXT_FILLER = new Set([
  "משהו כללי", "כללי", "לא נאמר", "לא צוין", "לא ידוע", "אין", "לא רלוונטי",
  "general", "something general", "not said", "not stated", "unknown", "none", "n/a",
]);

// Sentence-form non-answers the extractors write when a detail is missing
// (e.g. "המטפל לא ציין את לקוח הקצה..."). Short ones only, so real content that
// merely contains these words is kept.
const NON_ANSWER_PATTERNS = [
  /^המטפל(?:\/ת)?\s+לא\s+(?:ציין|צוין|הזכיר|סיפק|נתן|אמר|הגדיר)/,
  /\bלא\s+(?:צוין|נאמר|הוזכר|ידוע|סופק|הוגדר)\b/,
  /\b(?:not|wasn'?t|was not)\s+(?:specified|mentioned|stated|provided|defined)\b/i,
  /\bdid(?:n'?t| not)\s+(?:specify|mention|state|provide)\b/i,
  /\bno information\b/i,
];
function isNonAnswer(s: string): boolean {
  return s.length <= 110 && NON_ANSWER_PATTERNS.some((re) => re.test(s));
}

function renderContextValue(v: unknown, max: number): string {
  let s = "";
  if (typeof v === "string") s = v;
  else if (typeof v === "number") s = String(v);
  else if (Array.isArray(v)) {
    s = v
      .map((x: any) => (typeof x === "string" ? x : x?.profession ?? ""))
      .filter((x: string) => typeof x === "string" && x.trim())
      .join("; ");
  }
  s = s.replace(/\s+/g, " ").trim();
  if (CONTEXT_FILLER.has(s.toLowerCase().replace(/[.!…\-–—:;,\s]+$/g, ""))) return "";
  if (isNonAnswer(s)) return "";
  return s.length > max ? s.slice(0, max - 1) + "…" : s;
}

// ---------------------------------------------------------------------------
// Shared "professional details" card. Captured server-side here (not in
// mentor-analyze, which has no auth and persists nothing) from what the
// therapist already wrote to the Mentor and to other tools, cached in
// therapist_profiles, and refreshed only when they've said something new.
// ---------------------------------------------------------------------------
const PROFILE_VALUE_MAX = 120;
const PROFILE_SOURCE_MAX = 3000; // per source (Mentor chat / other tools), head+tail
const PROFILE_LLM_TIMEOUT_MS = 7000;

const PROFILE_FIELDS: { key: string; he: string; en: string }[] = [
  { key: "profession", he: "מקצוע", en: "Profession" },
  { key: "modalities", he: "שיטות טיפול", en: "Modalities" },
  { key: "experience", he: "ותק / שלב בקריירה", en: "Experience" },
  { key: "location", he: "מיקום", en: "Location" },
  { key: "current_fee", he: "מחיר נוכחי לפגישה", en: "Current fee per session" },
  { key: "client_population", he: "אוכלוסיית מטופלים", en: "Client population" },
];

const PROFILE_EXTRACTION_PROMPT = `You extract a therapist's professional details from what THEY wrote in chat (Mentor chat and tool conversations). A short reply may be preceded by (re: "...") showing the question it answers.

Return JSON only, exactly these keys:
{"profession":"","modalities":"","experience":"","location":"","current_fee":"","client_population":""}

Rules:
- Use ONLY facts the therapist explicitly stated about themselves. Never infer, guess or complete. If not stated, return "".
- profession: their professional title as stated (e.g. clinical social worker, clinical psychologist, art therapist).
- modalities: therapeutic approaches or methods they say they practice or are trained in.
- experience: how long they have practiced, or their career stage, as stated (e.g. "opened a private clinic a year and a half ago").
- location: the city or region where they practice, as stated.
- current_fee: the fee per session they CURRENTLY charge, keeping the number and currency wording as written. A fee they are considering or aiming for ("I want to raise it to 450") is NOT current. If unclear, "".
- client_population: who they say they work with (e.g. adults, couples, adolescents).
- Keep each value under 80 characters, in the therapist's own language (Hebrew stays Hebrew).
- Never include patient or client names, identifying details or case information. Only the general population served.
- When you are not sure about a field, return "".`;

function headTail(s: string, max: number): string {
  if (s.length <= max) return s;
  const half = Math.floor(max / 2);
  // The therapist usually introduces themselves first, so the head matters as
  // much as the most recent messages.
  return s.slice(0, half) + "\n…\n" + s.slice(s.length - half);
}

// Turns message arrays ({role, content}) into the therapist's own lines. A very
// short reply ("400") is meaningless alone, so it carries the question before it.
function userLines(msgs: any[]): string[] {
  const out: string[] = [];
  let lastAssistant = "";
  for (const m of msgs ?? []) {
    const text = typeof m?.content === "string" ? m.content.replace(/\s+/g, " ").trim() : "";
    if (!text) continue;
    if (m.role === "assistant") {
      lastAssistant = text;
    } else if (m.role === "user") {
      if (/^\[KICKOFF\]/i.test(text)) continue;
      out.push(text.length < 40 && lastAssistant ? `(re: "${lastAssistant.slice(-160)}") ${text}` : text);
    }
  }
  return out;
}

function collectProfileSourceText(mentorMsgArrays: any[][], toolMsgArrays: any[][]): string {
  const mentor = headTail(mentorMsgArrays.flatMap(userLines).join("\n"), PROFILE_SOURCE_MAX);
  const tools = headTail(toolMsgArrays.flatMap(userLines).join("\n"), PROFILE_SOURCE_MAX);
  const parts: string[] = [];
  if (mentor.trim()) parts.push(`Mentor chat — therapist's messages:\n${mentor}`);
  if (tools.trim()) parts.push(`Tool conversations — therapist's messages:\n${tools}`);
  return parts.join("\n\n");
}

function parseProfileResponse(raw: string): Record<string, string> {
  let parsed: any = {};
  try {
    parsed = JSON.parse(raw);
  } catch {
    const m = typeof raw === "string" ? raw.match(/\{[\s\S]*\}/) : null;
    if (m) {
      try { parsed = JSON.parse(m[0]); } catch { parsed = {}; }
    }
  }
  const out: Record<string, string> = {};
  for (const f of PROFILE_FIELDS) {
    const v = renderContextValue(parsed?.[f.key], PROFILE_VALUE_MAX); // also drops filler
    if (v) out[f.key] = v;
  }
  return out;
}

// Newer explicit statements win; a field the model found nothing for keeps its
// earlier value (the source window is capped, so older details can fall out of it).
function mergeProfile(prev: Record<string, unknown> | null, next: Record<string, string>): Record<string, string> {
  const merged: Record<string, string> = {};
  for (const f of PROFILE_FIELDS) {
    const p = typeof prev?.[f.key] === "string" ? (prev![f.key] as string) : "";
    const n = next[f.key] ?? "";
    if (n || p) merged[f.key] = n || p;
  }
  return merged;
}

// Newest message timestamp inside a Mentor conversation's JSON array — the row's
// updated_at lags the real last message in a lot of conversations.
function lastMessageTs(msgs: any): string | null {
  if (!Array.isArray(msgs)) return null;
  for (let i = msgs.length - 1; i >= 0; i--) {
    const t = msgs[i]?.ts;
    if (typeof t === "string" && !Number.isNaN(new Date(t).getTime())) return t;
  }
  return null;
}

function profileIsStale(profileUpdatedAt: string | null, latestActivityAt: string | null): boolean {
  if (!latestActivityAt) return false; // nothing said yet — nothing to extract
  if (!profileUpdatedAt) return true;
  return new Date(latestActivityAt).getTime() > new Date(profileUpdatedAt).getTime();
}

// Loads the cached profile and, when starting a NEW tool conversation after the
// therapist has said something new, refreshes it first. Every failure path
// returns whatever profile we already had — the chat must never wait on this
// beyond PROFILE_LLM_TIMEOUT_MS or break because of it.
async function loadTherapistProfile(
  supabase: any,
  userId: string,
  currentConversationId: string | undefined,
  isNewConversation: boolean,
  lovableApiKey: string,
): Promise<Record<string, unknown>> {
  const { data: row } = await supabase
    .from("therapist_profiles")
    .select("profile, updated_at")
    .eq("user_id", userId)
    .maybeSingle();
  const existing: Record<string, unknown> = (row?.profile as Record<string, unknown>) ?? {};
  if (!isNewConversation) return existing;

  try {
    // bot_conversations.last_message_at is never updated (it stays equal to
    // created_at), so activity is read from the messages themselves.
    let otherConvQuery = supabase
      .from("bot_conversations")
      .select("id")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(8);
    if (currentConversationId) otherConvQuery = otherConvQuery.neq("id", currentConversationId);
    const { data: otherConvs } = await otherConvQuery;
    const convIds = ((otherConvs ?? []) as any[]).map((c) => c.id);

    const [{ data: mentorRows }, { data: latestToolMsg }] = await Promise.all([
      supabase
        .from("mentor_conversations")
        .select("messages, messages_archive, updated_at")
        .eq("user_id", userId)
        .order("updated_at", { ascending: false })
        .limit(3),
      convIds.length > 0
        ? supabase
            .from("bot_messages")
            .select("created_at")
            .in("conversation_id", convIds)
            .eq("role", "user")
            .order("created_at", { ascending: false })
            .limit(1)
        : Promise.resolve({ data: [] }),
    ]);

    const stamps: string[] = [];
    for (const r of (mentorRows ?? []) as any[]) {
      if (r.updated_at) stamps.push(r.updated_at);
      const t = lastMessageTs(r.messages);
      if (t) stamps.push(t);
    }
    for (const r of (latestToolMsg ?? []) as any[]) if (r.created_at) stamps.push(r.created_at);
    const latestActivity = stamps.length
      ? new Date(Math.max(...stamps.map((x) => new Date(x).getTime()))).toISOString()
      : null;
    if (!profileIsStale((row as any)?.updated_at ?? null, latestActivity)) return existing;

    let toolMsgArrays: any[][] = [];
    if (convIds.length > 0) {
      const { data: toolMsgs } = await supabase
        .from("bot_messages")
        .select("conversation_id, role, content, created_at")
        .in("conversation_id", convIds)
        .order("created_at", { ascending: true })
        .limit(160);
      const byConv = new Map<string, any[]>();
      for (const m of (toolMsgs ?? []) as any[]) {
        if (!byConv.has(m.conversation_id)) byConv.set(m.conversation_id, []);
        byConv.get(m.conversation_id)!.push(m);
      }
      toolMsgArrays = [...byConv.values()];
    }
    const mentorMsgArrays = ((mentorRows ?? []) as any[]).map((r) => [
      ...(Array.isArray(r.messages_archive) ? r.messages_archive : []),
      ...(Array.isArray(r.messages) ? r.messages : []),
    ]);

    const sourceText = collectProfileSourceText(mentorMsgArrays, toolMsgArrays);
    let next: Record<string, string> = {};
    if (sourceText) {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), PROFILE_LLM_TIMEOUT_MS);
      try {
        const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          signal: ctrl.signal,
          headers: { Authorization: `Bearer ${lovableApiKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            temperature: 0,
            response_format: { type: "json_object" },
            messages: [
              { role: "system", content: PROFILE_EXTRACTION_PROMPT },
              { role: "user", content: sourceText },
            ],
          }),
        });
        if (!aiRes.ok) throw new Error(`profile LLM ${aiRes.status}`);
        const data = await aiRes.json();
        next = parseProfileResponse(data?.choices?.[0]?.message?.content ?? "{}");
      } finally {
        clearTimeout(timer);
      }
    }

    const merged = mergeProfile(existing, next);
    // Written even when empty, so a therapist who has told us nothing useful
    // isn't re-extracted on every tool they open.
    await supabase
      .from("therapist_profiles")
      .upsert({ user_id: userId, profile: merged, updated_at: new Date().toISOString() }, { onConflict: "user_id" });
    console.log("therapist profile refreshed, fields:", Object.keys(merged).join(",") || "(none)");
    return merged;
  } catch (e) {
    console.warn("therapist profile refresh failed, using cached:", e);
    return existing;
  }
}

function buildJourneyContextBlock(
  journey: any,
  profile: Record<string, unknown> | null,
  currentBotKey: string,
  isEnglish: boolean,
): string {
  const lang = isEnglish ? "en" : "he";
  const lines: string[] = [];

  // The therapist's own professional details first — exactly what every
  // agent otherwise opens by asking again.
  if (profile && typeof profile === "object") {
    const parts: string[] = [];
    for (const f of PROFILE_FIELDS) {
      const val = renderContextValue(profile[f.key], PROFILE_VALUE_MAX);
      if (val) parts.push(`${f[lang]}: ${val}`);
    }
    if (parts.length > 0) lines.push(`- ${isEnglish ? "Professional details" : "פרטים מקצועיים"}: ${parts.join("; ")}`);
  }

  if (!journey || typeof journey !== "object") {
    journey = {};
  }

  // Diagnosis first — it's the broadest read on where the therapist is stuck.
  // Prefer the compact summary written at extraction time; fall back to fields.
  const diag = journey.diagnosis_output;
  const diagSummary: unknown = journey.reflection?.tool_summaries?.["practice-diagnosis"]?.summary;
  let diagText = typeof diagSummary === "string" ? renderContextValue(diagSummary, 400) : "";
  if (!diagText && diag && typeof diag === "object") {
    diagText = [diag.presenting_theory, diag.diagnosis_summary, diag.bottleneck_description]
      .map((x) => renderContextValue(x, 200))
      .filter(Boolean)
      .join(" | ");
  }
  if (diagText) lines.push(`- ${isEnglish ? "Diagnosis" : "האבחון"}: ${diagText}`);

  for (const spec of CONTEXT_SPECS) {
    // The agent's own earlier output is excluded on purpose, so it doesn't
    // treat its job as already done when the therapist reopens the same tool.
    if (spec.botKey === currentBotKey) continue;
    const rawOut = journey[spec.column];
    if (!rawOut || typeof rawOut !== "object") continue;
    // contact_finder_output is saved as a bare array of {profession, reasoning,
    // name, phone, email}. Only `profession` is ever read (renderContextValue) —
    // the names/phones/emails are third parties' details and must not leave it.
    const out: any = Array.isArray(rawOut) ? { contacts: rawOut } : rawOut;
    const parts: string[] = [];
    for (const f of spec.fields) {
      const val = renderContextValue(out[f.key], f.max ?? CONTEXT_FIELD_MAX);
      if (val) parts.push(`${f[lang]}: ${val}`);
    }
    if (parts.length > 0) lines.push(`- ${spec.label[lang]}: ${parts.join("; ")}`);
  }

  if (lines.length === 0) return "";

  let body = "";
  for (const line of lines) {
    if ((body + line).length > CONTEXT_BLOCK_MAX) break;
    body += (body ? "\n" : "") + line;
  }
  if (!body) return "";

  return isEnglish
    ? `\n\n═══════════════════════════════\nContext from the therapist's earlier work in TherapyKeys (mandatory to use):\n═══════════════════════════════\n${body}\n\nHow to use this (mandatory — it takes priority over any step in your instructions that asks the therapist to introduce themselves or describe their practice, client or background): this was gathered in earlier tools. Use it silently to personalize. Do NOT ask again about anything already covered above — skip or shorten that step. If a detail matters for your current task, confirm it in one short sentence instead of asking from scratch (e.g. "I see your focus is X — still right?"). Do not recite this block or mention that you have it. If what the therapist says now differs from it, trust what they say now.`
    : `\n\n═══════════════════════════════\nהקשר מהעבודה הקודמת של המטפל/ת במערכת TherapyKeys (חובה להשתמש):\n═══════════════════════════════\n${body}\n\nאיך להשתמש בזה (חובה — גובר על כל שלב בהנחיות שלך שמבקש מהמטפל/ת להציג את עצמם, את העשייה, את המטופל/ת או את הרקע): המידע הזה נאסף בכלים הקודמים. השתמש/י בו בשקט כדי להתאים אישית. אל תשאל/י שוב על שום דבר שכבר מופיע למעלה — דלג/י על השלב או קצר/י אותו. אם פרט חשוב למשימה הנוכחית, אשר/י אותו במשפט קצר אחד ("אני רואה שהמיקוד שלך הוא X — עדיין נכון?") במקום לשאול מאפס. אל תצטט/י את הבלוק ואל תציין/י שיש לך אותו. אם מה שהמטפל/ת אומר/ת עכשיו שונה ממה שכתוב כאן — האמן/י למה שנאמר עכשיו.`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");

    if (!lovableApiKey) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse request body first to check if it's a public bot
    const { botKey, conversationId, message, language }: ChatRequest = await req.json();
    const isEnglish = language === "en";
    
    const isPublicBot = PUBLIC_BOTS[botKey] && new Date() < new Date(PUBLIC_BOTS[botKey]);

    const authHeader = req.headers.get("Authorization");
    let user: { id: string } | null = null;
    let supabase: any;

    if (authHeader) {
      supabase = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: { user: authUser }, error: userError } = await supabase.auth.getUser();
      if (!userError && authUser) {
        user = authUser;
      }
    }

    // If not authenticated and not a public bot, reject
    if (!user && !isPublicBot) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // For anonymous public bot access, use service role client (read-only for bot config)
    if (!supabase) {
      supabase = createClient(supabaseUrl, supabaseServiceKey);
    }

    // 1. Load bot configuration
    const { data: botConfig, error: botError } = await supabase
      .from("bot_configurations")
      .select("*")
      .eq("bot_key", botKey)
      .eq("is_active", true)
      .single();

    if (botError || !botConfig) {
      return new Response(JSON.stringify({ error: "Bot not found or inactive" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build system prompt and messages array
    let systemPrompt =
      (isEnglish ? botConfig.system_prompt_en : null) ||
      botConfig.system_prompt ||
      "You are a helpful assistant.";

    // GLOBAL: hand-off protocol back to the Mentor.
    // The bot must emit [ADVANCE] on its own line at the END of its reply when:
    //   (a) it concludes the therapist reached sufficient progress in this tool, OR
    //   (b) the therapist explicitly asks to move on / advance / return to the mentor.
    // The client detects this marker, runs the summary extractor, and routes the
    // therapist back to the Mentor with the summary attached.
systemPrompt += isEnglish ? `

---
Tool identity (mandatory):
You are an independent AI tool within the TherapyKeys system. You are not Eliana and you are not the Mentor.
- Do not open with a greeting in Eliana's name.
- Do not reintroduce yourself as Eliana and do not mention her name.
- If a user arrives having just been referred from the Mentor (KICKOFF) — open directly with your first focused question, without a renewed self-introduction.
---

Closing protocol (mandatory):
When you identify that the therapist has reached a sufficient point of progress in this tool, or the therapist explicitly asks to move on / finish / go back to the mentor — end your final reply with a short, warm closing sentence, then add, on its own separate line only, the marker: [ADVANCE]

Explicit triggers for adding [ADVANCE] — if the therapist writes one of these phrases, always end with the marker:
"thanks", "we're done", "that's enough", "back to mentor", "i want to go back", "that was enough for me",
"done", "finished", "thank you", "that's enough", "back to mentor", "i'm done".

Never use this marker in any other situation. Never mention the marker in visible text.
---` : `

---
זהות הכלי (חובה):
אתה כלי AI עצמאי בתוך מערכת TherapyKeys. אינך אליענה ואינך המנטור.
- אל תפתח/י בברכת שלום בשם אליענה.
- אל תציג/י את עצמך מחדש כאליענה ואל תזכיר/י את שמה.
- אם מגיע אליך משתמש שזה עתה הופנה מהמנטור (KICKOFF) — פתח ישירות בשאלה הראשונה הממוקדת שלך, בלי הצגה עצמית מחודשת.
---

פרוטוקול סיום (חובה):
כאשר אתה מזהה שהמטפל הגיע לנקודת התקדמות מספקת בכלי הזה, או שהמטפל מבקש במפורש להתקדם / לסיים / לחזור למנטור — סיים את התשובה האחרונה שלך במשפט סיכום קצר וחם, ואז הוסף בשורה נפרדת בלבד את הסמן: [ADVANCE]

טריגרים מפורשים להוספת [ADVANCE] (בעברית ובאנגלית) — אם המטפל כותב אחד מהביטויים האלו, סיים תמיד עם הסמן:
"תודה", "סיימנו", "מספיק", "חזרה למנטור", "אני רוצה לחזור", "זה הספיק לי",
"done", "finished", "thank you", "that's enough", "back to mentor", "i'm done".

אל תשתמש בסמן הזה בשום מצב אחר. אל תזכיר את הסמן בטקסט הגלוי.
---`;

    const messages: Message[] = [
      { role: "system", content: systemPrompt },
    ];

    // 2. Get or create conversation (only for authenticated users)
    let currentConversationId = conversationId;
    let isNewConversation = false;
    const isAnonymous = !user;

    if (!isAnonymous) {
      if (!currentConversationId) {
        const { data: newConv, error: convError } = await supabase
          .from("bot_conversations")
          .insert({
            user_id: user!.id,
            bot_key: botKey,
            title: isEnglish ? "New conversation" : "שיחה חדשה",
          })
          .select()
          .single();

        if (convError) {
          console.error("Error creating conversation:", convError);
          return new Response(JSON.stringify({ error: "Failed to create conversation" }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        currentConversationId = newConv.id;
        isNewConversation = true;
      }

      // 3. Load user memory (personal insights)
      const { data: userMemories } = await supabase
        .from("bot_user_memory")
        .select("key, value")
        .eq("user_id", user!.id)
        .eq("bot_key", botKey)
        .order("created_at", { ascending: false });

      if (userMemories && userMemories.length > 0) {
        const memorySection = userMemories
          .map((m: any) => `- ${m.value}`)
          .join("\n");
        systemPrompt += isEnglish
          ? `\n\n---\nInformation gathered about the user (use this to give a personalized response):\n${memorySection}\n---`
          : `\n\n---\nמידע שנאסף על המשתמש (השתמש במידע זה כדי לתת מענה מותאם אישית):\n${memorySection}\n---`;
      }

      // 3b. What the therapist already told the OTHER tools (niche, pricing,
      // diagnosis...), so switching tools doesn't mean starting over. Skipped
      // for the diagnosis itself: it's the intake for a fresh person, and an
      // old diagnosis in context would bias it. Never blocks the chat.
      if (botKey !== "practice-diagnosis") {
        try {
          const [{ data: journey }, profile] = await Promise.all([
            supabase
              .from("therapist_journeys")
              .select(
                "niche_output, self_presentation_output, pricing_output, contact_finder_output, connection_bridge_output, first_call_practice_output, diagnosis_output, reflection",
              )
              .eq("user_id", user!.id)
              .maybeSingle(),
            // Professional details (profession, location, fee...). Refreshed
            // only when a NEW conversation starts after the therapist said
            // something new; otherwise just the cached card.
            loadTherapistProfile(supabase, user!.id, currentConversationId, isNewConversation, lovableApiKey),
          ]);
          systemPrompt += buildJourneyContextBlock(journey, profile, botKey, isEnglish);
        } catch (e) {
          console.warn("journey context load failed, continuing without it:", e);
        }
      }

      // 4. Load conversation history (last 20 messages)
      if (currentConversationId) {
        const { data: conversationHistory } = await supabase
          .from("bot_messages")
          .select("role, content")
          .eq("conversation_id", currentConversationId)
          .order("created_at", { ascending: true })
          .limit(20);

        if (conversationHistory && conversationHistory.length > 0) {
          for (const msg of conversationHistory) {
            messages.push({
              role: msg.role as "user" | "assistant",
              content: msg.content,
            });
          }
        }
      }

      // Save user message to database
      if (currentConversationId) {
        const { error: saveUserMsgError } = await supabase
          .from("bot_messages")
          .insert({
            conversation_id: currentConversationId,
            role: "user",
            content: message,
          });

        if (saveUserMsgError) {
          console.error("Error saving user message:", saveUserMsgError);
        }
      }
    }

    // Add new user message
    messages.push({ role: "user", content: message });

    // Update system prompt in messages array (it may have been modified by memory injection)
    messages[0] = { role: "system", content: systemPrompt };

    // 7. Call Lovable AI with streaming
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: botConfig.model || "google/gemini-3-flash-preview",
        messages,
        temperature: botConfig.temperature || 0.7,
        stream: true,
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required. Please add credits." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errorText);
      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create a TransformStream to capture the full response while streaming
    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    let fullAssistantResponse = "";

    // Process the stream in the background
    (async () => {
      try {
        const reader = aiResponse.body!.getReader();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          
          // Process complete lines
          let newlineIndex: number;
          while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
            const line = buffer.slice(0, newlineIndex);
            buffer = buffer.slice(newlineIndex + 1);

            if (line.startsWith("data: ")) {
              const jsonStr = line.slice(6).trim();
              if (jsonStr === "[DONE]") {
                await writer.write(encoder.encode("data: [DONE]\n\n"));
                continue;
              }

              try {
                const parsed = JSON.parse(jsonStr);
                const content = parsed.choices?.[0]?.delta?.content;
                if (content) {
                  fullAssistantResponse += content;
                }
                // Pass through the SSE event with proper SSE format
                await writer.write(encoder.encode(line + "\n\n"));
              } catch {
                // Incomplete JSON, pass through anyway
                await writer.write(encoder.encode(line + "\n\n"));
              }
            } else {
              // Pass through non-data lines (comments, empty lines)
              await writer.write(encoder.encode(line + "\n"));
            }
          }
        }

        // 8. Save assistant response to database (only for authenticated users)
        if (fullAssistantResponse && !isAnonymous) {
          const { error: saveAssistantMsgError } = await supabase
            .from("bot_messages")
            .insert({
              conversation_id: currentConversationId,
              role: "assistant",
              content: fullAssistantResponse,
            });

          if (saveAssistantMsgError) {
            console.error("Error saving assistant message:", saveAssistantMsgError);
          }

          // 9. Generate title for new conversations
          if (isNewConversation && message.length > 10) {
            generateConversationTitle(supabase, currentConversationId!, message, lovableApiKey, isEnglish);
          }
        }

        await writer.close();
      } catch (error) {
        console.error("Stream processing error:", error);
        await writer.abort(error);
      }
    })();

    // Return streaming response with conversation ID in header
    return new Response(readable, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
        "X-Conversation-Id": currentConversationId!,
      },
    });
  } catch (error) {
    console.error("Bot chat error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

// Helper function to generate conversation title (non-blocking)
async function generateConversationTitle(
  supabase: any,
  conversationId: string,
  userMessage: string,
  apiKey: string,
  isEnglish: boolean
) {
  try {
    const titleResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          {
            role: "system",
            content: isEnglish
              ? "Based on the following message, give a short English title (3-5 words) for the conversation. Return only the title, no quotes or explanations."
              : "בהתבסס על ההודעה הבאה, תן כותרת קצרה בעברית (3-5 מילים) לשיחה. תן רק את הכותרת, ללא גרשיים או הסברים.",
          },
          { role: "user", content: userMessage },
        ],
        max_tokens: 30,
      }),
    });

    if (titleResponse.ok) {
      const titleData = await titleResponse.json();
      const title = titleData.choices?.[0]?.message?.content?.trim();
      
      if (title && title.length > 0 && title.length < 100) {
        await supabase
          .from("bot_conversations")
          .update({ title })
          .eq("id", conversationId);
      }
    }
  } catch (error) {
    console.error("Error generating title:", error);
    // Non-critical, don't throw
  }
}
