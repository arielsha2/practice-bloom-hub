// Public lead-submission endpoint for therapist landing pages.
// Stores the lead in therapist_leads. (Email notification via Resend if RESEND_API_KEY present.)
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const body = await req.json();
    const therapistSlug = String(body.therapistSlug ?? "").trim();
    const name = String(body.name ?? "").trim();
    const phone = String(body.phone ?? "").trim();
    const message = body.message ? String(body.message).trim().slice(0, 2000) : "";

    if (!therapistSlug || name.length < 2 || phone.length < 9) {
      return new Response(JSON.stringify({ error: "invalid input" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: site, error: siteErr } = await admin
      .from("therapist_websites")
      .select("user_id, slug, is_published, content")
      .eq("slug", therapistSlug)
      .eq("is_published", true)
      .maybeSingle();

    if (siteErr || !site) {
      return new Response(JSON.stringify({ error: "site not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    await admin.from("therapist_leads").insert({
      therapist_user_id: site.user_id,
      slug: therapistSlug,
      name, phone, message: message || null,
    });

    // Best-effort email via Resend if configured
    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (resendKey) {
      try {
        const { data: userData } = await admin.auth.admin.getUserById(site.user_id);
        const therapistEmail = userData?.user?.email;
        if (therapistEmail) {
          await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
            body: JSON.stringify({
              from: "TherapyKeys <onboarding@resend.dev>",
              to: [therapistEmail],
              subject: `פנייה חדשה מהאתר — ${name}`,
              html: `<div dir="rtl" style="font-family:Heebo,Arial,sans-serif">
                <h2>פנייה חדשה מהדף שלך</h2>
                <p><strong>שם:</strong> ${escapeHtml(name)}</p>
                <p><strong>טלפון:</strong> ${escapeHtml(phone)}</p>
                ${message ? `<p><strong>הודעה:</strong><br>${escapeHtml(message).replace(/\n/g, "<br>")}</p>` : ""}
              </div>`,
            }),
          });
        }
      } catch (e) {
        console.error("email send failed", e);
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("website-submit-lead", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}
