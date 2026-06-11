// Public Meshulam webhook: validates shared secret header, marks user as paid.
// Idempotent via unique index on profiles.meshulam_transaction_id and
// notes='meshulam:<txn>' on student_enrollments.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-meshulam-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function pickEmail(p: any): string | null {
  const cand = p?.email ?? p?.payer_email ?? p?.customerEmail ?? p?.data?.email ?? p?.user?.email;
  return typeof cand === "string" ? cand.trim().toLowerCase() : null;
}
function pickTxn(p: any): string | null {
  const cand = p?.transaction_id ?? p?.transactionId ?? p?.txn_id ?? p?.data?.transaction_id ?? p?.asmachta;
  return cand == null ? null : String(cand);
}
function pickName(p: any): string | null {
  const cand = p?.full_name ?? p?.fullName ?? p?.payer_name ?? p?.data?.full_name ?? p?.first_name;
  return typeof cand === "string" ? cand : null;
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
    const got = req.headers.get("x-meshulam-secret");
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
    }
    console.log("meshulam-webhook payload keys:", Object.keys(payload));

    const email = pickEmail(payload);
    const transaction_id = pickTxn(payload);
    const full_name = pickName(payload);

    if (!email) {
      return new Response(JSON.stringify({ error: "Missing email" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

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
