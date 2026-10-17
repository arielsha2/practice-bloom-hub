// Public PayPal webhook for the English diagnosis funnel's two payment
// links (DiagnosisResultDialog's SINGLE_TOOL_PAYMENT_URL_EN /
// FULL_MENTOR_PAYMENT_URL_EN, both plain PayPal "payment link" checkouts,
// not tied to a logged-in session). Unlike Grow/Meshulam (a static shared
// secret header), PayPal webhooks must be verified with PayPal's own
// verify-webhook-signature API — there's no per-request secret to check
// locally, so a stolen/forged POST can't be told apart from a real one
// without calling PayPal back.
//
// Grants mirror the existing two flows exactly, just triggered by USD
// amount instead of which URL was hit (PayPal's capture-completed payload
// doesn't reliably include the order's line-item name, but it always
// includes the captured amount, and the two products have different,
// fixed prices):
//   $97  -> same grant as grow-payment-webhook: one bot_key via
//           user_tool_access, scoped to *this* user's own
//           diagnosis_output.recommended_tool.
//   $250 -> same grant as meshulam-payment-webhook: profiles.plan = 'paid'
//           (+ student_enrollments row, + invite if no account exists yet).
//
// PayPal's exact capture-webhook payload shape (whether payer.email_address
// rides along on the capture resource itself, or only on the parent order)
// wasn't confirmed against a real transaction while building this — same
// "defensive field-picking, log loudly on the unexpected case" approach
// already used for Grow.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, paypal-transmission-id, paypal-transmission-time, paypal-transmission-sig, paypal-cert-url, paypal-auth-algo",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SINGLE_TOOL_USD = 97;
const FULL_MENTOR_USD = 250;
const AMOUNT_TOLERANCE = 0.5; // guards against $97.00 vs $97 string/float formatting differences

const PAYPAL_API_BASE = "https://api-m.paypal.com";

async function getPayPalAccessToken(clientId: string, clientSecret: string): Promise<string | null> {
  const resp = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  if (!resp.ok) {
    console.error("paypal-webhook: oauth token request failed", resp.status, await resp.text());
    return null;
  }
  const data = await resp.json();
  return data.access_token ?? null;
}

async function verifyWebhookSignature(
  accessToken: string,
  webhookId: string,
  headers: Headers,
  rawBody: string,
): Promise<boolean> {
  const verifyBody = {
    auth_algo: headers.get("paypal-auth-algo"),
    cert_url: headers.get("paypal-cert-url"),
    transmission_id: headers.get("paypal-transmission-id"),
    transmission_sig: headers.get("paypal-transmission-sig"),
    transmission_time: headers.get("paypal-transmission-time"),
    webhook_id: webhookId,
    webhook_event: JSON.parse(rawBody),
  };
  const resp = await fetch(`${PAYPAL_API_BASE}/v1/notifications/verify-webhook-signature`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify(verifyBody),
  });
  if (!resp.ok) {
    console.error("paypal-webhook: verify-signature call failed", resp.status, await resp.text());
    return false;
  }
  const data = await resp.json();
  return data.verification_status === "SUCCESS";
}

function pickAmountUsd(resource: any): number | null {
  const value = resource?.amount?.value ?? resource?.seller_receivable_breakdown?.gross_amount?.value;
  const currency = resource?.amount?.currency_code ?? resource?.seller_receivable_breakdown?.gross_amount?.currency_code;
  if (value == null || currency !== "USD") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function pickOrderId(resource: any): string | null {
  const cand = resource?.supplementary_data?.related_ids?.order_id;
  return typeof cand === "string" ? cand : null;
}

async function fetchOrderPayerEmail(accessToken: string, orderId: string): Promise<string | null> {
  const resp = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders/${orderId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!resp.ok) {
    console.error("paypal-webhook: order lookup failed", resp.status, await resp.text());
    return null;
  }
  const order = await resp.json();
  const email = order?.payer?.email_address;
  return typeof email === "string" ? email.trim().toLowerCase() : null;
}

// ===== purchase confirmation helpers: begin =====
// Identical block in grow-payment-webhook and paypal-payment-webhook (separate edge functions, no shared
// module in the deploy path) — keep the two copies in step.
//
// logPaymentEvent: every outcome goes to payment_grant_events so a payment that grants nothing is visible
// in the admin dashboard instead of only in function logs. sendAccessEmail: the confirmation with the tool
// link (Brevo through the same connector gateway signup-send-otp uses). Neither may ever throw: the
// webhook must still answer 200 and the access grant must not depend on an email or a log row.
const SITE_URL = "https://therapykeys.co.il";

const TOOL_LABELS: Record<"he" | "en", Record<string, string>> = {
  he: {
    "niche-finder": "מציאת הנישה",
    "pricing-calculator": "מחשבון התמחור",
    "self-presentation": "הצגה עצמית",
    "contact-finder": "מציאת אנשי קשר להפניות",
    "connection-bridge": "גשר הקשר",
    "first-call-practice": "תרגול שיחת הטלפון הראשונה",
  },
  en: {
    "niche-finder": "Finding your niche",
    "pricing-calculator": "The pricing calculator",
    "self-presentation": "Self-presentation",
    "contact-finder": "Finding referral contacts",
    "connection-bridge": "The connection bridge",
    "first-call-practice": "First-call practice",
  },
};

function toolLink(tool: string, lang: "he" | "en"): string {
  return `${SITE_URL}${lang === "en" ? "/en" : ""}/ai-assistants/${tool}`;
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function buildAccessEmail(tool: string, lang: "he" | "en", payerEmail: string, hasReplyTo: boolean) {
  const label = TOOL_LABELS[lang][tool] ?? tool;
  const link = toolLink(tool, lang);
  const email = escapeHtml(payerEmail);
  const he = lang === "he";
  const subject = he ? `הכלי שרכשת מוכן: ${label}` : `Your tool is ready: ${label}`;
  const title = he ? "התשלום התקבל, והכלי שלך מוכן" : "Payment received, your tool is ready";
  const intro = he ? `פתחנו עבורך את הכלי <b>${escapeHtml(label)}</b>.` : `We have opened <b>${escapeHtml(label)}</b> for you.`;
  const button = he ? "לפתיחת הכלי" : "Open the tool";
  const loginNote = he
    ? `הכניסה היא עם האימייל שאיתו נרשמת: <b dir="ltr">${email}</b>. אם הדף עדיין לא מציג את הכלי, כדאי לרענן אותו אחרי דקה. הכלי זמין גם בדף הכלים באתר.`
    : `Sign in with the email you registered with: <b>${email}</b>. If the page does not show the tool yet, refresh it after a minute. The tool is also in the tools page on the site.`;
  const help = he
    ? (hasReplyTo ? "אם משהו לא עובד, אפשר להשיב למייל הזה." : "אם משהו לא עובד, אפשר לפנות אלינו דרך האתר.")
    : (hasReplyTo ? "If anything does not work, just reply to this email." : "If anything does not work, contact us through the site.");
  const footer = he ? "על שפת הקליניקה" : "TherapyKeys";
  const html = `<!doctype html><html lang="${he ? "he" : "en"}" dir="${he ? "rtl" : "ltr"}"><body style="margin:0;background:#faf7f2;font-family:Arial,Helvetica,sans-serif;color:#1e1a18">
<div style="max-width:520px;margin:0 auto;padding:24px">
<div style="background:#fff;border:1px solid #e6dfd6;border-radius:10px;padding:24px">
<h1 style="margin:0 0 12px;font-size:20px;color:#4b0b24">${title}</h1>
<p style="margin:0 0 16px;font-size:15px;line-height:1.6">${intro}</p>
<p style="margin:0 0 20px"><a href="${link}" style="display:inline-block;background:#4b0b24;color:#fff;text-decoration:none;padding:12px 22px;border-radius:8px;font-size:15px">${button}</a></p>
<p style="margin:0 0 12px;font-size:13px;line-height:1.6;color:#6b625c">${loginNote}</p>
<p style="margin:0;font-size:13px;line-height:1.6;color:#6b625c">${help}</p>
</div>
<p style="text-align:center;font-size:12px;color:#9a918a;margin:14px 0 0">${footer} · therapykeys.co.il</p>
</div></body></html>`;
  const text = he
    ? `התשלום התקבל, והכלי שלך מוכן: ${label}\n\nלפתיחת הכלי: ${link}\n\nהכניסה היא עם האימייל שאיתו נרשמת: ${payerEmail}\n${help}`
    : `Payment received, your tool is ready: ${label}\n\nOpen it: ${link}\n\nSign in with the email you registered with: ${payerEmail}\n${help}`;
  return { subject, html, text, link };
}

async function sendAccessEmail(to: string, tool: string, lang: "he" | "en"): Promise<{ ok: boolean; error?: string }> {
  try {
    const lovableKey = Deno.env.get("LOVABLE_API_KEY");
    const brevoKey = Deno.env.get("BREVO_API_KEY");
    if (!lovableKey || !brevoKey) return { ok: false, error: "missing_email_secrets" };
    const replyTo = Deno.env.get("PURCHASE_REPLY_TO") ?? "";
    const m = buildAccessEmail(tool, lang, to, !!replyTo);
    const res = await fetch("https://connector-gateway.lovable.dev/brevo/smtp/email", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${lovableKey}`, "X-Connection-Api-Key": brevoKey },
      body: JSON.stringify({
        sender: { name: Deno.env.get("SIGNUP_OTP_SENDER_NAME") ?? "TherapyKeys", email: Deno.env.get("SIGNUP_OTP_SENDER_EMAIL") ?? "noreply@therapykeys.co.il" },
        ...(replyTo ? { replyTo: { email: replyTo } } : {}),
        to: [{ email: to }],
        subject: m.subject,
        htmlContent: m.html,
        textContent: m.text,
      }),
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return { ok: false, error: `brevo_${res.status}: ${(await res.text()).slice(0, 200)}` };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e).slice(0, 200) };
  }
}

async function logPaymentEvent(
  admin: any,
  row: {
    provider: "grow" | "paypal";
    transaction_id: string | null;
    payer_email: string | null;
    user_id?: string | null;
    tool?: string | null;
    outcome: string;
    email_sent?: boolean;
    email_error?: string | null;
    detail?: Record<string, unknown> | null;
  },
): Promise<void> {
  try {
    const { error } = await admin.from("payment_grant_events").insert({
      provider: row.provider,
      transaction_id: row.transaction_id,
      payer_email: row.payer_email,
      user_id: row.user_id ?? null,
      tool: row.tool ?? null,
      outcome: row.outcome,
      email_sent: row.email_sent ?? false,
      email_error: row.email_error ?? null,
      detail: row.detail ?? null,
    });
    // A retried webhook hits the unique (provider, transaction_id, outcome) index: that is fine.
    if (error && !String(error.message).includes("duplicate key")) console.error("payment_grant_events insert failed:", error);
  } catch (e) {
    console.error("payment_grant_events insert threw:", e);
  }
}
// ===== purchase confirmation helpers: end =====

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const clientId = Deno.env.get("PAYPAL_CLIENT_ID");
    const clientSecret = Deno.env.get("PAYPAL_CLIENT_SECRET");
    const webhookId = Deno.env.get("PAYPAL_WEBHOOK_ID");
    if (!clientId || !clientSecret || !webhookId) {
      console.error("paypal-webhook: missing PAYPAL_CLIENT_ID/PAYPAL_CLIENT_SECRET/PAYPAL_WEBHOOK_ID");
      return new Response(JSON.stringify({ error: "Not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const rawBody = await req.text();
    const accessToken = await getPayPalAccessToken(clientId, clientSecret);
    if (!accessToken) {
      return new Response(JSON.stringify({ error: "PayPal auth failed" }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const verified = await verifyWebhookSignature(accessToken, webhookId, req.headers, rawBody);
    if (!verified) {
      console.warn("paypal-webhook: signature verification failed");
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const event = JSON.parse(rawBody);
    console.log("paypal-webhook event:", event.event_type);

    if (event.event_type !== "PAYMENT.CAPTURE.COMPLETED") {
      // Not an error — PayPal sends many event types to the same webhook URL.
      return new Response(JSON.stringify({ ok: true, note: "ignored_event_type" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const resource = event.resource ?? {};
    const captureId: string | null = typeof resource.id === "string" ? resource.id : null;
    const amountUsd = pickAmountUsd(resource);

    let email: string | null =
      typeof resource?.payer?.email_address === "string" ? resource.payer.email_address.trim().toLowerCase() : null;
    if (!email) {
      const orderId = pickOrderId(resource);
      if (orderId) email = await fetchOrderPayerEmail(accessToken, orderId);
    }

    if (!email) {
      console.error("paypal-webhook: no payer email found", JSON.stringify(resource));
      return new Response(JSON.stringify({ error: "Missing payer email" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (amountUsd == null) {
      console.error("paypal-webhook: no USD amount found", JSON.stringify(resource));
      return new Response(JSON.stringify({ error: "Missing amount" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const isSingleTool = Math.abs(amountUsd - SINGLE_TOOL_USD) <= AMOUNT_TOLERANCE;
    const isFullMentor = Math.abs(amountUsd - FULL_MENTOR_USD) <= AMOUNT_TOLERANCE;

    if (!isSingleTool && !isFullMentor) {
      console.error("paypal-webhook: unrecognized amount, manual follow-up needed", amountUsd, email);
      await logPaymentEvent(admin, { provider: "paypal", transaction_id: captureId, payer_email: email, outcome: "unrecognized_amount", detail: { amount_usd: amountUsd } });
      return new Response(JSON.stringify({ ok: true, note: "unrecognized_amount_manual_followup_needed" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // --- Single-tool purchase ($97) — mirrors grow-payment-webhook exactly. ---
    if (isSingleTool) {
      if (captureId) {
        const { data: existing } = await admin
          .from("user_tool_access")
          .select("id").eq("source", "paypal_single_tool").eq("transaction_id", captureId)
          .maybeSingle();
        if (existing) {
          return new Response(JSON.stringify({ ok: true, note: "already_processed" }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }

      const { data: profile } = await admin.from("profiles").select("id").eq("email", email).maybeSingle();
      if (!profile?.id) {
        console.error("paypal-webhook: no profile found for paying email (single tool)", email);
        await logPaymentEvent(admin, { provider: "paypal", transaction_id: captureId, payer_email: email, outcome: "no_profile" });
        return new Response(JSON.stringify({ ok: true, note: "no_profile_manual_followup_needed" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: journey } = await admin
        .from("therapist_journeys").select("diagnosis_output").eq("user_id", profile.id).maybeSingle();
      const recommendedTool = (journey as any)?.diagnosis_output?.recommended_tool as string | undefined;
      if (!recommendedTool) {
        console.error("paypal-webhook: no recommended_tool on diagnosis for user", profile.id, email);
        await logPaymentEvent(admin, { provider: "paypal", transaction_id: captureId, payer_email: email, user_id: profile.id, outcome: "no_recommendation" });
        return new Response(JSON.stringify({ ok: true, note: "no_recommendation_manual_followup_needed" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { error: insErr } = await admin.from("user_tool_access").insert({
        user_id: profile.id,
        bot_key: recommendedTool,
        source: "paypal_single_tool",
        transaction_id: captureId,
      });
      const duplicate = !!insErr && String(insErr.message).includes("duplicate key");
      if (insErr && !duplicate) {
        console.error("paypal-webhook: insert error:", insErr);
        await logPaymentEvent(admin, { provider: "paypal", transaction_id: captureId, payer_email: email, user_id: profile.id, tool: recommendedTool, outcome: "grant_failed", detail: { message: String(insErr.message) } });
      } else if (duplicate) {
        await logPaymentEvent(admin, { provider: "paypal", transaction_id: captureId, payer_email: email, user_id: profile.id, tool: recommendedTool, outcome: "already_had_tool" });
      } else {
        const mail = await sendAccessEmail(email, recommendedTool, "en");
        await logPaymentEvent(admin, { provider: "paypal", transaction_id: captureId, payer_email: email, user_id: profile.id, tool: recommendedTool, outcome: "granted", email_sent: mail.ok, email_error: mail.error ?? null });
      }

      return new Response(JSON.stringify({ ok: true, granted: recommendedTool }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // --- Full Mentor purchase ($250) — mirrors meshulam-payment-webhook. ---
    const notesKey = captureId ? `paypal:${captureId}` : `paypal:manual:${Date.now()}`;
    const { data: existingEnroll } = await admin
      .from("student_enrollments").select("id").eq("notes", notesKey).maybeSingle();
    if (existingEnroll) {
      return new Response(JSON.stringify({ ok: true, note: "already_processed" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: profile } = await admin.from("profiles").select("id").eq("email", email).maybeSingle();

    if (profile?.id) {
      const { error: upErr } = await admin
        .from("profiles")
        .update({ plan: "paid", plan_updated_at: new Date().toISOString() })
        .eq("id", profile.id);
      if (upErr) console.error("paypal-webhook: plan update error:", upErr);
    }

    const { error: enrollErr } = await admin.from("student_enrollments").insert({
      email,
      full_name: null,
      course_key: "turning_point",
      pending_role: "course_member",
      pending_mentor: true,
      notes: notesKey,
    });
    if (enrollErr) console.error("paypal-webhook: enrollment insert error:", enrollErr);

    if (!profile?.id) {
      const { data: users } = await admin.auth.admin.listUsers();
      const has = users?.users?.some((u) => u.email?.toLowerCase() === email);
      if (!has) {
        await admin.auth.admin.inviteUserByEmail(email, {
          redirectTo: "https://therapykeys.co.il/en/auth?mode=reset",
        }).catch((e) => console.error("paypal-webhook: invite error:", e));
      }
    }

    return new Response(JSON.stringify({ ok: true, granted: "full_mentor" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("paypal-webhook fatal:", err);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
