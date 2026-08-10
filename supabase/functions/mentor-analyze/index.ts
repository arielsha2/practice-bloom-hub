import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ANALYSIS_PROMPT = `אתה מנתח שיחה בין מנטור עסקי למטפל פסיכותרפיסט.
המטרה: לזהות אילו מתוך 6 התחנות במסע העסקי כבר *מיושמות באופן ברור* בקליניקה של המטפל לפי דבריו, ובאיזו תחנה הוא מתעסק כעת.

שש התחנות (מפתחות בדיוק כך):
1. "niche" — יש למטפל נישה ברורה / קהל יעד מוגדר שאיתו הוא עובד.
2. "pricing" — התמחור שלו מוגדר, מרגיש לו נכון ומשקף ערך.
3. "self-presentation" — יש לו מסר/הצגה עצמית ברורה (אתר, ביו, איך הוא מציג את עצמו).
4. "network" — יש לו רשת מקצועית / מקורות הפניה פעילים.
5. "conversion" — הוא יודע ליצור ולחזק קשרים מקצועיים עם אנשי מקצוע אחרים (לא מטופלים) שמובילים להפניות הדדיות.
6. "intake" — הוא יודע לנהל שיחת טלפון ראשונה עם מטופל פוטנציאלי (לא איש מקצוע מפנה) ולהוביל אותה לקביעת פגישה ראשונה.

חוקים קריטיים:
- סמן תחנה כ"מיושמת" רק אם המטפל אמר במפורש שזה כבר עובד / קיים / טוב אצלו. ספק = לא מיושם.
- "current" = התחנה שעליה הוא מתעסק/מדבר *כעת* (גם אם לא מיושמת). אם לא ברור — בחר את הראשונה הלא מיושמת.
- "stuck_point" = משפט קצר (עד 80 תווים) המתאר את הקושי הנוכחי שלו, או "" אם אין.
- "stuck_category" = רק אם יש stuck_point, סווג אותו לאחת מהקטגוריות הקבועות הבאות (בדיוק כך):
  "pricing_fear" — פחד/חוסר ביטחון להעלות מחיר, "מי אני שאבקש יותר".
  "unclear_niche" — קושי להגדיר נישה או קהל יעד ספציפי.
  "no_patients_despite_marketing" — עושה הכל נכון אך עדיין אין מטופלים.
  "self_presentation_anxiety" — קושי/חשש להציג את עצמו, פחד מיומרנות.
  "referral_network_gap" — אין מספיק אנשי קשר/מקורות הפניה.
  "confidence_in_value" — ספק בערך העצמי/מקצועיות.
  "time_or_capacity" — עומס, ניהול זמן, קיבולת.
  "other" — כל השאר.
  אם אין stuck_point — השאר "".

בנוסף, חפש בשיחה הודעה מהמנטור שמתחילה במבנה "לפני כמה ימים אמרת... יצא לך לנסות את זה? מה קרה?" (שאלת מעקב על ניסוי שבועי שהמטפל התחייב אליו) ואת התגובה של המטפל אליה, אם יש:
- "experiment_status" — "done" אם המטפל דיווח שניסה/עשה את הניסוי (גם אם התוצאה הייתה מעורבת), "skipped" אם דיווח שלא הספיק/לא ניסה, או "" אם אין כזו הודעה בשיחה או שהתשובה לא ברורה.
- "experiment_learning" — אם experiment_status אינו ריק, משפט קצר במילים של המטפל על מה שקרה או מה שהוא למד מהניסיון (גם אם זה פשוט "שניים הסכימו, אחת אמרה שזה יקר"). אחרת "".

החזר JSON תקין בלבד, ללא טקסט נוסף, בפורמט:
{"completed":["niche","pricing"],"current":"self-presentation","stuck_point":"לא בטוח איך להציג את עצמו באתר","stuck_category":"self_presentation_anxiety","experiment_status":"","experiment_learning":""}`;

const STAGE_KEYS = ["niche", "pricing", "self-presentation", "network", "conversion", "intake"];
const STUCK_CATEGORIES = [
  "pricing_fear",
  "unclear_niche",
  "no_patients_despite_marketing",
  "self_presentation_anxiety",
  "referral_network_gap",
  "confidence_in_value",
  "time_or_capacity",
  "other",
];
const PROJECT_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVtdHFtaHp6eGJmdm9rYml3c21yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY2NjI5ODIsImV4cCI6MjA4MjIzODk4Mn0.lVF-CCkqp0VlTjCmXbVKhYIjBrp9y7_hWacMHk7AxCE";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const { messages, user_id } = body as {
      messages: Array<{ role: string; content: string }>;
      user_id?: string;
    };
    console.log("mentor-analyze called, user_id:", user_id);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "missing key" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Compress conversation to text
    const convo = messages
      .map((m) => `${m.role === "user" ? "מטפל" : "מנטור"}: ${m.content}`)
      .join("\n");

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: ANALYSIS_PROMPT },
          { role: "user", content: `שיחה לניתוח:\n\n${convo}` },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!resp.ok) {
      const t = await resp.text();
      console.error("analyze error", resp.status, t);
      return new Response(JSON.stringify({ error: "ai error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const data = await resp.json();
    const raw = data?.choices?.[0]?.message?.content ?? "{}";
    let parsed: {
      completed?: string[];
      current?: string;
      stuck_point?: string;
      stuck_category?: string;
      experiment_status?: string;
      experiment_learning?: string;
    } = {};
    try {
      parsed = JSON.parse(raw);
    } catch {
      const m = raw.match(/\{[\s\S]*\}/);
      if (m) parsed = JSON.parse(m[0]);
    }

    const completed = Array.isArray(parsed.completed)
      ? parsed.completed.filter((k) => STAGE_KEYS.includes(k))
      : [];
    const current = STAGE_KEYS.includes(parsed.current ?? "")
      ? parsed.current!
      : (STAGE_KEYS.find((k) => !completed.includes(k)) ?? "niche");
    const stuck_point = typeof parsed.stuck_point === "string" ? parsed.stuck_point.trim() : "";
    // Never trust the LLM's raw category string — fall back to "other" for
    // anything outside the fixed taxonomy so the aggregate map stays clean.
    const stuck_category = stuck_point
      ? (STUCK_CATEGORIES.includes(parsed.stuck_category ?? "") ? parsed.stuck_category! : "other")
      : "";
    // Wave 2.3: never trust the raw status string either — only "done" or
    // "skipped" mean anything downstream (a weekly_experiments status
    // transition); anything else collapses to "" (no report found/unclear),
    // same defensive pattern as stuck_category above.
    const experiment_status =
      parsed.experiment_status === "done" || parsed.experiment_status === "skipped"
        ? parsed.experiment_status
        : "";
    const experiment_learning = experiment_status && typeof parsed.experiment_learning === "string"
      ? parsed.experiment_learning.trim()
      : "";

    // NOTE: mentor-score is invoked from the client (src/pages/Mentor.tsx)
    // immediately after this function returns. We no longer trigger it from
    // here to avoid duplicate LLM calls (was firing ~2x per user message).

    return new Response(
      JSON.stringify({ completed, current, stuck_point, stuck_category, experiment_status, experiment_learning }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("mentor-analyze error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

