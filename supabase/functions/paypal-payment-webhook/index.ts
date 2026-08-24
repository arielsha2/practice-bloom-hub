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
        return new Response(JSON.stringify({ ok: true, note: "no_profile_manual_followup_needed" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: journey } = await admin
        .from("therapist_journeys").select("diagnosis_output").eq("user_id", profile.id).maybeSingle();
      const recommendedTool = (journey as any)?.diagnosis_output?.recommended_tool as string | undefined;
      if (!recommendedTool) {
        console.error("paypal-webhook: no recommended_tool on diagnosis for user", profile.id, email);
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
      if (insErr && !String(insErr.message).includes("duplicate key")) {
        console.error("paypal-webhook: insert error:", insErr);
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
