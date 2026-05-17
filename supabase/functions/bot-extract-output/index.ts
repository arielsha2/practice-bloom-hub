// Extracts structured journey output (niche or self-presentation) from a bot conversation
// and saves it to therapist_journeys.{niche_output | self_presentation_output}.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PROMPTS: Record<string, { column: string; system: string }> = {
  "niche-finder": {
    column: "niche_output",
    system: `אתה מנתח שיחה בין מנטור (Eliana) למטפל פסיכותרפיסט שמטרתה לחלץ את הנישה.
החזר JSON תקין בלבד, בלי טקסט נוסף, בפורמט הבא בדיוק:
{
  "ideal_client": "תיאור המטופל האידיאלי במילים של המטפל",
  "core_pain": "הכאב הדחוף — הצוואר המדמם",
  "transformation": "התוצאה — תצפית מהפסגה",
  "handshake_version": "אני עוזר ל..."
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
  "story_version": "פסקה רגשית קצרה למודעה/פרופיל בגוף ראשון של המטפל"
}
השתמש רק במה שאמר המטפל בפועל. אם פרט חסר, נסח שורה כללית קצרה. אל תמציא.`,
  },
};

// Generic prompt for any other bot — produces a short summary string
const GENERIC_SUMMARY_SYSTEM = `אתה מנתח שיחה בין כלי AI למטפל פסיכותרפיסט.
החזר JSON תקין בלבד בפורמט הבא:
{
  "summary": "סיכום קצר בעברית, 2-4 משפטים, של מה שהמטפל גילה / החליט / תרגל בכלי. דבר בגוף ראשון של המטפל ('הבנתי ש...', 'החלטתי ש...', 'תרגלתי...'). אם אין מסקנה ברורה — תאר במשפט מה נדון."
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
        summary: parsed.summary ?? "",
        updated_at: new Date().toISOString(),
      };
      updatePayload.reflection = { ...baseReflection, tool_summaries: toolSummaries, current: nextStage };
    } else {
      updatePayload[cfg!.column] = parsed;
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
