// Public Grow (pay.grow.link) webhook for the discounted single-tool
// purchase — separate from meshulam-payment-webhook, which grants the full
// Mentor bundle. This one grants access to exactly one bot_key: whichever
// tool that specific user's own diagnosis already recommended
// (therapist_journeys.diagnosis_output.recommended_tool), not a fixed tool
// baked into the payment link. Idempotent via the unique (source,
// transaction_id) index on user_tool_access.
//
// Field names follow Grow's webhook documentation (payerEmail, transactionCode, paymentSum), read
// defensively (see the "grow payload helpers" block). No real webhook has been received yet: the first
// one should be checked against the payment_grant_events row, whose detail holds the payload keys.
//
// The webhook configured on the Grow account fires for EVERY transaction, so a payment only opens a tool
// when its amount is a single-tool price (₪98 / ₪290); any other amount is logged as unrecognized_amount.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-grow-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// ===== grow payload helpers: begin =====
// Identical block in grow-payment-webhook and meshulam-payment-webhook (separate edge functions, no shared
// module in the deploy path) — keep the two copies in step.
//
// Grow documents these fields in its webhook body: transactionCode, paymentSum, paymentDate, asmachta, fullName,
// payerEmail (at the top level or under "data"). A form-encoded body can arrive with bracket keys
// ("data[payerEmail]"); unbracket() turns those back into nesting. The webhook set up on the Grow account is
// for ALL transactions, so the product is decided by the AMOUNT paid, never by which link was used: anything
// that is not a known price must not open anything.
const SINGLE_TOOL_SUMS_ILS = [98, 290];
const FULL_MENTOR_SUM_ILS = 750;
const SUM_TOLERANCE_ILS = 0.5;

function unbracket(flat: Record<string, any>): Record<string, any> {
  const out: Record<string, any> = {};
  for (const [key, value] of Object.entries(flat)) {
    const m = key.match(/^([^\[\]]+)((?:\[[^\]]*\])+)$/);
    if (!m) { out[key] = value; continue; }
    const path = [m[1], ...[...m[2].matchAll(/\[([^\]]*)\]/g)].map((x) => x[1])];
    let cur: Record<string, any> = out;
    path.forEach((seg, i) => {
      if (i === path.length - 1) cur[seg] = value;
      else {
        if (typeof cur[seg] !== "object" || cur[seg] === null) cur[seg] = {};
        cur = cur[seg];
      }
    });
  }
  return out;
}

function growField(p: any, names: string[]): unknown {
  for (const scope of [p, p?.data, p?.payload]) {
    if (!scope || typeof scope !== "object") continue;
    for (const name of names) {
      const v = scope[name];
      if (v !== undefined && v !== null && v !== "") return v;
    }
  }
  return null;
}

function growEmail(p: any): string | null {
  const v = growField(p, ["payerEmail", "email", "payer_email", "customerEmail", "customer_email", "buyer_email"]) ?? p?.user?.email;
  return typeof v === "string" && v.includes("@") ? v.trim().toLowerCase() : null;
}

function growTxn(p: any): string | null {
  const v = growField(p, ["transactionCode", "transactionId", "transaction_id", "txn_id", "orderId", "order_id", "asmachta", "id"]);
  return v == null ? null : String(v);
}

function growName(p: any): string | null {
  const v = growField(p, ["fullName", "full_name", "payerName", "payer_name", "first_name"]);
  return typeof v === "string" ? v : null;
}

function growSum(p: any): number | null {
  const raw = growField(p, ["paymentSum", "sum", "paymentAmount", "amount"]);
  if (raw == null) return null;
  const n = typeof raw === "number" ? raw : Number(String(raw).replace(",", ".").replace(/[^0-9.\-]/g, ""));
  return Number.isFinite(n) ? n : null;
}

const sumMatches = (n: number | null, expected: number[]) => n != null && expected.some((s) => Math.abs(n - s) <= SUM_TOLERANCE_ILS);
const isSingleToolSum = (n: number | null) => sumMatches(n, SINGLE_TOOL_SUMS_ILS);
const isFullMentorSum = (n: number | null) => sumMatches(n, [FULL_MENTOR_SUM_ILS]);
// ===== grow payload helpers: end =====

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
      payload = unbracket(payload);
    }
    console.log("grow-webhook payload keys:", Object.keys(payload));

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const email = growEmail(payload);
    const transaction_id = growTxn(payload);
    const sum = growSum(payload);
    // Kept on every event row so the first real webhooks can be checked without reading function logs.
    const eventDetail = { sum_ils: sum, payload_keys: Object.keys(payload) };

    if (!email) {
      console.error("grow-webhook: no email found in payload", JSON.stringify(payload));
      await logPaymentEvent(admin, { provider: "grow", transaction_id, payer_email: null, outcome: "no_email", detail: eventDetail });
      return new Response(JSON.stringify({ error: "Missing email" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // This webhook may be attached to the whole Grow account: only a single-tool price opens a tool.
    if (!isSingleToolSum(sum)) {
      console.error("grow-webhook: unrecognized amount, manual follow-up needed", sum, email);
      await logPaymentEvent(admin, { provider: "grow", transaction_id, payer_email: email, outcome: "unrecognized_amount", detail: eventDetail });
      return new Response(JSON.stringify({ ok: true, note: "unrecognized_amount_manual_followup_needed" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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
      await logPaymentEvent(admin, { provider: "grow", transaction_id: transaction_id ?? null, payer_email: email, outcome: "no_profile", detail: eventDetail });
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
      await logPaymentEvent(admin, { provider: "grow", transaction_id: transaction_id ?? null, payer_email: email, user_id: profile.id, outcome: "no_recommendation", detail: eventDetail });
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
      await logPaymentEvent(admin, { provider: "grow", transaction_id: transaction_id ?? null, payer_email: email, user_id: profile.id, tool: recommendedTool, outcome: "grant_failed", detail: { ...eventDetail, message: String(insErr.message) } });
    } else if (duplicate) {
      // Already owned: no second confirmation email.
      await logPaymentEvent(admin, { provider: "grow", transaction_id: transaction_id ?? null, payer_email: email, user_id: profile.id, tool: recommendedTool, outcome: "already_had_tool", detail: eventDetail });
    } else {
      const mail = await sendAccessEmail(email, recommendedTool, "he");
      await logPaymentEvent(admin, { provider: "grow", transaction_id: transaction_id ?? null, payer_email: email, user_id: profile.id, tool: recommendedTool, outcome: "granted", email_sent: mail.ok, email_error: mail.error ?? null, detail: eventDetail });
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
