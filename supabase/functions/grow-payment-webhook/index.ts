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
    if (insErr && !String(insErr.message).includes("duplicate key")) {
      console.error("grow-webhook: insert error:", insErr);
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
