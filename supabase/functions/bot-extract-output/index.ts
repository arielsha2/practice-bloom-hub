// Extracts structured journey output (niche or self-presentation) from a bot conversation
// and saves it to therapist_journeys.{niche_output | self_presentation_output}.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Every tool bot's own prompt now ends with an explicit commitment question
// (Wave 2.1 migration 20260805170000) — these three fields extract the
// therapist's actual answer to it, not an LLM guess at a reasonable next
// step. Appended to every schema below so it rides along in the same JSON
// call, no extra LLM cost.
const WEEKLY_EXPERIMENT_FIELDS = `,
  "weekly_experiment": "הניסוי הקטן שהמטפל/ת התחייב/ה אליו בפועל, במילים שלו/ה — לא הצעה של הבוט שלא אושרה. אם לא נשאל/לא נענה, מחרוזת ריקה.",
  "belief_under_test": "האמונה או הפחד שמנהלים את ההתנהגות ושהניסוי בפועל בודק — לא ניחוש עסקי, אלא הפחד/האמונה עצמם, במילים של המטפל/ת (למשל 'אני מפחדת שאם אעלה מחיר אנשים יעזבו'). אם לא נאמר, מחרוזת ריקה.",
  "expected_evidence": "איך ידעו שזה קרה — משהו קונקרטי וניתן לתיאור, כמו 'שלחתי הודעת וואטסאפ' או 'עדכנתי את המחיר באתר'. מחרוזת ריקה אם לא ברור."`;

const PROMPTS: Record<string, { column: string; system: string }> = {
  "niche-finder": {
    column: "niche_output",
    system: `אתה מנתח שיחה בין מנטור (Eliana) למטפל פסיכותרפיסט שמטרתה לחלץ את הנישה.
החזר JSON תקין בלבד, בלי טקסט נוסף, בפורמט הבא בדיוק:
{
  "ideal_client": "תיאור המטופל האידיאלי במילים של המטפל",
  "core_pain": "הכאב הדחוף — הצוואר המדמם",
  "transformation": "התוצאה — תצפית מהפסגה",
  "handshake_version": "אני עוזר ל..."${WEEKLY_EXPERIMENT_FIELDS}
}
השתמש רק במה שאמר המטפל בפועל. אם פרט חסר, נסח שורה כללית קצרה ומכבדת. אל תמציא פרטים שאינם בשיחה.`,
  },
  "self-presentation": {
    column: "self_presentation_output",
    system: `אתה מנתח שיחה בין מנטור למטפל פסיכותרפיסט שמטרתה לחלץ הצגה עצמית רגשית.
החזר JSON תקין בלבד, בלי טקסט נוסף, בפורמט הבא בדיוק:
{
  "internal_pain": "התחושה הפנימית — ריקנות, בדידות",
  "external_pain": "הביטוי בחיים — ריבים, חוסר שינה",
  "desire": "הכמיהה הכמוסה — שקט, ביטחון, חמלה",
  "result": "איך ייראו החיים אחרי הטיפול",
  "story_version": "פסקה רגשית קצרה למודעה/פרופיל בגוף ראשון של המטפל"${WEEKLY_EXPERIMENT_FIELDS}
}
השתמש רק במה שאמר המטפל בפועל. אם פרט חסר, נסח שורה כללית קצרה. אל תמציא.`,
  },
  "pricing-calculator": {
    column: "pricing_output",
    system: `אתה מנתח שיחה בין בוט תמחור למטפל פסיכותרפיסט שמטרתה לקבוע תעריף.
החזר JSON תקין בלבד, בלי טקסט נוסף, בפורמט הבא בדיוק:
{
  "comfort_range_low": <מספר — התעריף הנמוך ביותר בטווח הנוחות שהמטפל ציין, או null אם לא צוין>,
  "comfort_range_high": <מספר — התעריף הגבוה ביותר בטווח הנוחות שהמטפל ציין, או null אם לא צוין>,
  "target_clients_per_week": <מספר — כמה מטופלים בשבוע המטפל ציין שהוא רוצה, או null אם לא צוין>${WEEKLY_EXPERIMENT_FIELDS}
}
השתמש רק במספרים שהמטפל אמר בפועל בשיחה. אל תחשב, אל תמציא, אל תעגל. אם מספר לא הוזכר — null.`,
  },
  "contact-finder": {
    column: "contact_finder_output",
    system: `אתה מנתח שיחה בין בוט איתור אנשי קשר למטפל פסיכותרפיסט.
החזר JSON תקין בלבד, בלי טקסט נוסף, בפורמט הבא בדיוק:
{
  "contacts": [
    { "profession": "תיאור קצר של סוג איש הקשר/הזירה שהוזכרה", "reasoning": "למה זה רלוונטי למטופל האידיאלי שלו, במשפט אחד" }
  ]${WEEKLY_EXPERIMENT_FIELDS}
}
כלול את כל סוגי אנשי הקשר/הזירות שעלו בשיחה (בדרך כלל 5-7). אל תמציא סוגים שלא הוזכרו. אל תכלול שמות פרטיים או פרטי קשר — רק סוגי תפקיד/זירה.`,
  },
  "connection-bridge": {
    column: "connection_bridge_output",
    system: `אתה מנתח שיחה בין בוט תרגול שיחת היכרות (Connection Bridge) למטפל פסיכותרפיסט.
השיחה עוברת 4 שלבים: איסוף מידע על איש הקשר, פרופיל פסיכולוגי שלו, סימולציית תרגול (הבוט משחק את איש הקשר), ומשוב מובנה לפי "מודל הגשר" (חילופי ערך, סמכות מקצועית, צעד הבא).
החזר JSON תקין בלבד, בלי טקסט נוסף, בפורמט הבא בדיוק:
{
  "contact_type": "התפקיד/סוג איש הקשר שתורגל, כפי שעלה בשיחה",
  "confidence_before": <מספר 1-10 שהמטפל דיווח לפני התרגול, או null אם לא נשאל/לא ענה>,
  "confidence_after": <מספר 1-10 שהמטפל דיווח אחרי התרגול, או null אם לא נשאל/לא ענה>,
  "value_exchange": "משפט קצר מתוך המשוב על חילופי הערך שהוצג בסימולציה",
  "professional_authority": "משפט קצר מתוך המשוב על הסמכות המקצועית שהוצגה",
  "next_action": "הצעד הבא הקונקרטי שסוכם (פגישת קפה, שיחת זום, וכו'), או '' אם לא הוגדר",
  "key_improvement": "השיפור המרכזי שהוצע לקראת השיחה האמיתית"${WEEKLY_EXPERIMENT_FIELDS}
}
השתמש רק במה שעלה בפועל בשיחה ובמשוב שניתן בשלב 4. אל תמציא. אם פרט חסר — מחרוזת ריקה או null לפי הסוג.`,
  },
};

// Pricing and contacts need extra shaping beyond a straight parsed-JSON save:
// pricing's recommended rate / income projection is arithmetic that must be
// computed here, not trusted to the LLM's extraction; contacts need stable
// ids and empty name/phone/email fields for the therapist to fill in later.
function buildStructuredOutput(botKey: string, parsed: Record<string, unknown>): unknown {
  if (botKey === "pricing-calculator") {
    const low = typeof parsed.comfort_range_low === "number" ? parsed.comfort_range_low : null;
    const high = typeof parsed.comfort_range_high === "number" ? parsed.comfort_range_high : null;
    const targetClients = typeof parsed.target_clients_per_week === "number" ? parsed.target_clients_per_week : null;
    const recommendedRate = high !== null ? Math.round(high * 1.1) : null;
    const monthlyIncome =
      recommendedRate !== null && targetClients !== null
        ? Math.round(recommendedRate * targetClients * 4.3)
        : null;
    const annualIncome = monthlyIncome !== null ? monthlyIncome * 12 : null;
    return {
      comfort_range_low: low,
      comfort_range_high: high,
      target_clients_per_week: targetClients,
      recommended_rate: recommendedRate,
      monthly_income: monthlyIncome,
      annual_income: annualIncome,
    };
  }
  if (botKey === "contact-finder") {
    const contactsRaw = Array.isArray((parsed as any).contacts) ? (parsed as any).contacts : [];
    return contactsRaw.map((c: any) => ({
      id: crypto.randomUUID(),
      profession: typeof c?.profession === "string" ? c.profession : "",
      reasoning: typeof c?.reasoning === "string" ? c.reasoning : "",
      name: "",
      phone: "",
      email: "",
    }));
  }
  return parsed;
}

// Generic prompt for any other bot — produces a short summary string
const GENERIC_SUMMARY_SYSTEM = `אתה מנתח שיחה בין כלי AI למטפל פסיכותרפיסט.
החזר JSON תקין בלבד בפורמט הבא:
{
  "summary": "סיכום קצר בעברית, 2-4 משפטים, של מה שהמטפל גילה / החליט / תרגל בכלי. דבר בגוף ראשון של המטפל ('הבנתי ש...', 'החלטתי ש...', 'תרגלתי...'). אם אין מסקנה ברורה — תאר במשפט מה נדון."${WEEKLY_EXPERIMENT_FIELDS}
}
השתמש רק במה שאמר המטפל בפועל. אל תמציא.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
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
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { botKey, conversationId } = await req.json();
    const cfg = PROMPTS[botKey];
    const isGeneric = !cfg;
    if (!conversationId) {
      return new Response(JSON.stringify({ error: "conversationId required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Load conversation messages
    const { data: msgs, error: msgErr } = await supabase
      .from("bot_messages")
      .select("role, content")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true })
      .limit(80);

    if (msgErr || !msgs || msgs.length < 2) {
      return new Response(JSON.stringify({ error: "Not enough conversation" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const transcript = msgs
      .map((m: any) => `${m.role === "user" ? "מטפל" : "מנטור"}: ${m.content}`)
      .join("\n");

    const lovableKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableKey) {
      return new Response(JSON.stringify({ error: "missing key" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemPrompt = isGeneric ? GENERIC_SUMMARY_SYSTEM : cfg!.system;

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${lovableKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `שיחה לניתוח (כלי: ${botKey}):\n\n${transcript}` },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!aiRes.ok) {
      const t = await aiRes.text();
      console.error("AI error", aiRes.status, t);
      return new Response(JSON.stringify({ error: "ai error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const data = await aiRes.json();
    const raw = data?.choices?.[0]?.message?.content ?? "{}";
    let parsed: Record<string, unknown> = {};
    try {
      parsed = JSON.parse(raw);
    } catch {
      const m = raw.match(/\{[\s\S]*\}/);
      if (m) parsed = JSON.parse(m[0]);
    }

    // Weekly-experiment fields (Wave 2.1) ride along in the same extraction
    // call for every bot but belong in their own table, not in the
    // tool-specific structured columns (niche_output/etc.) whose shape is
    // already relied on elsewhere (FinalCelebration.tsx, Mentor.tsx's
    // `from=` handler) — pull them out before anything else touches `parsed`.
    const { weekly_experiment, belief_under_test, expected_evidence, ...rest } = parsed as {
      weekly_experiment?: string;
      belief_under_test?: string;
      expected_evidence?: string;
      [key: string]: unknown;
    };

    // Map bot key -> journey stage key, so completing a tool auto-advances the journey
    const BOT_TO_STAGE: Record<string, string> = {
      "niche-finder": "niche",
      "pricing-calculator": "pricing",
      "self-presentation": "self-presentation",
      "contact-finder": "network",
      "connection-bridge": "conversion",
    };
    const stageKey = BOT_TO_STAGE[botKey];
    const STAGE_ORDER = ["niche", "pricing", "self-presentation", "network", "conversion"];

    // Upsert into therapist_journeys
    const { data: existing } = await supabase
      .from("therapist_journeys")
      .select("id, reflection, completed_stages, step_number")
      .eq("user_id", user.id)
      .maybeSingle();

    const prevCompleted = ((existing as any)?.completed_stages as string[] | null) ?? [];
    const completedSet = new Set(prevCompleted);
    if (stageKey) completedSet.add(stageKey);
    const newCompleted = STAGE_ORDER.filter((k) => completedSet.has(k));
    const nextStage = STAGE_ORDER.find((k) => !completedSet.has(k)) ?? "conversion";
    const nextStepNumber = STAGE_ORDER.indexOf(nextStage) + 1;

    const baseReflection = (existing?.reflection as Record<string, any>) ?? {};

    let updatePayload: Record<string, any> = {
      completed_stages: newCompleted,
      step_number: nextStepNumber,
      updated_at: new Date().toISOString(),
    };

    if (isGeneric) {
      const toolSummaries = (baseReflection.tool_summaries as Record<string, any>) ?? {};
      toolSummaries[botKey] = {
        summary: rest.summary ?? "",
        updated_at: new Date().toISOString(),
      };
      updatePayload.reflection = { ...baseReflection, tool_summaries: toolSummaries, current: nextStage };
    } else {
      updatePayload[cfg!.column] = buildStructuredOutput(botKey, rest);
      updatePayload.reflection = { ...baseReflection, current: nextStage };
    }

    if (existing) {
      await supabase
        .from("therapist_journeys")
        .update(updatePayload)
        .eq("user_id", user.id);
    } else {
      await supabase
        .from("therapist_journeys")
        .insert({ user_id: user.id, ...updatePayload });
    }

    // Wave 2.1: record the therapist's actual commitment as a weekly
    // experiment, captured from their real answer to the commitment
    // question appended to this bot's prompt — not inferred here.
    if (typeof weekly_experiment === "string" && weekly_experiment.trim()) {
      await supabase.from("weekly_experiments").insert({
        user_id: user.id,
        bot_key: botKey,
        stage: stageKey ?? nextStage,
        action_text: weekly_experiment.trim(),
        belief_under_test: typeof belief_under_test === "string" ? belief_under_test.trim() : "",
        expected_evidence: typeof expected_evidence === "string" ? expected_evidence.trim() : "",
      });
    }

    return new Response(JSON.stringify({ success: true, output: parsed }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("bot-extract-output", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "unknown" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
