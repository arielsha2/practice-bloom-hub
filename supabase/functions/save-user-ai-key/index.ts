import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { encryptSecret, keyHint } from "../_shared/byok-crypto.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) return json({ error: "unauthorized" }, 401);

    const supaUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(supaUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: claims, error: claimsErr } = await userClient.auth.getClaims(token);
    const userId = claims?.claims?.sub;
    if (claimsErr || !userId) return json({ error: "unauthorized" }, 401);

    const body = await req.json().catch(() => ({} as any));
    const action = body?.action ?? "save";
    const admin = createClient(supaUrl, serviceKey);

    if (action === "delete") {
      await admin.from("user_ai_keys").delete().eq("user_id", userId);
      return json({ ok: true });
    }

    const rawKey = String(body?.api_key ?? "").trim();
    if (!rawKey || rawKey.length < 20) return json({ ok: false, error: "invalid_format" }, 400);

    // Validate with a 1-token call to Google's OpenAI-compatible endpoint.
    const testResp = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${rawKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gemini-2.5-flash",
          messages: [{ role: "user", content: "hi" }],
          max_tokens: 1,
        }),
      },
    );

    if (!testResp.ok) {
      const status = testResp.status;
      const text = await testResp.text().catch(() => "");
      console.error("BYOK key validation failed:", status, text.slice(0, 200));
      if (status === 401 || status === 403) return json({ ok: false, error: "invalid_key" }, 400);
      if (status === 429) return json({ ok: false, error: "quota_exhausted" }, 400);
      return json({ ok: false, error: "validation_failed" }, 400);
    }
    await testResp.text().catch(() => "");

    const encrypted = await encryptSecret(rawKey);
    const hint = keyHint(rawKey);

    const { error: upsertErr } = await admin
      .from("user_ai_keys")
      .upsert(
        {
          user_id: userId,
          provider: "gemini",
          encrypted_key: encrypted,
          key_hint: hint,
          last_validated_at: new Date().toISOString(),
          last_error: null,
        },
        { onConflict: "user_id" },
      );

    if (upsertErr) {
      console.error("upsert failed:", upsertErr);
      return json({ ok: false, error: "storage_failed" }, 500);
    }

    return json({ ok: true, hint });
  } catch (e) {
    console.error("save-user-ai-key error:", e);
    return json({ ok: false, error: "internal_error" }, 500);
  }
});
