import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

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
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    const adminId = userData?.user?.id;
    if (userErr || !adminId) return json({ error: "unauthorized" }, 401);

    const admin = createClient(supaUrl, serviceKey);

    // Verify caller is admin
    const { data: isAdmin, error: roleErr } = await admin.rpc("has_role", {
      _user_id: adminId,
      _role: "admin",
    });
    if (roleErr || !isAdmin) return json({ error: "forbidden" }, 403);

    const body = await req.json().catch(() => ({} as any));
    const targetUserId = String(body?.user_id ?? "").trim();
    const newPlan = String(body?.new_plan ?? "").trim();
    if (!targetUserId || !["paid", "free"].includes(newPlan)) {
      return json({ error: "invalid_input" }, 400);
    }

    // Read old plan
    const { data: profile, error: profErr } = await admin
      .from("profiles")
      .select("plan")
      .eq("id", targetUserId)
      .maybeSingle();
    if (profErr) return json({ error: "lookup_failed" }, 500);
    const oldPlan = profile?.plan ?? null;

    if (oldPlan === newPlan) {
      return json({ ok: true, unchanged: true });
    }

    // Audit log first (best-effort: if it fails, abort)
    const { error: auditErr } = await admin.from("plan_changes").insert({
      user_id: targetUserId,
      changed_by: adminId,
      old_plan: oldPlan,
      new_plan: newPlan,
      source: "admin",
    });
    if (auditErr) {
      console.error("plan_changes insert failed:", auditErr);
      return json({ error: "audit_failed" }, 500);
    }

    // Apply change
    const updates: Record<string, unknown> = {
      plan: newPlan,
      plan_updated_at: new Date().toISOString(),
    };
    if (newPlan === "paid") {
      updates.trial_start_date = null;
      updates.trial_reminder_sent_at = null;
    }
    const { error: updErr } = await admin.from("profiles").update(updates).eq("id", targetUserId);
    if (updErr) {
      console.error("profile update failed:", updErr);
      return json({ error: "update_failed" }, 500);
    }

    return json({ ok: true, old_plan: oldPlan, new_plan: newPlan });
  } catch (e) {
    console.error("admin-set-user-plan error:", e);
    return json({ error: "internal_error" }, 500);
  }
});
