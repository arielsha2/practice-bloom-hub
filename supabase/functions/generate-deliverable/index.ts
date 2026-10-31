// Writes a ready-to-use deliverable for a therapist from what the Mentor tool collected: a focus sentence
// (niche-finder) or outreach messages to referrers (contact-finder). The system decides what is missing and what
// passes the checks; the model only phrases. Stored in therapist_deliverables ("התיק שלי"), one new version per run.
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
export type Tool = "niche-finder" | "contact-finder";
export const TOOLS: Tool[] = ["niche-finder", "contact-finder"];
export const DAILY_LIMIT = 10;

const FILLER = new Set(["משהו כללי", "כללי", "לא נאמר", "לא צוין", "לא ידוע", "אין", "לא רלוונטי"]);
const clean = (v: unknown): string => {
  const s = typeof v === "string" ? v.replace(/\s+/g, " ").trim() : "";
  return !s || FILLER.has(s.replace(/[.!…\-–—:;,\s]+$/g, "")) ? "" : s;
};

// A one- or two-word answer ("חרדה") gives the model nothing to be specific with: it counts as missing and the
// therapist is asked to say a little more.
const MIN_WORDS = 3;
const rich = (s: string) => (s.trim().split(/\s+/).filter(Boolean).length >= MIN_WORDS ? s : "");

export interface Ctx {
  nicheOutput: Record<string, unknown> | null;
  contacts: Array<Record<string, unknown>>;
  profile: Record<string, unknown>;
  said: string;
}
export interface Field { key: string; label: string; hint: string }

export function collectIngredients(
  tool: Tool,
  ctx: Ctx,
  answers: Record<string, unknown>,
): { ingredients: Record<string, unknown>; missing: Field[] } {
  const a = (k: string) => clean(answers[k]);
  const p = (k: string) => clean(ctx.profile?.[k]);
  const missing: Field[] = [];
  if (tool === "niche-finder") {
    const o = ctx.nicheOutput ?? {};
    const ing = {
      ideal_client: rich(clean(o.ideal_client)) || rich(a("ideal_client")),
      core_pain: rich(clean(o.core_pain)) || rich(a("core_pain")),
      transformation: rich(clean(o.transformation)) || rich(a("transformation")),
      approach: a("approach") || p("modalities"),
      location_format: a("location_format") || p("location"),
      population: p("client_population"),
    };
    if (!ing.ideal_client) missing.push({ key: "ideal_client", label: "מי הפונה האידיאלי שלך?", hint: "במשפט או שניים, במילים שלך (לפחות שלוש מילים)" });
    if (!ing.core_pain) missing.push({ key: "core_pain", label: "מה הקושי שמביא אנשים אליך?", hint: "מה הכי מציק להם כשהם פונים" });
    if (!ing.transformation) missing.push({ key: "transformation", label: "מה משתנה אצל מי שעובד איתך?", hint: "איך החיים שלהם נראים אחרי" });
    if (!ing.approach) missing.push({ key: "approach", label: "באיזו גישה או שיטה העבודה שלך?", hint: "למשל CBT, EMDR, דינמי" });
    return { ingredients: ing, missing };
  }
  const contacts = (ctx.contacts ?? [])
    .map((c) => ({ type: clean(c.profession), why: clean(c.reasoning) }))
    .filter((c) => c.type);
  const fromForm = a("contacts_text")
    .split(/[,\n،]/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((t) => ({ type: t, why: "" }));
  const all = contacts.length >= 3 ? contacts : [...contacts, ...fromForm];
  const offer = a("offer_to_referrer") || (p("modalities") && p("client_population") ? `${p("modalities")}; ${p("client_population")}` : "");
  const ing = { contacts: all.slice(0, 3), offer_to_referrer: offer, channel: a("channel"), approach: p("modalities"), location_format: p("location") };
  if (all.length < 3) missing.push({ key: "contacts_text", label: "אילו סוגי אנשי מקצוע יכולים להפנות אליך?", hint: "שלושה, מופרדים בפסיק (למשל: רופאי משפחה, מורים, עמיתים)" });
  if (!offer) missing.push({ key: "offer_to_referrer", label: "מה אפשר להציע למי שמפנה אליך?", hint: "תחום, זמינות ופורמט, למשל: טיפול בחרדה, שעות פנויות בערב, אונליין" });
  return { ingredients: ing, missing };
}

const COMMON = `אתה כותב תוצר מוכן לשימוש עבור מטפל שעבד על הקליניקה הפרטית שלו עם מנטור. קיבלת את הנתונים שהמטפל מסר ואת דבריו בשיחה.
המטרה: תוצר קונקרטי שאפשר להעתיק ולהשתמש בו היום, שנשמע כמו המטפל עצמו ולא כמו פרסומת.

כללים:
1. השתמש במילים ובביטויים של המטפל. אל תמציא עובדות (קהל, שיטה, ותק, מקום, מחיר, מספרים, שעות) שלא מופיעות בנתונים. אל תכתוב "[להשלים" בשום מקום. אל תוסיף מספרים, גם לא במילים (למשל "שישה שבועות"). אל תכתוב שהמטפל מכיר, עוקב אחרי או מעריך את עבודתו של מי שמקבל את ההודעה, ואל תכתוב "מניסיוני" אלא אם נאמר.
2. אל תבטיח תוצאות או ריפוי, ואל תזכיר מטופלים אמיתיים או פרטים מזהים.
3. עברית טבעית, ישירה וחמה. בלי קלישאות (למשל "מרחב בטוח", "מסע", "בגובה העיניים", "קרקע יציבה", "ליווי מקצועי ואישי", "לצעוד יחד").
4. מגדר: אם המטפל מתאר את עצמו בלשון מסוימת בדבריו, השתמש בה. אחרת כתוב בגוף ראשון בלי צורות שמשתנות לפי מגדר (עבר, שמות פעולה, "אני מלווה", "העבודה שלי"), בלי לוכסנים ובלי סוגריים. פנייה לפונה: "שלך", "אצלך", רבים.
5. שדה note: משפט אחד, מה בחרת ולמה.
החזר JSON בלבד, בפורמט שמתואר למטה, בלי הסבר ובלי markdown.`;

const KIND: Record<Tool, string> = {
  "niche-finder": `התוצר: משפט מיקוד. פורמט:
{"focus_sentences": ["גרסה 1", "גרסה 2", "גרסה 3"], "page_headline": "כותרת לדף או לפרופיל, עד 12 מילים", "test_with_colleague": "שאלה אחת לשאול עמית אחרי שהוא קורא את המשפט, בניסוח נטול מגדר, למשל 'מה הבנת מהמשפט, ולמי הוא מתאים?', עד 25 מילים", "note": "..."}
כל משפט עד 25 מילים, מתחיל ב"אני", אומר למי העבודה מיועדת ובמה היא עוזרת. שלוש גרסאות שונות בזווית (לפי הקהל, לפי הקושי, לפי השינוי).`,
  "contact-finder": `התוצר: הודעה פותחת לכל אחד משלושה סוגי מפנים. פורמט:
{"referral_sources": [{"type": "סוג המפנה כפי שניתן", "why": "משפט אחד למה הוא מתאים", "message": "הודעה עד 70 מילים", "followup": "הודעת מעקב, עד 30 מילים"}, ...בדיוק 3...], "note": "..."}
מבנה ההודעה: א. פרגון או קשר אותנטי, ב. הבנת הצורך של המפנה, ג. מה המטפל מציע (רק ממה שנמסר), ד. בקשה מפורשת וקטנה. הודעה מתחילה ממה שאפשר להציע למפנה ולא ממה שהמטפל צריך. בתחילת ההודעה אפשר לכתוב "שלום [שם]," ורק את זה בסוגריים מרובעים.`,
};

export function buildPrompts(tool: Tool, ing: Record<string, unknown>, said: string): { system: string; user: string } {
  const lines: string[] = [];
  if (tool === "niche-finder") {
    const L = (l: string, v: unknown) => { if (typeof v === "string" && v) lines.push(`- ${l}: ${v}`); };
    L("הפונה האידיאלי", ing.ideal_client);
    L("הקושי המרכזי", ing.core_pain);
    L("השינוי", ing.transformation);
    L("גישה או שיטה", ing.approach);
    L("מקום או פורמט", ing.location_format);
    L("אוכלוסייה", ing.population);
  } else {
    for (const c of (ing.contacts as Array<{ type: string; why: string }>) ?? []) lines.push(`- סוג מפנה: ${c.type}${c.why ? ` (למה: ${c.why})` : ""}`);
    if (ing.offer_to_referrer) lines.push(`- מה המטפל מציע: ${ing.offer_to_referrer}`);
    if (ing.channel) lines.push(`- ערוץ מועדף: ${ing.channel}`);
    if (ing.approach) lines.push(`- גישה: ${ing.approach}`);
    if (ing.location_format) lines.push(`- מקום או פורמט: ${ing.location_format}`);
  }
  const user = `נתוני המטפל:\n${lines.join("\n")}\n\nדברי המטפל בשיחה (במילים שלו):\n${said.slice(0, 3500)}`;
  return { system: COMMON + "\n\n" + KIND[tool], user };
}

const BANNED = ["מרחב בטוח", "מקום בטוח", "מסע", "בגובה העיניים", "קרקע יציבה", "ליווי מקצועי ואישי", "לצעוד יחד", "להחזיק מקום"];
const SLASH = /[֐-׿][/(][֐-׿]{1,3}\)?/;
const words = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;
const norm = (s: string) => s.replace(/[^֐-׿a-z0-9]/gi, "");

export function validateDeliverable(tool: Tool, obj: any, allowedText: string): string[] {
  const fails: string[] = [];
  const texts: string[] = [];
  const str = (v: unknown, label: string, maxWords: number): string => {
    if (typeof v !== "string" || !v.trim()) { fails.push(`${label} חסר`); return ""; }
    if (words(v) > maxWords) fails.push(`${label} ארוך מדי (מעל ${maxWords} מילים)`);
    texts.push(v);
    return v;
  };
  if (!obj || typeof obj !== "object") return ["התשובה אינה JSON תקין"];
  str(obj.note, "note", 45);
  if (tool === "niche-finder") {
    const fs = Array.isArray(obj.focus_sentences) ? obj.focus_sentences : [];
    if (fs.length !== 3) fails.push("נדרשות בדיוק שלוש גרסאות של משפט מיקוד");
    fs.forEach((s: unknown, i: number) => str(s, `משפט ${i + 1}`, 28));
    if (new Set(fs.map((s: unknown) => norm(String(s)))).size < fs.length) fails.push("יש משפטים כפולים");
    str(obj.page_headline, "כותרת", 14);
    str(obj.test_with_colleague, "בדיקה עם עמית", 40);
  } else {
    const rs = Array.isArray(obj.referral_sources) ? obj.referral_sources : [];
    if (rs.length !== 3) fails.push("נדרשים בדיוק שלושה סוגי מפנים");
    rs.forEach((r: any, i: number) => {
      str(r?.type, `סוג ${i + 1}`, 14);
      str(r?.why, `סיבה ${i + 1}`, 30);
      str(r?.message, `הודעה ${i + 1}`, 85);
      str(r?.followup, `מעקב ${i + 1}`, 35);
    });
    if (new Set(rs.map((r: any) => norm(String(r?.type ?? "")))).size < rs.length) fails.push("סוגי מפנים כפולים");
  }
  const all = texts.join("\n");
  for (const b of BANNED) if (all.includes(b)) fails.push(`ביטוי שאסור להשתמש בו: ${b}`);
  if (SLASH.test(all)) fails.push("צורת מגדר עם לוכסן או סוגריים");
  if (all.includes("[להשלים")) fails.push("סימון להשלמה בתוצר");
  const brackets = all.match(/\[[^\]]*\]/g) ?? [];
  for (const b of brackets) if (b !== "[שם]") fails.push(`סוגריים מרובעים לא מותרים: ${b}`);
  const allowedDigits = new Set(allowedText.match(/\d+/g) ?? []);
  for (const n of all.match(/\d+/g) ?? []) if (!allowedDigits.has(n)) fails.push(`מספר שלא הופיע בנתונים: ${n}`);
  return fails;
}

export interface Deps {
  getUserId: (req: Request) => Promise<string | null>;
  hasAccess: (userId: string, tool: Tool) => Promise<boolean>;
  countToday: (userId: string) => Promise<number>;
  loadCtx: (userId: string, tool: Tool) => Promise<Ctx>;
  callModel: (system: string, user: string) => Promise<string>;
  save: (userId: string, tool: Tool, content: unknown, inputs: unknown) => Promise<{ id: string; version: number }>;
}

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

export async function handle(req: Request, deps: Deps): Promise<Response> {
  if (req.method !== "POST") return json(405, { error: "method_not_allowed" });
  let body: any = {};
  try { body = await req.json(); } catch { /* empty body is rejected below */ }
  const tool = body?.tool as Tool;
  if (!TOOLS.includes(tool)) return json(400, { error: "bad_tool" });
  const answers = body?.answers && typeof body.answers === "object" ? body.answers : {};

  const userId = await deps.getUserId(req);
  if (!userId) return json(401, { error: "unauthorized" });
  if (!(await deps.hasAccess(userId, tool))) return json(403, { error: "no_access" });
  if ((await deps.countToday(userId)) >= DAILY_LIMIT) return json(429, { error: "daily_limit" });

  const ctx = await deps.loadCtx(userId, tool);
  const { ingredients, missing } = collectIngredients(tool, ctx, answers);
  if (missing.length) return json(200, { status: "needs_info", fields: missing });

  const { system, user } = buildPrompts(tool, ingredients, ctx.said);
  const allowed = `${user}\n${JSON.stringify(answers)}`;
  let lastFails: string[] = [];
  for (let attempt = 0; attempt < 2; attempt++) {
    const extra = attempt === 0 ? "" : `\n\nהניסיון הקודם נפסל מהסיבות האלה, תקן אותן: ${lastFails.join("; ")}`;
    let obj: unknown = null;
    try {
      const raw = await deps.callModel(system, user + extra);
      try { obj = JSON.parse(raw); } catch { const m = raw.match(/\{[\s\S]*\}/); obj = m ? JSON.parse(m[0]) : null; }
    } catch (e) { lastFails = ["שגיאת מודל"]; continue; }
    lastFails = validateDeliverable(tool, obj, allowed);
    if (!lastFails.length) {
      const saved = await deps.save(userId, tool, obj, ingredients);
      return json(200, { status: "ok", deliverable: { id: saved.id, tool, version: saved.version, content: obj, edited_content: null } });
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
      hasAccess: async (userId, tool) => {
        const [{ data: access }, { data: isAdmin }, { data: owned }] = await Promise.all([
          admin.rpc("get_user_access", { _user_id: userId }),
          admin.rpc("has_role", { _user_id: userId, _role: "admin" }),
          admin.from("user_tool_access").select("expires_at").eq("user_id", userId).eq("bot_key", tool),
        ]);
        const row: any = Array.isArray(access) ? access[0] : access;
        const now = Date.now();
        const hasTool = ((owned as any[]) ?? []).some((o) => !o.expires_at || new Date(o.expires_at).getTime() > now);
        return !!row?.has_paid || !!isAdmin || hasTool;
      },
      countToday: async (userId) => {
        const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
        const { count } = await admin.from("therapist_deliverables").select("id", { count: "exact", head: true }).eq("user_id", userId).gte("created_at", since);
        return count ?? 0;
      },
      loadCtx: async (userId, tool) => {
        const [{ data: j }, { data: p }] = await Promise.all([
          admin.from("therapist_journeys").select("niche_output, contact_finder_output").eq("user_id", userId).maybeSingle(),
          admin.from("therapist_profiles").select("profile").eq("user_id", userId).maybeSingle(),
        ]);
        let said = "";
        const { data: conv } = await admin.from("bot_conversations").select("id").eq("user_id", userId).eq("bot_key", tool).order("created_at", { ascending: false }).limit(1);
        const convId = (conv as any[])?.[0]?.id;
        if (convId) {
          const { data: msgs } = await admin.from("bot_messages").select("content").eq("conversation_id", convId).eq("role", "user").order("created_at", { ascending: true });
          said = ((msgs as any[]) ?? []).map((m) => `- ${String(m.content).replace(/\[[A-Za-z_:0-9-]+\]/g, "").trim()}`).filter((l) => l.length > 3).join("\n");
        }
        const co = (j as any)?.contact_finder_output;
        return {
          nicheOutput: ((j as any)?.niche_output as Record<string, unknown>) ?? null,
          contacts: Array.isArray(co) ? co : Array.isArray(co?.contacts) ? co.contacts : [],
          profile: ((p as any)?.profile as Record<string, unknown>) ?? {},
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
      save: async (userId, tool, content, inputs) => {
        const { data: last } = await admin.from("therapist_deliverables").select("version").eq("user_id", userId).eq("tool", tool).order("version", { ascending: false }).limit(1);
        const version = ((last as any[])?.[0]?.version ?? 0) + 1;
        const { data, error } = await admin.from("therapist_deliverables").insert({ user_id: userId, tool, version, content, inputs }).select("id").single();
        if (error) throw error;
        return { id: (data as any).id, version };
      },
    };
    return await handle(req, deps);
  } catch (e) {
    console.error("generate-deliverable", e);
    return json(500, { error: "server_error" });
  }
});
