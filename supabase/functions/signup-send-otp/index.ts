// Sends a 6-digit signup OTP via Brevo (connector gateway).
// Public endpoint: verify_jwt = false. Rate-limited per email.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SENDER_EMAIL = Deno.env.get("SIGNUP_OTP_SENDER_EMAIL") ?? "noreply@therapykeys.co.il";
const SENDER_NAME = Deno.env.get("SIGNUP_OTP_SENDER_NAME") ?? "TherapyKeys";
const RESEND_LOCK_SECONDS = 55; // a little under client's 60s so race retries are friendly
const CODE_TTL_MINUTES = 10;

function generateCode(): string {
  const bytes = new Uint8Array(4);
  crypto.getRandomValues(bytes);
  const n = ((bytes[0] << 24) | (bytes[1] << 16) | (bytes[2] << 8) | bytes[3]) >>> 0;
  return String(n % 1_000_000).padStart(6, "0");
}

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function buildHtml(code: string): string {
  return `<!doctype html>
<html lang="he" dir="rtl">
<head><meta charset="utf-8"/></head>
<body style="margin:0;background:#f5f2ff;font-family:'Heebo',Arial,sans-serif;color:#1f1238;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" style="max-width:480px;background:#ffffff;border-radius:16px;padding:32px;box-shadow:0 4px 24px rgba(88,0,90,0.08);">
        <tr><td align="center">
          <div style="font-size:20px;font-weight:700;color:#58005a;">TherapyKeys</div>
          <div style="margin-top:24px;font-size:16px;color:#4a3a5e;">קוד האימות שלך להרשמה למנטור:</div>
          <div style="margin:24px auto;padding:16px 24px;display:inline-block;background:#f5f2ff;border:2px dashed #58005a;border-radius:12px;font-size:36px;font-weight:800;letter-spacing:8px;color:#58005a;direction:ltr;">${code}</div>
          <div style="font-size:14px;color:#7a6b8a;">הקוד תקף ל-10 דקות. אם לא ביקשת — אפשר להתעלם מהמייל הזה.</div>
        </td></tr>
      </table>
      <div style="margin-top:16px;font-size:12px;color:#9b8eb0;">© TherapyKeys</div>
    </td></tr>
  </table>
</body></html>`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "method_not_allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const rawEmail = String(body.email ?? "").trim().toLowerCase();
    const name = body.name ? String(body.name).trim().slice(0, 100) : null;
    const mailingConsent = body.mailing_list_consent === true;

    if (!rawEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rawEmail)) {
      return new Response(JSON.stringify({ error: "invalid_email" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const BREVO_API_KEY = Deno.env.get("BREVO_API_KEY");
    if (!LOVABLE_API_KEY || !BREVO_API_KEY) {
      console.error("Missing LOVABLE_API_KEY or BREVO_API_KEY");
      return new Response(JSON.stringify({ error: "email_not_configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Rate limit: look at the most recent code for this email.
    const { data: recent } = await admin
      .from("signup_otp_codes")
      .select("last_sent_at")
      .eq("email", rawEmail)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (recent?.last_sent_at) {
      const elapsed = (Date.now() - new Date(recent.last_sent_at).getTime()) / 1000;
      if (elapsed < RESEND_LOCK_SECONDS) {
        return new Response(
          JSON.stringify({ error: "rate_limited", retry_after: Math.ceil(RESEND_LOCK_SECONDS - elapsed) }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
    }

    const code = generateCode();
    const codeHash = await sha256Hex(`${rawEmail}:${code}`);
    const expiresAt = new Date(Date.now() + CODE_TTL_MINUTES * 60_000).toISOString();

    // Invalidate any prior unconsumed codes for this email.
    await admin
      .from("signup_otp_codes")
      .update({ consumed_at: new Date().toISOString() })
      .eq("email", rawEmail)
      .is("consumed_at", null);

    const { error: insertError } = await admin.from("signup_otp_codes").insert({
      email: rawEmail,
      code_hash: codeHash,
      expires_at: expiresAt,
    });
    if (insertError) {
      console.error("insert otp failed", insertError);
      return new Response(JSON.stringify({ error: "internal" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Send via Brevo connector gateway.
    const brevoResp = await fetch("https://connector-gateway.lovable.dev/brevo/smtp/email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "X-Connection-Api-Key": BREVO_API_KEY,
      },
      body: JSON.stringify({
        sender: { name: SENDER_NAME, email: SENDER_EMAIL },
        to: [{ email: rawEmail, name: name ?? undefined }],
        subject: `קוד האימות שלך: ${code}`,
        htmlContent: buildHtml(code),
        textContent: `קוד האימות שלך להרשמה ל-TherapyKeys: ${code}\nהקוד תקף ל-10 דקות.`,
      }),
    });

    const brevoBody = await brevoResp.text();
    if (!brevoResp.ok) {
      console.error("Brevo send failed", brevoResp.status, brevoBody);
      return new Response(
        JSON.stringify({ error: "send_failed", provider_status: brevoResp.status, provider_body: brevoBody }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    console.log("OTP sent", { email: rawEmail, brevo: brevoBody.slice(0, 200) });

    // Store name/consent in user metadata at verify time; the verify function reads from request.
    // We return ok with no echoed code (never log the code).
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("signup-send-otp error", err);
    return new Response(JSON.stringify({ error: "internal" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
