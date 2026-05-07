import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ANALYSIS_PROMPT = `אתה מנתח שיחה בין מנטור עסקי למטפל פסיכותרפיסט.
המטרה: לזהות אילו מתוך 5 התחנות במסע העסקי כבר *מיושמות באופן ברור* בקליניקה של המטפל לפי דבריו, ובאיזו תחנה הוא מתעסק כעת.

חמש התחנות (מפתחות בדיוק כך):
1. "niche" — יש למטפל נישה ברורה / קהל יעד מוגדר שאיתו הוא עובד.
2. "pricing" — התמחור שלו מוגדר, מרגיש לו נכון ומשקף ערך.
3. "self-presentation" — יש לו מסר/הצגה עצמית ברורה (אתר, ביו, איך הוא מציג את עצמו).
4. "network" — יש לו רשת מקצועית / מקורות הפניה פעילים.
5. "conversion" — הוא יודע לנהל שיחת היכרות ראשונה ולסגור מטופלים.

חוקים קריטיים:
- סמן תחנה כ"מיושמת" רק אם המטפל אמר במפורש שזה כבר עובד / קיים / טוב אצלו. ספק = לא מיושם.
- "current" = התחנה שעליה הוא מתעסק/מדבר *כעת* (גם אם לא מיושמת). אם לא ברור — בחר את הראשונה הלא מיושמת.
- "stuck_point" = משפט קצר (עד 80 תווים) המתאר את הקושי הנוכחי שלו, או "" אם אין.

החזר JSON תקין בלבד, ללא טקסט נוסף, בפורמט:
{"completed":["niche","pricing"],"current":"self-presentation","stuck_point":"לא בטוח איך להציג את עצמו באתר"}`;

const STAGE_KEYS = ["niche", "pricing", "self-presentation", "network", "conversion"];

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "missing key" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Compress conversation to text
    const convo = (messages as Array<{ role: string; content: string }>)
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
    let parsed: { completed?: string[]; current?: string; stuck_point?: string } = {};
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

    return new Response(JSON.stringify({ completed, current, stuck_point }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("mentor-analyze error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
