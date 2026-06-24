// Verifies the 6-digit OTP, creates the auth user if needed, and returns a session.
// Public endpoint: verify_jwt = false.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const MAX_ATTEMPTS = 5;

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function jsonResp(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return jsonResp({ error: "method_not_allowed" }, 405);

  try {
    const body = await req.json().catch(() => ({}));
    const email = String(body.email ?? "").trim().toLowerCase();
    const code = String(body.code ?? "").trim();
    const name = body.name ? String(body.name).trim().slice(0, 100) : null;
    const mailingConsent = body.mailing_list_consent === true;

    if (!email || !/^\d{6}$/.test(code)) {
      return jsonResp({ error: "invalid_input" }, 400);
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: row, error: fetchErr } = await admin
      .from("signup_otp_codes")
      .select("id, code_hash, expires_at, consumed_at, attempts")
      .eq("email", email)
      .is("consumed_at", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (fetchErr || !row) return jsonResp({ error: "no_active_code" }, 400);

    if (new Date(row.expires_at).getTime() < Date.now()) {
      return jsonResp({ error: "expired" }, 400);
    }
    if (row.attempts >= MAX_ATTEMPTS) {
      return jsonResp({ error: "too_many_attempts" }, 429);
    }

    const expected = await sha256Hex(`${email}:${code}`);
    if (expected !== row.code_hash) {
      await admin
        .from("signup_otp_codes")
        .update({ attempts: row.attempts + 1 })
        .eq("id", row.id);
      return jsonResp({ error: "invalid_code" }, 400);
    }

    // Mark consumed.
    await admin
      .from("signup_otp_codes")
      .update({ consumed_at: new Date().toISOString() })
      .eq("id", row.id);

    // Find or create user.
    let userId: string | null = null;
    let isNewUser = false;

    // List then filter (admin.listUsers supports email filter via query param in newer SDKs)
    const { data: existing } = await admin.auth.admin.listUsers({
      page: 1,
      perPage: 200,
    });
    const found = existing?.users?.find((u) => u.email?.toLowerCase() === email);

    if (found) {
      userId = found.id;
      if (!found.email_confirmed_at) {
        await admin.auth.admin.updateUserById(found.id, { email_confirm: true });
      }
    } else {
      const { data: created, error: createErr } = await admin.auth.admin.createUser({
        email,
        email_confirm: true,
        user_metadata: {
          display_name: name,
          mailing_list_consent: mailingConsent,
        },
      });
      if (createErr || !created.user) {
        console.error("createUser failed", createErr);
        return jsonResp({ error: "create_failed" }, 500);
      }
      userId = created.user.id;
      isNewUser = true;
    }

    // Mint a session via magiclink → verifyOtp using the token_hash.
    const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
      type: "magiclink",
      email,
    });
    if (linkErr || !linkData?.properties?.hashed_token) {
      console.error("generateLink failed", linkErr);
      return jsonResp({ error: "session_failed" }, 500);
    }

    return jsonResp({
      ok: true,
      is_new_user: isNewUser,
      user_id: userId,
      token_hash: linkData.properties.hashed_token,
      verification_type: "magiclink",
    });
  } catch (err) {
    console.error("signup-verify-otp error", err);
    return jsonResp({ error: "internal" }, 500);
  }
});
