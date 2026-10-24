// Generates landing page draft content for the therapist using their journey data.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `אתה כותב דף נחיתה אישי למטפל, מהנתונים שחולצו מהמסע שלו. הדף הוא של המטפל עצמו, לא של פלטפורמה.
אל תמציא עובדות: השתמש רק במה שמופיע בנתונים. אם חסר מידע, כתוב משפט כללי וחם בלי לפרט דברים שלא נאמרו.
הטון: חם, אישי, מדויק. לא גנרי, לא מנופח, לא שיווקי-צעקני, בלי הבטחות לתוצאה, בלי הבטחות ריפוי.
הכתיבה בגוף ראשון מנקודת המבט של המטפל, בעברית טבעית וזורמת שמטפל באמת היה אומר.

כללי ניסוח (חשובים):
1. אין לדעת את המגדר של המטפל או של הפונה, ולכן אסור להשתמש בצורות חתך עם לוכסן או סוגריים (כמו "מרגיש/ה", "אתה/את", "(ה)"). במקומם:
   - בגוף ראשון: זמן עבר ("עבדתי", "למדתי"), צורות רבים, או שמות פעולה ("ליווי של...", "עבודה עם..."). הימנע מפעלי הווה שמשתנים לפי מגדר.
   - בפנייה למטופל: ניסוח נטול מגדר: "שלך", "עליך", "בך", שמות עצם ("תחושה ש...", "קושי ל..."), או פנייה כללית ("יש רגעים ש..."). לא "אתה/את" ולא "מרגיש/ה".
2. כל שדה אומר דבר אחר. אסור לחזור על אותו משפט, אותה הצהרה או אותה מילת מפתח בין השדות.
3. בלי קלישאות ("מרחב בטוח", "מסע של צמיחה", "הדלת פתוחה", "לצעוד איתך צעד אחר צעד").
4. עברית תקנית, בלי מילים באנגלית ובלי שמות השדות.

החזר JSON בלבד, ללא הסבר, ללא markdown, בפורמט הזה בדיוק:
{
  "keyPhrase": "הכותרת: משפט אחד קצר שאומר למי המטפל עוזר ובמה, מבוסס על handshake_version, עד 100 תווים",
  "heroLine": "משפט תומך קצר מתחת לכותרת: מה משתנה אצל מי שעובד איתו, מבוסס על transformation ו-result, עד 120 תווים. לא חוזר על הכותרת",
  "about": "פסקה אישית בגוף ראשון, 2-3 משפטים, על מי המטפל ולמה הוא עושה את מה שהוא עושה, מבוססת על story_version, עד 250 תווים. לא חוזרת על הכותרת ולא על המשפט התומך",
  "forYouIf": [
    "משפט קצר המבוסס על internal_pain: מה מרגישים מבפנים",
    "משפט קצר המבוסס על external_pain: מה קורה בחיים בפועל",
    "משפט קצר המבוסס על desire: מה מחפשים ומקווים לו"
  ]
}`;

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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: journey } = await supabase
      .from("therapist_journeys")
      .select("niche_output, self_presentation_output")
      .eq("user_id", user.id)
      .maybeSingle();

    const niche = (journey?.niche_output ?? {}) as Record<string, string>;
    const selfp = (journey?.self_presentation_output ?? {}) as Record<string, string>;

    const userInput = `נתונים שזמינים:
ideal_client: ${niche.ideal_client ?? "—"}
core_pain: ${niche.core_pain ?? "—"}
transformation: ${niche.transformation ?? "—"}
handshake_version: ${niche.handshake_version ?? "—"}
internal_pain: ${selfp.internal_pain ?? "—"}
external_pain: ${selfp.external_pain ?? "—"}
desire: ${selfp.desire ?? "—"}
result: ${selfp.result ?? "—"}
story_version: ${selfp.story_version ?? "—"}`;

    const lovableKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableKey) {
      return new Response(JSON.stringify({ error: "missing key" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiRes = await aiFetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${lovableKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userInput },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!aiRes.ok) {
      const t = await aiRes.text();
      console.error("ai error", aiRes.status, t);
      return new Response(JSON.stringify({ error: "ai error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await aiRes.json();
    const raw = data?.choices?.[0]?.message?.content ?? "{}";
    let parsed: { keyPhrase?: string; heroLine?: string; about?: string; forYouIf?: string[] } = {};
    try { parsed = JSON.parse(raw); } catch {
      const m = raw.match(/\{[\s\S]*\}/);
      if (m) { try { parsed = JSON.parse(m[0]); } catch { /* fall through to the defaults */ } }
    }

    // The model sometimes slips in gender slashes ("מרגיש/ה") or repeats the headline in the other fields; a field
    // that fails either check is dropped so the neutral default (or an empty field the therapist fills) is used.
    const hasSlashForm = (t: string) => /[\u0590-\u05FF][\/(][\u0590-\u05FF]{1,3}\)?/.test(t);
    const clean = (v: unknown, max: number): string => {
      if (typeof v !== "string") return "";
      const t = v.replace(/\s+/g, " ").trim();
      return t && t.length <= max && !hasSlashForm(t) ? t : "";
    };
    const keyPhrase = clean(parsed.keyPhrase, 110);
    const norm = (t: string) => t.replace(/[^\u0590-\u05FFa-z0-9]/gi, "");
    let heroLine = clean(parsed.heroLine, 140);
    if (heroLine && keyPhrase && (norm(heroLine) === norm(keyPhrase))) heroLine = "";
    let about = clean(parsed.about, 300);
    if (about && (norm(about) === norm(heroLine) || norm(about) === norm(keyPhrase))) about = "";
    const forYouIf = Array.isArray(parsed.forYouIf) ? parsed.forYouIf.map((x) => clean(x, 160)) : [];

    const result = {
      keyPhrase: keyPhrase || "מרחב טיפולי חם ומקצועי",
      heroLine,
      about: about || "אני מלווה אנשים שמחפשים להבין את עצמם טוב יותר, בקצב שלהם ובשיחה פתוחה, בלי שיפוט.",
      forYouIf: forYouIf.length === 3 && forYouIf.every(Boolean)
        ? forYouIf
        : [
            "יש תחושה שמשהו דורש שינוי, גם אם קשה לשים את האצבע על מה",
            "החיים נראים תקינים מבחוץ, אבל מבפנים יש משהו שלא נח",
            "יש רצון במרחב שבאמת מקשיב, בלי שיפוט ובלי עצות ממהרות",
          ],
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("website-generate-content", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
