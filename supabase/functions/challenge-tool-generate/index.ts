// The free challenge tools. Tool "professional-card": from three answers about ONE person the therapist loves
// working with (who he is, what troubles him, what he hopes will change) it writes three versions of the sentence
// "אני עוזר ל__ ל__" and a line that defines the niche. The system owns everything that is structure (the
// first-person opening by the therapist's gender, the word limits, the banned words, the checks); the model only
// phrases. Stored in therapist_deliverables (tool = 'professional-card'), one new version per run.
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
export type Tool = "professional-card";
export const TOOLS: Tool[] = ["professional-card"];
export const DAILY_LIMIT = 8;

export type Gender = "f" | "m" | "n";
export type Person = "f" | "m";

// The therapist's own first-person opening, chosen by code from the therapist's gender (never by the model).
export const LEADS: Record<Gender, string> = { f: "אני עוזרת", m: "אני עוזר", n: "אני כאן כדי לעזור" };

export const TAGS = ["לפי הקהל", "לפי הקושי", "לפי השינוי"] as const;

// Words that keep a person at a distance: professional terms and vague abstractions the client would not use
// about himself. They are also flagged for the therapist in the card they review (client side, same list).
export const JARGON = ["ויסות", "דפוסים", "מרחב בטוח", "מרחב", "העצמה", "כלים", "חיבור", "תהליך", "ליווי"];
export const BANNED = ["מרחב בטוח", "מקום בטוח", "מסע", "בגובה העיניים", "קרקע יציבה", "ליווי מקצועי ואישי", "לצעוד יחד", "להחזיק מקום", ...JARGON];

const SLASH = /[֐-׿][/(][֐-׿]{1,3}\)?/;
const words = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;
const norm = (s: string) => s.replace(/[^֐-׿a-z0-9]/gi, "");
const hebrewStem = (w: string) => w.replace(/[^֐-׿]/g, "").replace(/^[ומהבלכש]{1,2}(?=.{3,})/, "");
const STOP = new Set(["אחרי", "שהם", "שהוא", "שהיא", "אני", "עוזר", "עוזרת", "מלווה", "מרגישים", "מרגיש", "מרגישות", "כמו", "גם", "כל", "עם", "בלי", "אבל", "זה", "זו", "את", "של", "על"]);
const stems = (s: string) => new Set(s.split(/\s+/).map(hebrewStem).filter((w) => w.length >= 3 && !STOP.has(w)));

export interface Input {
  answers: string[]; // [who he is, what troubles him, what he hopes for]
  gender: Gender; // the therapist's
  person: Person; // the person described
  source: string | null;
}
export interface Missing { index: number; hint: string }

const MIN_WORDS = 4;

export function parseInput(body: any): { input: Input } | { error: string } | { missing: Missing[] } {
  const raw = Array.isArray(body?.answers) ? body.answers : null;
  if (!raw || raw.length !== 3) return { error: "bad_answers" };
  const answers = raw.map((a: unknown) => (typeof a === "string" ? a.replace(/\s+/g, " ").trim().slice(0, 700) : ""));
  const gender: Gender = body?.gender === "f" || body?.gender === "m" ? body.gender : "n";
  const person: Person = body?.person === "m" ? "m" : "f";
  const missing: Missing[] = [];
  const hints = [
    "תארו את האדם: גיל או שלב בחיים, מצב משפחתי ועבודה, ומה הוא עושה בימים רגילים.",
    "תארו מה קורה לו בפועל, ומה היה הרגע שבו הבין שהגיע הזמן.",
    "תארו איך ייראה ערב או בוקר רגיל אחרי השינוי.",
  ];
  answers.forEach((a: string, index: number) => {
    if (words(a) < MIN_WORDS) missing.push({ index, hint: hints[index] });
  });
  if (missing.length) return { missing };
  const source = typeof body?.source === "string" ? body.source.replace(/[^a-z0-9_.:-]/gi, "").slice(0, 60) || null : null;
  return { input: { answers, gender, person, source } };
}

export const SYSTEM = `אתה מנסח כרטיס ביקור מקצועי למטפל. המטפל חשב על אדם אחד, אמיתי או מדומיין, שהכי טוב לו לעבוד איתו, ומסר שלוש תשובות: מי האדם, מה מעסיק ומטריד אותו, ומה הוא מקווה שישתנה בחייו.

המשימה: שלוש גרסאות של משפט אחד במבנה "אני עוזר ל___ ל___", ושורה אחת שמגדירה את הנישה. את הפתיחה "אני עוזר" אתה לא כותב, הקוד מוסיף אותה לפי המטפל. אתה כותב רק את who ואת change.

פורמט: JSON בלבד, בלי הסבר ובלי markdown:
{"niche_line": "...", "variants": [{"tag": "לפי הקהל", "who": "...", "change": "..."}, {"tag": "לפי הקושי", "who": "...", "change": "..."}, {"tag": "לפי השינוי", "who": "...", "change": "..."}]}

כללים:
1. who ממשיך את "אני עוזר" ומתחיל באות ל' ("לזוגות ...", "לאמהות ..."). הוא אומר מי האנשים ומה מטריד אותם, בתיאור אחד ברור ולא ברשימה. עד 9 מילים ומסתיים בפסיק.
2. change הוא פועל במקור שמתחיל באות ל' ("לחזור ...", "להרגיש ..."), פעולה אחת ולא רשימה. הוא אומר מה משתנה בחיים שלהם. עד 9 מילים ומסתיים בנקודה.
3. המשפט המלא "אני עוזר" + who + change חייב להיות עברית תקינה וטבעית ועד 20 מילים, משפט שאפשר להגיד בנשימה אחת למי ששואל במה אתה עוסק. קצר עדיף על שלם.
   דוגמאות לאורך ולסגנון בלבד, אל תעתיק מהן: "אני עוזר לבני נוער שמתקשים להגיע לבית הספר, לחזור ללמוד בלי כאבי בטן." / "אני עוזר לגברים שנשחקו מהעבודה, לחזור הביתה עם כוח לבני המשפחה."
4. תאר קבוצה של אנשים כמו האדם שתואר, בלשון רבים, ולא את האדם עצמו. בלי שם, בלי גיל מדויק, בלי מקום עבודה ובלי פרט שמזהה אדם.
5. שלוש הגרסאות שונות בזווית: "לפי הקהל" מדגישה מי האנשים, "לפי הקושי" מדגישה מה מטריד אותם, "לפי השינוי" מדגישה מה משתנה.
6. השתמש במילים ובתמונות של המטפל. אל תמציא עובדות שלא נאמרו. כתוב במילים של יום יום, כמו שהאדם עצמו היה אומר, בלי מונחים מקצועיים ובלי מילים מופשטות ועמומות. אסור להשתמש במילים: ${BANNED.join(", ")}.
7. בלי לוכסנים ובלי סוגריים, בלי הבטחת ריפוי או תוצאה.
8. niche_line: שורה אחת, עד 20 מילים, שמגדירה את הקבוצה שהאדם מייצג: מי הם, ומה משותף להם. בלי "אני עוזר".`;

export function buildUser(input: Input): string {
  return `האדם שתואר הוא ${input.person === "m" ? "גבר" : "אישה"}.

תשובה 1, מי האדם:
${input.answers[0]}

תשובה 2, מה מעסיק ומטריד אותו:
${input.answers[1]}

תשובה 3, מה הוא מקווה שישתנה:
${input.answers[2]}`;
}

export function validateCard(obj: any, answersText: string): string[] {
  const fails: string[] = [];
  if (!obj || typeof obj !== "object") return ["התשובה אינה JSON תקין"];
  const texts: string[] = [];
  const str = (v: unknown, label: string, maxWords: number): string => {
    if (typeof v !== "string" || !v.trim()) { fails.push(`${label} חסר`); return ""; }
    if (words(v) > maxWords) fails.push(`${label} ארוך מדי (מעל ${maxWords} מילים)`);
    texts.push(v);
    return v.trim();
  };
  str(obj.niche_line, "שורת הנישה", 24);
  const vs = Array.isArray(obj.variants) ? obj.variants : [];
  if (vs.length !== 3) fails.push("נדרשות בדיוק שלוש גרסאות");
  const full: string[] = [];
  vs.forEach((v: any, i: number) => {
    const who = str(v?.who, `גרסה ${i + 1}: who`, 11);
    const change = str(v?.change, `גרסה ${i + 1}: change`, 11);
    if (who && change && words(who) + words(change) > 18) fails.push(`גרסה ${i + 1}: המשפט ארוך מדי לכרטיס (מעל 18 מילים בשני החלקים)`);
    if (who && !who.startsWith("ל")) fails.push(`גרסה ${i + 1}: who חייב להתחיל באות ל'`);
    if (change && !change.startsWith("ל")) fails.push(`גרסה ${i + 1}: change חייב להיות פועל במקור שמתחיל באות ל'`);
    if (who && !/,$/.test(who)) fails.push(`גרסה ${i + 1}: who חייב להסתיים בפסיק`);
    if (change && !/[.]$/.test(change)) fails.push(`גרסה ${i + 1}: change חייב להסתיים בנקודה`);
    if (v?.tag !== TAGS[i]) fails.push(`גרסה ${i + 1}: התווית חייבת להיות "${TAGS[i]}"`);
    full.push(`${who} ${change}`);
  });
  if (new Set(full.map(norm)).size < full.length) fails.push("יש גרסאות כפולות");
  const all = texts.join("\n");
  for (const b of BANNED) if (all.includes(b)) fails.push(`ביטוי שאסור להשתמש בו: ${b}`);
  if (SLASH.test(all)) fails.push("צורת מגדר עם לוכסן או סוגריים");
  if (/[\[\]()]/.test(all)) fails.push("סוגריים אסורים");
  if (/@|https?:|www\./i.test(all) || /\d{7,}/.test(all)) fails.push("פרט קשר או כתובת בתוך הניסוח");
  const allowedDigits = new Set(answersText.match(/\d+/g) ?? []);
  for (const n of all.match(/\d+/g) ?? []) if (!allowedDigits.has(n)) fails.push(`מספר שלא הופיע בנתונים: ${n}`);
  // The wording has to come from what the therapist said: every version shares at least one content word with the answers.
  const said = stems(answersText);
  full.forEach((f, i) => {
    const mine = [...stems(f)];
    if (mine.length && !mine.some((s) => said.has(s))) fails.push(`גרסה ${i + 1} לא נשענת על מה שנאמר`);
  });
  return fails;
}

export interface CardContent {
  gender: Gender;
  person: Person;
  niche_line: string;
  person_summary: string;
  variants: { tag: string; lead: string; who: string; change: string }[];
}

export function composeContent(obj: any, input: Input): CardContent {
  return {
    gender: input.gender,
    person: input.person,
    niche_line: String(obj.niche_line).trim(),
    person_summary: input.answers[0],
    variants: obj.variants.map((v: any, i: number) => ({
      tag: TAGS[i],
      lead: LEADS[input.gender],
      who: String(v.who).trim(),
      change: String(v.change).trim(),
    })),
  };
}

export interface Deps {
  getUserId: (req: Request) => Promise<string | null>;
  countToday: (userId: string) => Promise<number>;
  callModel: (system: string, user: string) => Promise<string>;
  save: (userId: string, tool: Tool, content: unknown, inputs: unknown) => Promise<{ id: string; version: number }>;
}

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

export async function handle(req: Request, deps: Deps): Promise<Response> {
  if (req.method !== "POST") return json(405, { error: "method_not_allowed" });
  let body: any = {};
  try { body = await req.json(); } catch { /* an empty body is rejected below */ }
  const tool = body?.tool as Tool;
  if (!TOOLS.includes(tool)) return json(400, { error: "bad_tool" });

  const userId = await deps.getUserId(req);
  if (!userId) return json(401, { error: "unauthorized" });

  const parsed = parseInput(body);
  if ("error" in parsed) return json(400, { error: parsed.error });
  if ("missing" in parsed) return json(200, { status: "needs_info", missing: parsed.missing });
  const input = parsed.input;

  if ((await deps.countToday(userId)) >= DAILY_LIMIT) return json(429, { error: "daily_limit" });

  const user = buildUser(input);
  const answersText = input.answers.join("\n");
  let lastFails: string[] = [];
  for (let attempt = 0; attempt < 2; attempt++) {
    const extra = attempt === 0 ? "" : `\n\nהניסיון הקודם נפסל מהסיבות האלה, תקן אותן: ${lastFails.join("; ")}`;
    let obj: unknown = null;
    try {
      const raw = await deps.callModel(SYSTEM, user + extra);
      try { obj = JSON.parse(raw); } catch { const m = raw.match(/\{[\s\S]*\}/); obj = m ? JSON.parse(m[0]) : null; }
    } catch { lastFails = ["שגיאת מודל"]; continue; }
    lastFails = validateCard(obj, answersText);
    if (!lastFails.length) {
      const content = composeContent(obj, input);
      const saved = await deps.save(userId, tool, content, { answers: input.answers, gender: input.gender, person: input.person, source: input.source });
      return json(200, { status: "ok", deliverable: { id: saved.id, tool, version: saved.version, content, edited_content: null } });
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
      countToday: async (userId) => {
        const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
        const { count } = await admin.from("therapist_deliverables").select("id", { count: "exact", head: true }).eq("user_id", userId).eq("tool", "professional-card").gte("created_at", since);
        return count ?? 0;
      },
      callModel: async (system, user) => {
        const r = await aiFetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: { Authorization: `Bearer ${lovableKey}`, "Content-Type": "application/json" },
          signal: AbortSignal.timeout(60000),
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            temperature: 0.7,
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
    console.error("challenge-tool-generate", e);
    return json(500, { error: "server_error" });
  }
});
