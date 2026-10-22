// Public Meshulam webhook: validates shared secret header, marks user as paid.
//
// It is the Grow account-wide "after a transaction" webhook, so it is called for EVERY payment in the
// account (single tools, coaching, ...). Only a payment of the full-Mentor price (₪750) may grant the plan;
// any other amount is logged as unrecognized_amount for manual follow-up and changes nothing.
// Idempotent via unique index on profiles.meshulam_transaction_id and
// notes='meshulam:<txn>' on student_enrollments.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-meshulam-secret",
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

// The introductory single-tool price opens the tool for a limited time; the full single-tool price opens it for good.
const TIME_LIMITED_SUM_ILS = 98;
const LIMITED_ACCESS_DAYS = 30;
const isTimeLimitedSum = (n: number | null) => sumMatches(n, [TIME_LIMITED_SUM_ILS]);
const addDays = (from: Date, days: number) => new Date(from.getTime() + days * 86_400_000);
// ===== grow payload helpers: end =====

// Gate rejections go to payment_grant_events (shown in the admin dashboard) instead of only the function logs.
async function logGateEvent(
  admin: any,
  row: { transaction_id: string | null; payer_email: string | null; outcome: string; detail?: Record<string, unknown> | null },
): Promise<void> {
  try {
    const { error } = await admin.from("payment_grant_events").insert({
      provider: "grow",
      transaction_id: row.transaction_id,
      payer_email: row.payer_email,
      outcome: row.outcome,
      detail: row.detail ?? null,
    });
    if (error && !String(error.message).includes("duplicate key")) console.error("payment_grant_events insert failed:", error);
  } catch (e) {
    console.error("payment_grant_events insert threw:", e);
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const expected = Deno.env.get("MESHULAM_WEBHOOK_SECRET");
    // Grow's webhook config UI can't attach custom headers, only a URL —
    // accept the secret from either, same defensive pattern used by
    // grow-payment-webhook and meshulam-payment-handler for the same reason.
    const url = new URL(req.url);
    const got = req.headers.get("x-meshulam-secret") ?? url.searchParams.get("secret");
    if (!expected || !got || got !== expected) {
      console.warn("meshulam-webhook: bad secret");
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
    console.log("meshulam-webhook payload keys:", Object.keys(payload));

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const email = growEmail(payload);
    const transaction_id = growTxn(payload);
    const full_name = growName(payload);
    const sum = growSum(payload);
    const eventDetail = { sum_ils: sum, payload_keys: Object.keys(payload) };

    if (!email) {
      await logGateEvent(admin, { transaction_id, payer_email: null, outcome: "no_email", detail: eventDetail });
      return new Response(JSON.stringify({ error: "Missing email" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Only the full-Mentor price grants the plan; every other amount is somebody else's product.
    if (!isFullMentorSum(sum)) {
      console.warn("meshulam-webhook: amount is not the full-Mentor price, nothing granted", sum, email);
      await logGateEvent(admin, { transaction_id, payer_email: email, outcome: "unrecognized_amount", detail: eventDetail });
      return new Response(JSON.stringify({ ok: true, note: "not_full_mentor_amount" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Idempotency check by transaction id on profiles
    if (transaction_id) {
      const { data: existing } = await admin
        .from("profiles").select("id, plan").eq("meshulam_transaction_id", transaction_id).maybeSingle();
      if (existing) {
        console.log("meshulam-webhook: already processed txn", transaction_id);
        return new Response(JSON.stringify({ ok: true, note: "already_processed" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // 1. Existing user? -> flip plan to paid right now.
    const { data: profile } = await admin
      .from("profiles").select("id").eq("email", email).maybeSingle();

    if (profile?.id) {
      const { error: upErr } = await admin
        .from("profiles")
        .update({
          plan: "paid",
          plan_updated_at: new Date().toISOString(),
          meshulam_transaction_id: transaction_id ?? null,
        })
        .eq("id", profile.id);
      if (upErr) console.error("plan update error:", upErr);
    }

    // 2. Insert / upsert enrollment (so the existing signup trigger also promotes future signups)
    const notesKey = transaction_id ? `meshulam:${transaction_id}` : `meshulam:manual:${Date.now()}`;
    const { data: existingEnroll } = await admin
      .from("student_enrollments").select("id").eq("notes", notesKey).maybeSingle();

    if (!existingEnroll) {
      const { error: enrollErr } = await admin.from("student_enrollments").insert({
        email,
        full_name: full_name || null,
        course_key: "turning_point",
        pending_role: "course_member",
        pending_mentor: true,
        notes: notesKey,
      });
      if (enrollErr) console.error("enrollment insert error:", enrollErr);
    }

    // 3. If no auth user exists -> invite by email so they can set a password and log in.
    if (!profile?.id) {
      const { data: users } = await admin.auth.admin.listUsers();
      const has = users?.users?.some((u) => u.email?.toLowerCase() === email);
      if (!has) {
        await admin.auth.admin.inviteUserByEmail(email, {
          redirectTo: "https://therapykeys.co.il/auth?mode=reset",
        }).catch((e) => console.error("invite error:", e));
      }
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("meshulam-webhook fatal:", err);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
