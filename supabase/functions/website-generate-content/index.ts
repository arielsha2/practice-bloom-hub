// Generates landing page draft content for the therapist using their journey data.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `אתה עוזר למטפל לבנות דף נחיתה שיווקי מהנתונים שחולצו מהמסע שלו.
אל תמציא — השתמש רק במה שמופיע בנתונים שקיבלת.
אם חסר מידע — כתוב משפט כללי חם שמתאים למטפל פסיכותרפיסט.
הטון: חם, אישי, מדויק — לא גנרי, לא מנופח, לא שיווקי-צעקני.
הכתיבה בגוף ראשון מנקודת המבט של המטפל.
המטרה: שמטופל פוטנציאלי יקרא את הדף וירגיש "זה בדיוק אני, זה מה שאני צריך".

החזר JSON בלבד, ללא הסבר, ללא markdown, בפורמט הזה בדיוק:
{
  "keyPhrase": "משפט אחד קצר מבוסס על handshake_version, עד 100 תווים",
  "about": "פסקה קצרה בגוף ראשון מבוססת על story_version, עד 250 תווים",
  "forYouIf": [
    "משפט קצר המבוסס על internal_pain — מה מרגישים מבפנים",
    "משפט קצר המבוסס על external_pain — מה קורה בחיים בפועל",
    "משפט קצר המבוסס על desire — מה מחפשים בעמקי הלב"
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
    let parsed: { keyPhrase?: string; about?: string; forYouIf?: string[] } = {};
    try { parsed = JSON.parse(raw); } catch {
      const m = raw.match(/\{[\s\S]*\}/);
      if (m) parsed = JSON.parse(m[0]);
    }

    const result = {
      keyPhrase: parsed.keyPhrase || "מרחב טיפולי חם, מקצועי ובטוח",
      about: parsed.about || "אני מאמין שכל אחד יכול לצמוח מתוך מקום של חמלה ושייכות. אני כאן כדי להחזיק לך מקום בטוח ולצעוד איתך צעד-צעד.",
      forYouIf: Array.isArray(parsed.forYouIf) && parsed.forYouIf.length === 3
        ? parsed.forYouIf
        : [
            "אתה מרגיש שמשהו דורש שינוי, גם אם קשה לשים את האצבע על מה",
            "החיים נראים תקינים מבחוץ אבל מבפנים יש משהו שלא נח",
            "אתה מחפש מרחב שבאמת מקשיב — בלי שיפוט ובלי ייעוץ ממהר",
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
