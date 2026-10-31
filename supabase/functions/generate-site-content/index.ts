// Writes the words of a therapist's personal page from what the Mentor collected and from the focus sentences in
// "התיק שלי". The system decides what is missing and what passes the checks; the model only phrases. Nothing is stored
// here: the wizard shows the words to the therapist, who edits and approves them before the page is built.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ===== ai provider: begin =====
// Identical block in every function that calls an AI model (separate edge functions, no shared module in the
// deploy path) — keep the copies in step.
//
// aiFetch is a drop-in for fetch() on the Lovable AI gateway URL. When the GEMINI_API_KEY secret exists the call
// goes to Google's Gemini API directly (OpenAI-compatible endpoint, same request and response format; only the
// URL, the key and the model name differ), and ANY failure there falls back to the gateway call that was
// originally asked for: a model Google rejected once took the mentor down (incident 2026-08-03), and the
// gateway can run out of credits (402), so neither path may be the only one.
//
// Google retires models for new keys without notice ("no longer available to new users": the whole 2.5 family
// was retired by 2026-10), so the names stored in the database (google/gemini-2.5-flash, ...) are translated
// through GEMINI_MODEL_MAP; a name Google still does not know (400 / 404) is retried once with the always-current
// alias before giving up on Google. Update the map when Google retires another model.
const GEMINI_CHAT_URL = "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";
const GEMINI_FALLBACK_MODEL = "gemini-flash-latest";
const GEMINI_MODEL_MAP: Record<string, string> = {
  "google/gemini-2.5-flash": "gemini-3.8-flash",
  "google/gemini-2.5-flash-lite": "gemini-3.1-flash-lite",
  "google/gemini-2.5-pro": "gemini-3.1-pro-preview",
  "google/gemini-3-flash-preview": "gemini-3-flash-preview",
};

// The retired 2.5-flash answered fast; its 3.x replacement thinks first (about 7 s to the first word on
// gemini-3.8-flash, about 2.8 s with reasoning_effort "low"), so requests that asked for it are sent with "low"
// unless they set their own effort. Models that were already 3.x (the diagnosis) are left exactly as they were.
const GEMINI_LOW_EFFORT_FOR = new Set(["google/gemini-2.5-flash"]);

async function aiFetch(url: string, init: RequestInit): Promise<Response> {
  const geminiKey = Deno.env.get("GEMINI_API_KEY");
  if (geminiKey && typeof init.body === "string") {
    try {
      const body = JSON.parse(init.body) as Record<string, unknown>;
      const asked = String(body.model ?? "");
      const effort = GEMINI_LOW_EFFORT_FOR.has(asked) && body.reasoning_effort === undefined ? { reasoning_effort: "low" } : {};
      const call = (model: string) =>
        fetch(GEMINI_CHAT_URL, {
          ...init,
          headers: { ...(init.headers as Record<string, string>), Authorization: `Bearer ${geminiKey}` },
          body: JSON.stringify({ ...body, ...effort, model }),
        });
      const model = GEMINI_MODEL_MAP[asked] ?? (asked.replace(/^google\//, "") || GEMINI_FALLBACK_MODEL);
      let res = await call(model);
      if (!res.ok && (res.status === 400 || res.status === 404) && model !== GEMINI_FALLBACK_MODEL) {
        res = await call(GEMINI_FALLBACK_MODEL);
      }
      if (res.ok) return res;
      console.error("gemini direct failed, falling back to the gateway:", res.status, (await res.text().catch(() => "")).slice(0, 200));
    } catch (e) {
      console.error("gemini direct threw, falling back to the gateway:", e instanceof Error ? e.message : String(e));
    }
  }
  return fetch(url, init);
}
// ===== ai provider: end =====



// ===== core: begin =====
const FILLER = new Set(["משהו כללי", "כללי", "לא נאמר", "לא צוין", "לא ידוע", "אין", "לא רלוונטי"]);
const clean = (v: unknown): string => {
  const s = typeof v === "string" ? v.replace(/\s+/g, " ").trim() : "";
  return !s || FILLER.has(s.replace(/[.!…\-–—:;,\s]+$/g, "")) ? "" : s;
};
const MIN_WORDS = 3;
const rich = (s: string) => (s.trim().split(/\s+/).filter(Boolean).length >= MIN_WORDS ? s : "");

export interface Ctx {
  nicheOutput: Record<string, unknown> | null;
  selfPresentation: Record<string, unknown> | null;
  profile: Record<string, unknown>;
  focusSentences: string[];
  said: string;
}
export interface Field { key: string; label: string; hint: string }

export function collectIngredients(ctx: Ctx, answers: Record<string, unknown>): { ingredients: Record<string, unknown>; missing: Field[] } {
  const a = (k: string) => clean(answers[k]);
  const p = (k: string) => clean(ctx.profile?.[k]);
  const o = ctx.nicheOutput ?? {};
  const sp = ctx.selfPresentation ?? {};
  const ing = {
    ideal_client: rich(clean(o.ideal_client)) || rich(a("ideal_client")),
    core_pain: rich(clean(o.core_pain)) || rich(a("core_pain")),
    transformation: rich(clean(o.transformation)) || rich(a("transformation")),
    approach: a("approach") || p("modalities"),
    location_format: a("location_format") || p("location"),
    population: p("client_population"),
    story: clean(sp.story_version),
    first_session_note: a("first_session_note"),
    focus_sentences: ctx.focusSentences,
  };
  const missing: Field[] = [];
  if (!ing.ideal_client) missing.push({ key: "ideal_client", label: "מי הפונה האידיאלי שלך?", hint: "במשפט או שניים, במילים שלך (לפחות שלוש מילים)" });
  if (!ing.core_pain) missing.push({ key: "core_pain", label: "מה הקושי שמביא אנשים אליך?", hint: "מה הכי מציק להם כשהם פונים" });
  if (!ing.transformation) missing.push({ key: "transformation", label: "מה משתנה אצל מי שעובד איתך?", hint: "איך החיים שלהם נראים אחרי" });
  if (!ing.approach) missing.push({ key: "approach", label: "באיזו גישה או שיטה העבודה שלך?", hint: "למשל CBT, EMDR, דינמי" });
  return { ingredients: ing, missing };
}

const SYSTEM = `אתה כותב את הטקסטים של דף אישי למטפל, מהנתונים שהוא מסר. הדף נקרא על ידי אנשים שמחפשים מטפל, ועל ידי מנועי חיפוש.
המטרה: טקסט חם, מדויק וספציפי, שנשמע כמו המטפל עצמו ולא כמו פרסומת.

כללים:
1. השתמש במילים של המטפל. אל תמציא עובדות (קהל, שיטה, ותק, מקום, מחיר, משך פגישה, שעות, מספרים, הסמכות) שלא מופיעות בנתונים. אל תכתוב "[להשלים".
2. אל תבטיח תוצאות או ריפוי, אל תכתוב "חינם", "ללא עלות" או "בלי התחייבות" ואל תזכיר מטופלים אמיתיים.
3. עברית טבעית וחמה, בלי קלישאות ("מרחב בטוח", "מסע", "בגובה העיניים", "קרקע יציבה", "ליווי מקצועי ואישי", "לצעוד יחד").
4. מגדר: אם המטפל מתאר את עצמו בלשון מסוימת בדבריו, השתמש בה. אחרת כתוב בגוף ראשון בלי צורות שמשתנות לפי מגדר, בלי לוכסנים ובלי סוגריים. לפונים פנה ברבים ("אתם", "שלכם") או בצורות נטולות מגדר.
5. שאלות ותשובות: שאלות שאנשים באמת שואלים לפני שפונים, בנושא הקושי שהמטפל מטפל בו. התשובות כלליות ומקצועיות, ולא טענות על הקליניקה (בלי מחיר, בלי משך, בלי זמינות) אלא אם נמסרו.
6. "איך מתחילים": שלושה צעדים כלליים (יוצרים קשר, פגישה ראשונה שבה מספרים מה מביא אתכם, בונים יחד כיוון). בלי משך, מחיר או עלות, אלא אם נמסרו בהערה על הפגישה הראשונה.
החזר JSON בלבד, בלי הסבר ובלי markdown, בפורמט הזה:
{"hero_line": "עד 30 מילים: משפט שמשלים את הכותרת ואינו חוזר עליה, ומתאר בקצרה את מי מלווים, איפה ובאיזו גישה",
 "about": "שתי פסקאות קצרות בגוף ראשון, עד 110 מילים בסך הכול, מופרדות בשורה ריקה",
 "for_you_if": ["3 משפטים, עד 22 מילים כל אחד, שמתארים מה הפונה מרגיש או רוצה"],
 "first_session": ["3 צעדים קצרים, עד 22 מילים כל אחד"],
 "faq": [{"q": "שאלה", "a": "תשובה, עד 45 מילים"}, ...4 פריטים...],
 "contact_line": "משפט קצר אחד לפני כפתורי הפנייה, עד 14 מילים"}`;

export function buildPrompts(ing: Record<string, unknown>, said: string): { system: string; user: string } {
  const lines: string[] = [];
  const L = (l: string, v: unknown) => { if (typeof v === "string" && v) lines.push(`- ${l}: ${v}`); };
  L("הפונה האידיאלי", ing.ideal_client);
  L("הקושי המרכזי", ing.core_pain);
  L("השינוי", ing.transformation);
  L("גישה או שיטה", ing.approach);
  L("מקום או פורמט", ing.location_format);
  L("אוכלוסייה", ing.population);
  L("הסיפור האישי של המטפל", ing.story);
  L("הערה על הפגישה הראשונה", ing.first_session_note);
  const fs = (ing.focus_sentences as string[]) ?? [];
  if (fs.length) lines.push(`- משפט המיקוד שנבחר לדף: ${fs[0]}`);
  return { system: SYSTEM, user: `נתוני המטפל:\n${lines.join("\n")}\n\nדברי המטפל בשיחות (במילים שלו):\n${said.slice(0, 3500)}` };
}

const BANNED = ["מרחב בטוח", "מקום בטוח", "מסע", "בגובה העיניים", "קרקע יציבה", "ליווי מקצועי ואישי", "לצעוד יחד", "להחזיק מקום"];
const CLAIMS = ["חינם", "ללא עלות", "בלי עלות", "ללא התחייבות", "בלי התחייבות", "מובטח", "מבטיח", "מבטיחה", "ריפוי", "מרפא"];
const SLASH = /[֐-׿][/(][֐-׿]{1,3}\)?/;
const words = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;

export interface SiteContent {
  hero_line: string;
  about: string;
  for_you_if: string[];
  first_session: string[];
  faq: Array<{ q: string; a: string }>;
  contact_line: string;
}

const norm = (s: string) => s.replace(/[^֐-׿a-z0-9]/gi, "");

export function validateContent(obj: any, allowedText: string, headline: string[] = []): string[] {
  const fails: string[] = [];
  const texts: string[] = [];
  const str = (v: unknown, label: string, maxWords: number): void => {
    if (typeof v !== "string" || !v.trim()) { fails.push(`${label} חסר`); return; }
    if (words(v) > maxWords) fails.push(`${label} ארוך מדי (מעל ${maxWords} מילים)`);
    texts.push(v);
  };
  if (!obj || typeof obj !== "object") return ["התשובה אינה JSON תקין"];
  str(obj.hero_line, "שורת פתיחה", 34);
  // the line under the headline adds to it; it must not repeat it
  const heroN = norm(String(obj.hero_line ?? ""));
  for (const h of headline) if (h && norm(h).length >= 12 && heroN.includes(norm(h).slice(0, 22))) fails.push("שורת הפתיחה חוזרת על הכותרת");
  str(obj.about, "קצת עליי", 125);
  str(obj.contact_line, "שורת פנייה", 16);
  const fy = Array.isArray(obj.for_you_if) ? obj.for_you_if : [];
  if (fy.length !== 3) fails.push("נדרשים בדיוק שלושה משפטים ב'למי זה מתאים'");
  fy.forEach((s: unknown, i: number) => str(s, `למי זה מתאים ${i + 1}`, 26));
  const fsn = Array.isArray(obj.first_session) ? obj.first_session : [];
  if (fsn.length !== 3) fails.push("נדרשים בדיוק שלושה צעדים ב'איך מתחילים'");
  fsn.forEach((s: unknown, i: number) => str(s, `צעד ${i + 1}`, 26));
  const faq = Array.isArray(obj.faq) ? obj.faq : [];
  if (faq.length < 4 || faq.length > 5) fails.push("נדרשות 4 או 5 שאלות ותשובות");
  faq.forEach((f: any, i: number) => { str(f?.q, `שאלה ${i + 1}`, 18); str(f?.a, `תשובה ${i + 1}`, 55); });
  const all = texts.join("\n");
  for (const b of BANNED) if (all.includes(b)) fails.push(`ביטוי שאסור להשתמש בו: ${b}`);
  for (const c of CLAIMS) if (all.includes(c) && !allowedText.includes(c)) fails.push(`טענה שלא נמסרה: ${c}`);
  if (SLASH.test(all)) fails.push("צורת מגדר עם לוכסן או סוגריים");
  if (all.includes("[")) fails.push("סוגריים מרובעים בתוצר");
  const allowedDigits = new Set(allowedText.match(/\d+/g) ?? []);
  for (const n of all.match(/\d+/g) ?? []) if (!allowedDigits.has(n)) fails.push(`מספר שלא הופיע בנתונים: ${n}`);
  return fails;
}

export interface Deps {
  getUserId: (req: Request) => Promise<string | null>;
  hasAccess: (userId: string) => Promise<boolean>;
  loadCtx: (userId: string) => Promise<Ctx>;
  callModel: (system: string, user: string) => Promise<string>;
}

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

export async function handle(req: Request, deps: Deps): Promise<Response> {
  if (req.method !== "POST") return json(405, { error: "method_not_allowed" });
  let body: any = {};
  try { body = await req.json(); } catch { /* empty body */ }
  const answers = body?.answers && typeof body.answers === "object" ? body.answers : {};

  const userId = await deps.getUserId(req);
  if (!userId) return json(401, { error: "unauthorized" });
  if (!(await deps.hasAccess(userId))) return json(403, { error: "no_access" });

  const ctx = await deps.loadCtx(userId);
  const { ingredients, missing } = collectIngredients(ctx, answers);
  if (missing.length) return json(200, { status: "needs_info", fields: missing });

  const { system, user } = buildPrompts(ingredients, ctx.said);
  const allowed = `${user}\n${JSON.stringify(answers)}`;
  let lastFails: string[] = [];
  for (let attempt = 0; attempt < 2; attempt++) {
    const extra = attempt === 0 ? "" : `\n\nהניסיון הקודם נפסל מהסיבות האלה, תקן אותן: ${lastFails.join("; ")}`;
    let obj: unknown = null;
    try {
      const raw = await deps.callModel(system, user + extra);
      try { obj = JSON.parse(raw); } catch { const m = raw.match(/\{[\s\S]*\}/); obj = m ? JSON.parse(m[0]) : null; }
    } catch { lastFails = ["שגיאת מודל"]; continue; }
    lastFails = validateContent(obj, allowed, ingredients.focus_sentences as string[]);
    if (!lastFails.length) {
      return json(200, { status: "ok", content: obj, key_phrase_options: (ingredients.focus_sentences as string[]).slice(0, 3) });
    }
  }
  return json(200, { status: "failed", reason: "quality_check", failures: lastFails });
}
// ===== core: end =====

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const lovableKey = Deno.env.get("LOVABLE_API_KEY") ?? "";
    const deps: Deps = {
      getUserId: async (r) => {
        const auth = r.headers.get("Authorization") ?? "";
        if (!auth.startsWith("Bearer ")) return null;
        const c = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: auth } } });
        const { data } = await c.auth.getUser();
        return data?.user?.id ?? null;
      },
      // Building and publishing a page is part of the Mentor: full Mentor, admin, or the niche tool the page is built from.
      hasAccess: async (userId) => {
        const [{ data: access }, { data: isAdmin }, { data: owned }] = await Promise.all([
          admin.rpc("get_user_access", { _user_id: userId }),
          admin.rpc("has_role", { _user_id: userId, _role: "admin" }),
          admin.from("user_tool_access").select("expires_at").eq("user_id", userId).eq("bot_key", "niche-finder"),
        ]);
        const row: any = Array.isArray(access) ? access[0] : access;
        const now = Date.now();
        const hasTool = ((owned as any[]) ?? []).some((o) => !o.expires_at || new Date(o.expires_at).getTime() > now);
        return !!row?.has_paid || !!isAdmin || hasTool;
      },
      loadCtx: async (userId) => {
        const [{ data: j }, { data: p }, { data: d }] = await Promise.all([
          admin.from("therapist_journeys").select("niche_output, self_presentation_output").eq("user_id", userId).maybeSingle(),
          admin.from("therapist_profiles").select("profile").eq("user_id", userId).maybeSingle(),
          admin.from("therapist_deliverables").select("content, edited_content").eq("user_id", userId).eq("tool", "niche-finder").order("version", { ascending: false }).limit(1),
        ]);
        const dRow: any = (d as any[])?.[0];
        const fsRaw = (dRow?.edited_content ?? dRow?.content)?.focus_sentences;
        const focusSentences = Array.isArray(fsRaw) ? fsRaw.map((s: unknown) => clean(s)).filter(Boolean) : [];
        let said = "";
        const { data: conv } = await admin.from("bot_conversations").select("id").eq("user_id", userId).eq("bot_key", "niche-finder").order("created_at", { ascending: false }).limit(1);
        const convId = (conv as any[])?.[0]?.id;
        if (convId) {
          const { data: msgs } = await admin.from("bot_messages").select("content").eq("conversation_id", convId).eq("role", "user").order("created_at", { ascending: true });
          said = ((msgs as any[]) ?? []).map((m) => `- ${String(m.content).replace(/\[[A-Za-z_:0-9-]+\]/g, "").trim()}`).filter((l) => l.length > 3).join("\n");
        }
        return {
          nicheOutput: ((j as any)?.niche_output as Record<string, unknown>) ?? null,
          selfPresentation: ((j as any)?.self_presentation_output as Record<string, unknown>) ?? null,
          profile: ((p as any)?.profile as Record<string, unknown>) ?? {},
          focusSentences,
          said,
        };
      },
      callModel: async (system, user) => {
        const r = await aiFetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: { Authorization: `Bearer ${lovableKey}`, "Content-Type": "application/json" },
          signal: AbortSignal.timeout(60000),
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            temperature: 0.6,
            response_format: { type: "json_object" },
            messages: [{ role: "system", content: system }, { role: "user", content: user }],
          }),
        });
        if (!r.ok) throw new Error("model " + r.status);
        const d = await r.json();
        return String(d?.choices?.[0]?.message?.content ?? "");
      },
    };
    return await handle(req, deps);
  } catch (e) {
    console.error("generate-site-content", e);
    return json(500, { error: "server_error" });
  }
});
