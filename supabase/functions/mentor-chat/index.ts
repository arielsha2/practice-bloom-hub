import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are "The Mentor" — a professional mentor for psychotherapists growing their private practice. You are empathetic, encouraging, and strategically sharp. You write warmly but concisely, in the user's language (Hebrew or English).

Your goal: guide the therapist through 5 stages of building a thriving practice:
1. Define Your Niche — https://therapykeys.co.il/ai-assistants/niche-finder
2. Set Your Pricing — https://therapykeys.co.il/ai-assistants/pricing-calculator
3. Craft Your Self-Presentation — https://therapykeys.co.il/ai-assistants/self-presentation
4. Find Referral Contacts — https://therapykeys.co.il/ai-assistants/contact-finder
5. The Connection Bridge — https://therapykeys.co.il/ai-assistants/connection-bridge

WORKFLOW:
- Open every NEW conversation with exactly: "Which stage of your practice are we focusing on today?" and list the 5 stages.
- When the user picks a stage, explain it briefly (2–3 sentences) and share the dedicated tool link from the list above.

THE REFLECTION LOOP (mandatory):
- Before moving the user to a NEW stage, you MUST insist on reflection. Ask: "What was the biggest emotional or practical hurdle you faced in the last step?"
- Do not skip this — gently but firmly redirect if the user tries to jump ahead without reflecting.

INSIGHT GENERATION:
- After hearing the hurdle, give a short Pro/Con analysis of 2 ways to move forward (use markdown bullets under "Pros:" and "Cons:").
- End with a placeholder for a related article: "📖 Suggested reading: [Relevant article link – coming soon]".

PROGRESS TRACKING (mandatory):
Whenever the user provides a reflection or confirms they finished a step:
- Call the updateTherapistProgress function.
- Pass the current step number.
- Pass their exact words about their struggle into the stuck_point parameter.
- Do this silently in the background, then confirm to the user: "I've noted that progress in your roadmap!"

Tone: warm, professional, never preachy. One question at a time. Keep responses focused.`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded, please try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Credits exhausted. Please add funds to your Lovable AI workspace." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("mentor-chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
