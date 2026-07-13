// Generates a structured wrap-up for a mentor conversation:
// key points that emerged + concrete next-action highlights.
// Called from the client via supabase.functions.invoke("mentor-summary").
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type Msg = { role: "user" | "assistant"; content: string };

const cleanContent = (raw: string): string =>
  (raw || "")
    .replace(/\[HANDOFF:[a-z-]+\]/gi, "")
    .replace(/\[INSIGHT\]/gi, "")
    .trim();

const SYSTEM_HE = `את אליענה, המנטורית של המטפל/ת. קיבלת כעת את תמלול השיחה. המשימה שלך: להפיק סיכום קצר, אישי וממוקד — בעברית בלבד, בלשון נקבה מדברת (על עצמך).

החזירי JSON תקין בלבד, בלי טקסט נוסף, במבנה:
{
  "title": "כותרת קצרה (עד 8 מילים) שמתארת את מוקד השיחה",
  "goals": ["מטרה 1 של החלק הזה בשיחה", "מטרה 2"],
  "key_points": ["נקודה מרכזית 1 שעלתה", "נקודה 2", "נקודה 3"],
  "action_items": ["פעולה קונקרטית 1 שהמטפל/ת יכול/ה לבצע השבוע", "פעולה 2", "פעולה 3"],
  "next_focus": "משפט אחד: על מה כדאי להתמקד בשיחה הבאה"
}

כללים:
• 3–6 פריטים בכל רשימה, קצרים וברורים.
• action_items חייבות להיות קונקרטיות, ניתנות לביצוע, בזמן פועל ("נסח…", "התקשר ל…", "כתוב…").
• אל תמציאי פרטים שלא נאמרו. אם חסר מידע — כתבי פחות פריטים.
• בלי מרקדאון, בלי אימוג'ים, בלי טקסט מחוץ ל-JSON.`;

const SYSTEM_EN = `You are Eliana, the mentor. Produce a short, personal wrap-up of the transcript.

Return valid JSON ONLY in this shape:
{
  "title": "short title (max 8 words) describing the focus",
  "goals": ["goal 1 of this part of the conversation", "goal 2"],
  "key_points": ["main point 1", "point 2", "point 3"],
  "action_items": ["concrete action 1 for this week", "action 2", "action 3"],
  "next_focus": "one sentence about what to focus on next time"
}

Rules:
• 3–6 items per list, short and clear.
• action_items must be concrete and imperative ("Write…", "Call…", "Draft…").
• Never invent facts. If something wasn't said, include fewer items.
• No markdown, no emojis, no text outside the JSON.`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { messages, language } = (await req.json()) as {
      messages: Msg[];
      language?: "he" | "en";
    };

    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: "messages required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const isHe = language !== "en";
    const transcript = messages
      .map((m) => `${m.role === "user" ? (isHe ? "מטפל/ת" : "Therapist") : (isHe ? "אליענה" : "Eliana")}: ${cleanContent(m.content)}`)
      .filter((s) => s.trim().length > 0)
      .join("\n\n");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: isHe ? SYSTEM_HE : SYSTEM_EN },
          { role: "user", content: transcript },
        ],
        response_format: { type: "json_object" },
        temperature: 0.4,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return new Response(JSON.stringify({ error: "gateway_error", detail: errText }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const raw = data?.choices?.[0]?.message?.content ?? "{}";
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(raw);
    } catch {
      // strip markdown fences if any
      const cleaned = String(raw).replace(/```json\s*|\s*```/g, "").trim();
      parsed = JSON.parse(cleaned);
    }

    return new Response(JSON.stringify(parsed), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("mentor-summary error", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
