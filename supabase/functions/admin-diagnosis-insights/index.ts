// Admin-only: qualitative AI synthesis of practice-diagnosis results across
// all therapists — same shape as admin-insights (auth check, service-role
// pull, Lovable Gateway call), scoped to diagnosis_output instead of the
// 5-stage journey data, and asking specifically about business impact on
// clinic growth (what admin-insights' original prompt doesn't cover).
// Also pulls a second, independent source — real Mentor working-session
// text from mentor_conversations — so the synthesis can cross-check the
// diagnosis's own (sometimes biased) stuck_category labels against what
// therapists actually say once they're deep in real tool work, not just
// the short diagnosis intake.
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

    // Second, independent data source: real Mentor working sessions (pricing,
    // self-presentation, niche, etc. — not the short diagnosis intake). These
    // are where therapists actually work through the problem, so they surface
    // the underlying psychological driver (fear, shame, hesitation) in far
    // more raw and reliable form than the short diagnosis conversation does.
    // Anonymized the same way as the diagnosis dataset above — no user_id,
    // no name, no email, just the working content itself. Capped per-row and
    // to "substantial" sessions (3+ user messages) to keep token cost bounded.
    const { data: mentorRows } = await supabase
      .from("mentor_conversations")
      .select("stage, messages, messages_archive");

    const mentorDataset = (mentorRows ?? [])
      .map((r: any) => {
        const allMessages = [...(r.messages_archive ?? []), ...(r.messages ?? [])];
        const userText = allMessages
          .filter((m: any) => m?.role === "user" && typeof m?.content === "string")
          .map((m: any) => m.content)
          .join(" ||| ");
        const userMessageCount = allMessages.filter((m: any) => m?.role === "user").length;
        return { stage: r.stage as string | null, userText, userMessageCount };
      })
      // Only substantial sessions — a couple of one-line replies don't carry
      // enough signal and just add noise/cost to the synthesis below.
      .filter((r) => r.userMessageCount >= 3)
      .map((r) => ({ stage: r.stage, user_text: r.userText.slice(0, 1200) }));

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;
    const prompt = `אתה אנליסט מוצר עבור "האבחון" — כלי אבחון חינמי שעוזר למטפלים פסיכותרפיסטים בפרקטיקה פרטית להבין מה עוצר את הצמיחה של הקליניקה שלהם. יש לך שני מקורות נתונים אנונימיים, שונים באופיים:

מקור 1 — תוצאות אבחון: כל שורה היא תוצאה מובנית של שיחת אבחון קצרה אחת (4 שלבים): מה המטפל/ת חשב/ה שהבעיה, מה באמת התברר, מה כן עובד, ואיזה כלי הומלץ.

מקור 2 — שיחות מנטור מלאות: כל שורה היא הטקסט הגולמי (רק הודעות המטפל/ת, לא של הבוט) משיחת עבודה אמיתית וממושכת בכלי המנטור (תמחור, הצגה עצמית, נישה וכו'). זה לא סיכום — זה מה שהמטפל/ת בפועל כתב/ה, כולל השפה הרגשית הגולמית. זה המקור האמין ביותר לזהות את המנגנון הפסיכולוגי האמיתי, כי כאן המטפל/ת כבר בעומק העבודה, לא בשיחת אבחון קצרה שבה יש פחות זמן להיפתח.

נתח את שני המקורות **יחד**, לא בנפרד, וענה בעברית, בפורמט markdown, עם ארבעה חלקים:

1. **דפוסים בקשיים** — קבץ את הקשיים לקטגוריות בעלות משמעות (לא רק סיווג טכני של stuck_category, אלא דפוס אמיתי בשפה שלך), עם אחוזים גסים מתוך מקור 1. שים לב במיוחד למקומות שבהם presenting_theory (מה שהמטפל חשב) שונה משמעותית מ-diagnosis_summary/bottleneck_description (מה שבאמת התברר) — זו האינפורמציה הכי יקרה כאן. שים לב במיוחד גם לחוט של חוסר ביטחון עצמי — חשש, אי-נוחות, או בושה מלהיראות, לפרסם את עצמם, לתמחר את עצמם, או לקחת פיקוד בשיחה — גם כשהוא לא מסומן במפורש כ-self_presentation_anxiety או confidence_in_value ב-stuck_category. תיוג הקטגוריה לא תמיד מדויק (ידוע שהוא נוטה לפעמים לתייג "נישה לא ברורה" גם כשהסיבה האמיתית היא חשש מחשיפה) — קרא את הטקסט החופשי עצמו, לא רק את התווית. **חובה**: לכל דפוס מרכזי שאתה מזהה במקור 1, ציין אם יש לו אישוש/העמקה במקור 2 — למשל אם 40% מהאבחונים מסווגים כ"נישה לא ברורה" אבל שיחות המנטור בפועל (מקור 2) מראות שאצל חלק מהם המנגנון האמיתי הוא חשש מחשיפה ולא חוסר ניסוח, זו בדיוק התובנה שצריך להעלות.

2. **איך זה משפיע על התפתחות הקליניקה** — לא רק "מה הבעיה", אלא מה המשמעות העסקית/מעשית של כל דפוס: איפה בדיוק זה עוצר צמיחה, ולמה זה נשאר כך לאורך זמן אם לא מטפלים בו (למשל: קושי בהצגה עצמית לא רק "לא נעים" — הוא מונע הפניות עקביות למרות רשת קשרים תקינה). תן לזה עומק אמיתי, לא רק תיאור.

3. **מה זה אומר על הכלי הבא הנדרש** — לפי recommended_tool, איזה כלי הכי נדרש כרגע לפי הנתונים, ואיפה יש פער בין מה שהמטפלים חושבים שהם צריכים לבין מה שהם באמת צריכים.

4. **המלצה אחת לעסק** — נקודת פעולה קונקרטית אחת (למשל: תוכן שיווקי שכדאי לכתוב, שינוי בסדר עדיפויות המנטור, שינוי בפרומפט של כלי ספציפי, נושא שכדאי להדגיש בקהילה) שנובעת ישירות מהדפוסים שזיהית — ותציין אם ההמלצה נשענת על מקור 1, מקור 2, או שניהם יחד (זה האחרון הכי חזק).

מקור 1 — נתוני אבחון (${dataset.length} אבחונים):
${JSON.stringify(dataset, null, 2)}

מקור 2 — שיחות מנטור מלאות (${mentorDataset.length} שיחות משמעותיות, 3+ הודעות משתמש):
${JSON.stringify(mentorDataset, null, 2)}`;

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

    return new Response(
      JSON.stringify({ insight, sample_size: dataset.length, mentor_sample_size: mentorDataset.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
