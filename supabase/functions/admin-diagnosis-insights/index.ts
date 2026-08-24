// Admin-only: qualitative AI synthesis of practice-diagnosis results across
// all therapists — same shape as admin-insights (auth check, service-role
// pull, Lovable Gateway call), scoped to diagnosis_output instead of the
// 5-stage journey data, and asking specifically about business impact on
// clinic growth (what admin-insights' original prompt doesn't cover).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing auth" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: userData } = await userClient.auth.getUser();
    const user = userData?.user;
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: roles } = await supabase
      .from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle();
    if (!roles) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: journeys } = await supabase
      .from("therapist_journeys")
      .select("diagnosis_output")
      .not("diagnosis_output", "is", null);

    const dataset = (journeys ?? [])
      .map((j: any) => j.diagnosis_output)
      .filter(Boolean)
      .map((d: any) => ({
        presenting_theory: d.presenting_theory,
        what_is_working: d.what_is_working,
        diagnosis_summary: d.diagnosis_summary,
        evidence_summary: d.evidence_summary,
        bottleneck_description: d.bottleneck_description,
        behavioral_mechanism: d.behavioral_mechanism,
        stuck_category: d.stuck_category,
        bottleneck_stage: d.bottleneck_stage,
        not_the_priority: d.not_the_priority,
        recommended_tool: d.recommended_tool,
      }));

    if (dataset.length === 0) {
      return new Response(JSON.stringify({ rows: [], insight: "", sample_size: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;
    const prompt = `אתה אנליסט מוצר עבור "האבחון" — כלי אבחון חינמי שעוזר למטפלים פסיכותרפיסטים בפרקטיקה פרטית להבין מה עוצר את הצמיחה של הקליניקה שלהם. כל שורה בנתונים למטה היא תוצאת אבחון אמיתית של מטפל/ת אחד/ת: מה הוא/היא חשב/ה שהבעיה, מה באמת התברר, מה כן עובד אצלו/ה, ואיזה כלי הומלץ.

נתח את הנתונים וענה בעברית, בפורמט markdown, עם ארבעה חלקים:

1. **דפוסים בקשיים** — קבץ את הקשיים לקטגוריות בעלות משמעות (לא רק סיווג טכני של stuck_category, אלא דפוס אמיתי בשפה שלך), עם אחוזים גסים. שים לב במיוחד למקומות שבהם presenting_theory (מה שהמטפל חשב) שונה משמעותית מ-diagnosis_summary/bottleneck_description (מה שבאמת התברר) — זו האינפורמציה הכי יקרה כאן.

2. **איך זה משפיע על התפתחות הקליניקה** — לא רק "מה הבעיה", אלא מה המשמעות העסקית/מעשית של כל דפוס: איפה בדיוק זה עוצר צמיחה, ולמה זה נשאר כך לאורך זמן אם לא מטפלים בו (למשל: קושי בהצגה עצמית לא רק "לא נעים" — הוא מונע הפניות עקביות למרות רשת קשרים תקינה). תן לזה עומק אמיתי, לא רק תיאור.

3. **מה זה אומר על הכלי הבא הנדרש** — לפי recommended_tool, איזה כלי הכי נדרש כרגע לפי הנתונים, ואיפה יש פער בין מה שהמטפלים חושבים שהם צריכים לבין מה שהם באמת צריכים.

4. **המלצה אחת לעסק** — נקודת פעולה קונקרטית אחת (למשל: תוכן שיווקי שכדאי לכתוב, שינוי בסדר עדיפויות המנטור, נושא שכדאי להדגיש בקהילה) שנובעת ישירות מהדפוסים שזיהית.

נתונים (${dataset.length} אבחונים אנונימיים):
${JSON.stringify(dataset, null, 2)}`;

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!aiResp.ok) {
      const t = await aiResp.text();
      return new Response(JSON.stringify({ error: "AI error", detail: t }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const ai = await aiResp.json();
    const insight = ai.choices?.[0]?.message?.content ?? "";

    return new Response(JSON.stringify({ insight, sample_size: dataset.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
