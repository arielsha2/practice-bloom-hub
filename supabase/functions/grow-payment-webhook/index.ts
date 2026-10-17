// Public Grow (pay.grow.link) webhook for the discounted single-tool
// purchase — separate from meshulam-payment-webhook, which grants the full
// Mentor bundle. This one grants access to exactly one bot_key: whichever
// tool that specific user's own diagnosis already recommended
// (therapist_journeys.diagnosis_output.recommended_tool), not a fixed tool
// baked into the payment link. Idempotent via the unique (source,
// transaction_id) index on user_tool_access.
//
// Grow's exact webhook payload shape wasn't available while building this —
// field-picking below is deliberately defensive (tries several common key
// names, same pattern as pickEmail/pickTxn in meshulam-payment-webhook)
// rather than trusting one exact vendor format. First real webhook hit
// should be checked against the logs below to confirm the real field names.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-grow-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function pickEmail(p: any): string | null {
  const cand =
    p?.email ?? p?.payer_email ?? p?.customerEmail ?? p?.customer_email ??
    p?.buyer_email ?? p?.data?.email ?? p?.user?.email ?? p?.payload?.email;
  return typeof cand === "string" ? cand.trim().toLowerCase() : null;
}
function pickTxn(p: any): string | null {
  const cand =
    p?.transaction_id ?? p?.transactionId ?? p?.txn_id ?? p?.order_id ??
    p?.orderId ?? p?.payment_id ?? p?.id ?? p?.data?.transaction_id;
  return cand == null ? null : String(cand);
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
    const expected = Deno.env.get("GROW_WEBHOOK_SECRET");
    const url = new URL(req.url);
    const got = req.headers.get("x-grow-secret") ?? url.searchParams.get("secret");
    if (!expected || !got || got !== expected) {
      console.warn("grow-webhook: bad secret");
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let payload: any = {};
    const ct = req.headers.get("content-type") || "";
    if (ct.includes("application/json")) payload = await req.json().catch(() => ({}));
    else {
      const form = await req.formData().catch(() => null);
      if (form) for (const [k, v] of form.entries()) payload[k] = v;
    }
    console.log("grow-webhook payload keys:", Object.keys(payload));

    const email = pickEmail(payload);
    const transaction_id = pickTxn(payload);

    if (!email) {
      console.error("grow-webhook: no email found in payload", JSON.stringify(payload));
      return new Response(JSON.stringify({ error: "Missing email" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Idempotency: this exact transaction already processed.
    if (transaction_id) {
      const { data: existing } = await admin
        .from("user_tool_access")
        .select("id").eq("source", "grow_single_tool").eq("transaction_id", transaction_id)
        .maybeSingle();
      if (existing) {
        console.log("grow-webhook: already processed txn", transaction_id);
        return new Response(JSON.stringify({ ok: true, note: "already_processed" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const { data: profile } = await admin
      .from("profiles").select("id").eq("email", email).maybeSingle();

    if (!profile?.id) {
      // Unlike the full-Mentor Meshulam flow, there's no meaningful tool to
      // grant without knowing whose diagnosis to read — this purchase is
      // only ever offered to someone who already has an account and a
      // completed diagnosis. Log loudly for manual follow-up rather than
      // silently dropping a real payment.
      console.error("grow-webhook: no profile found for paying email", email);
      await logPaymentEvent(admin, { provider: "grow", transaction_id: transaction_id ?? null, payer_email: email, outcome: "no_profile" });
      return new Response(JSON.stringify({ ok: true, note: "no_profile_manual_followup_needed" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: journey } = await admin
      .from("therapist_journeys")
      .select("diagnosis_output")
      .eq("user_id", profile.id)
      .maybeSingle();
    const recommendedTool = (journey as any)?.diagnosis_output?.recommended_tool as string | undefined;

    if (!recommendedTool) {
      console.error("grow-webhook: no recommended_tool on diagnosis for user", profile.id, email);
      await logPaymentEvent(admin, { provider: "grow", transaction_id: transaction_id ?? null, payer_email: email, user_id: profile.id, outcome: "no_recommendation" });
      return new Response(JSON.stringify({ ok: true, note: "no_recommendation_manual_followup_needed" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { error: insErr } = await admin.from("user_tool_access").insert({
      user_id: profile.id,
      bot_key: recommendedTool,
      source: "grow_single_tool",
      transaction_id: transaction_id ?? null,
    });
    // Unique (user_id, bot_key) may already exist (e.g. re-purchase, or a
    // retried webhook without a transaction id) — that's fine, not an error.
    const duplicate = !!insErr && String(insErr.message).includes("duplicate key");
    if (insErr && !duplicate) {
      console.error("grow-webhook: insert error:", insErr);
      await logPaymentEvent(admin, { provider: "grow", transaction_id: transaction_id ?? null, payer_email: email, user_id: profile.id, tool: recommendedTool, outcome: "grant_failed", detail: { message: String(insErr.message) } });
    } else if (duplicate) {
      // Already owned: no second confirmation email.
      await logPaymentEvent(admin, { provider: "grow", transaction_id: transaction_id ?? null, payer_email: email, user_id: profile.id, tool: recommendedTool, outcome: "already_had_tool" });
    } else {
      const mail = await sendAccessEmail(email, recommendedTool, "he");
      await logPaymentEvent(admin, { provider: "grow", transaction_id: transaction_id ?? null, payer_email: email, user_id: profile.id, tool: recommendedTool, outcome: "granted", email_sent: mail.ok, email_error: mail.error ?? null });
    }

    return new Response(JSON.stringify({ ok: true, granted: recommendedTool }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("grow-webhook fatal:", err);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
