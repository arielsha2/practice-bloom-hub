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

    // Trigger mentor-score in the background (non-blocking)
    if (user_id) {
      const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
      const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
      console.log("triggering mentor-score for user:", user_id);

      const scoreTask = (async () => {
        try {
          if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
            console.error("mentor-score: missing SUPABASE_URL or SERVICE_ROLE_KEY");
            return;
          }
          const scoreResp = await fetch(`${SUPABASE_URL}/functions/v1/mentor-score`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${SERVICE_ROLE_KEY}`,
              "apikey": SERVICE_ROLE_KEY,
            },
            body: JSON.stringify({ user_id, messages, completed, current, stuck_point }),
          });
          const txt = await scoreResp.text();
          console.log("mentor-score response", scoreResp.status, txt.slice(0, 300));
        } catch (e) {
          console.error("mentor-score trigger error:", e);
        }
      })();

      // Keep the runtime alive until the background task completes
      // @ts-ignore - EdgeRuntime is provided by Supabase
      if (typeof EdgeRuntime !== "undefined" && EdgeRuntime?.waitUntil) {
        // @ts-ignore
        EdgeRuntime.waitUntil(scoreTask);
      }
    } else {
      console.warn("mentor-analyze: no user_id provided, skipping mentor-score");
    }

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

