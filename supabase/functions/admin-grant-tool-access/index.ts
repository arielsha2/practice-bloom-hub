// Admin-only: give a user access to one or several Mentor tools by hand (a payment made outside the automatic
// Grow flow, a gift, a fix after a payment under another email), list what a user already has, or take a grant
// back. Writes the same user_tool_access rows the Grow webhook writes (source 'manual_admin'), so the tools
// open exactly as after a purchase. Each grant and revoke is also recorded in payment_grant_events
// (provider 'manual', resolved) as an audit trail of who did what.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ===== core: begin (pure logic, unit-tested with injected dependencies) =====
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const TOOL_KEYS = [
  "niche-finder",
  "pricing-calculator",
  "self-presentation",
  "contact-finder",
  "connection-bridge",
  "first-call-practice",
];

const TOOL_LABELS_HE: Record<string, string> = {
  "niche-finder": "מציאת הנישה",
  "pricing-calculator": "מחשבון התמחור",
  "self-presentation": "הצגה עצמית",
  "contact-finder": "מציאת אנשי קשר להפניות",
  "connection-bridge": "גשר הקשר",
  "first-call-practice": "תרגול שיחת הטלפון הראשונה",
};

const SITE_URL = "https://therapykeys.co.il";
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export function buildManualAccessEmail(keys: string[], payerEmail: string, hasReplyTo: boolean) {
  const labels = keys.map((k) => TOOL_LABELS_HE[k] ?? k);
  const links = keys.map((k) => `${SITE_URL}/ai-assistants/${k}`);
  const single = keys.length === 1;
  const subject = single ? `הכלי שלך מוכן: ${labels[0]}` : `הכלים שלך ב-TherapyKeys מוכנים`;
  const intro = single
    ? `פתחנו עבורך את הכלי <b>${escapeHtml(labels[0])}</b>.`
    : `פתחנו עבורך ${keys.length} כלים:`;
  const rows = keys
    .map(
      (k, i) =>
        `<p style="margin:0 0 10px"><a href="${links[i]}" style="display:inline-block;background:#4b0b24;color:#fff;text-decoration:none;padding:11px 20px;border-radius:8px;font-size:15px">${escapeHtml(labels[i])}</a></p>`,
    )
    .join("\n");
  const help = hasReplyTo ? "אם משהו לא עובד, אפשר להשיב למייל הזה." : "אם משהו לא עובד, אפשר לפנות אלינו דרך האתר.";
  const html = `<!doctype html><html lang="he" dir="rtl"><body style="margin:0;background:#faf7f2;font-family:Arial,Helvetica,sans-serif;color:#1e1a18">
<div style="max-width:520px;margin:0 auto;padding:24px">
<div style="background:#fff;border:1px solid #e6dfd6;border-radius:10px;padding:24px">
<h1 style="margin:0 0 12px;font-size:20px;color:#4b0b24">${single ? "הכלי שלך מוכן" : "הכלים שלך מוכנים"}</h1>
<p style="margin:0 0 16px;font-size:15px;line-height:1.6">${intro}</p>
${rows}
<p style="margin:16px 0 12px;font-size:13px;line-height:1.6;color:#6b625c">הכניסה היא עם האימייל שאיתו נרשמת: <b dir="ltr">${escapeHtml(payerEmail)}</b>. הכלים זמינים גם בדף הכלים באתר.</p>
<p style="margin:0;font-size:13px;line-height:1.6;color:#6b625c">${help}</p>
</div>
<p style="text-align:center;font-size:12px;color:#9a918a;margin:14px 0 0">על שפת הקליניקה · therapykeys.co.il</p>
</div></body></html>`;
  const text = `${single ? "הכלי שלך מוכן" : "הכלים שלך מוכנים"}: ${labels.join(", ")}\n\n${links.map((l, i) => `${labels[i]}: ${l}`).join("\n")}\n\nהכניסה היא עם האימייל שאיתו נרשמת: ${payerEmail}\n${help}`;
  return { subject, html, text, links };
}

export interface Grant { bot_key: string; source: string; granted_at: string }
export interface Profile { id: string; email: string | null; display_name: string | null }
export interface Deps {
  getCaller(authHeader: string): Promise<{ id: string } | null>;
  isAdmin(userId: string): Promise<boolean>;
  findProfile(userId: string): Promise<Profile | null>;
  listGrants(userId: string): Promise<Grant[]>;
  insertGrants(userId: string, keys: string[]): Promise<string[]>; // returns the keys actually inserted
  deleteGrant(userId: string, key: string): Promise<boolean>;
  logEvent(row: Record<string, unknown>): Promise<void>;
  sendEmail(to: string, keys: string[]): Promise<{ ok: boolean; error?: string }>;
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

export async function handle(req: Request, deps: Deps): Promise<Response> {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  const authHeader = req.headers.get("Authorization") ?? "";
  if (!authHeader.startsWith("Bearer ")) return json({ error: "unauthorized" }, 401);
  const caller = await deps.getCaller(authHeader);
  if (!caller) return json({ error: "unauthorized" }, 401);
  if (!(await deps.isAdmin(caller.id))) return json({ error: "forbidden" }, 403);

  const body = await req.json().catch(() => ({} as Record<string, unknown>));
  const action = String(body?.action ?? "");
  const userId = String(body?.user_id ?? "").trim();
  if (!["list", "grant", "revoke"].includes(action)) return json({ error: "invalid_action" }, 400);
  if (!UUID_RE.test(userId)) return json({ error: "invalid_user_id" }, 400);

  const profile = await deps.findProfile(userId);
  if (!profile) return json({ error: "user_not_found" }, 404);

  if (action === "list") {
    return json({ profile: { email: profile.email, display_name: profile.display_name }, grants: await deps.listGrants(userId) });
  }

  if (action === "revoke") {
    const key = String(body?.bot_key ?? "");
    if (!TOOL_KEYS.includes(key)) return json({ error: "invalid_bot_key" }, 400);
    const removed = await deps.deleteGrant(userId, key);
    if (removed) {
      await deps.logEvent({ provider: "manual", payer_email: profile.email, user_id: userId, tool: key, outcome: "revoked", resolved: true, detail: { by: caller.id } });
    }
    return json({ revoked: removed });
  }

  // grant
  const rawKeys = Array.isArray(body?.bot_keys) ? (body.bot_keys as unknown[]).map(String) : [];
  const keys = [...new Set(rawKeys)];
  if (keys.length === 0 || keys.length > TOOL_KEYS.length) return json({ error: "invalid_bot_keys" }, 400);
  if (keys.some((k) => !TOOL_KEYS.includes(k))) return json({ error: "invalid_bot_keys" }, 400);

  const inserted = await deps.insertGrants(userId, keys);
  const already = keys.filter((k) => !inserted.includes(k));

  const wantsEmail = body?.send_email === true;
  let emailSent = false;
  let emailError: string | null = null;
  if (inserted.length > 0 && wantsEmail) {
    if (!profile.email) emailError = "no_email_on_profile";
    else {
      const r = await deps.sendEmail(profile.email, inserted);
      emailSent = r.ok;
      emailError = r.ok ? null : r.error ?? "send_failed";
    }
  }
  for (const key of inserted) {
    await deps.logEvent({
      provider: "manual", payer_email: profile.email, user_id: userId, tool: key, outcome: "granted", resolved: true,
      email_sent: emailSent, email_error: emailError, detail: { by: caller.id, emailed: wantsEmail },
    });
  }
  return json({ granted: inserted, already, email: { requested: wantsEmail && inserted.length > 0, sent: emailSent, error: emailError } });
}
// ===== core: end =====

// ----- wiring (not unit-tested; thin) -----
async function sendEmailViaBrevo(to: string, keys: string[]): Promise<{ ok: boolean; error?: string }> {
  try {
    const lovableKey = Deno.env.get("LOVABLE_API_KEY");
    const brevoKey = Deno.env.get("BREVO_API_KEY");
    if (!lovableKey || !brevoKey) return { ok: false, error: "missing_email_secrets" };
    const replyTo = Deno.env.get("PURCHASE_REPLY_TO") ?? "";
    const m = buildManualAccessEmail(keys, to, !!replyTo);
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

if (typeof Deno !== "undefined" && Deno.serve && Deno.env.get("SUPABASE_URL")) {
  const url = Deno.env.get("SUPABASE_URL")!;
  const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
  const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const deps: Deps = {
    async getCaller(authHeader) {
      const c = createClient(url, anon, { global: { headers: { Authorization: authHeader } } });
      const { data, error } = await c.auth.getUser();
      return error || !data?.user ? null : { id: data.user.id };
    },
    async isAdmin(userId) {
      const { data, error } = await admin.rpc("has_role", { _user_id: userId, _role: "admin" });
      return !error && data === true;
    },
    async findProfile(userId) {
      const { data } = await admin.from("profiles").select("id, email, display_name").eq("id", userId).maybeSingle();
      return (data as Profile | null) ?? null;
    },
    async listGrants(userId) {
      const { data } = await admin.from("user_tool_access").select("bot_key, source, granted_at").eq("user_id", userId).order("granted_at", { ascending: false });
      return (data ?? []) as Grant[];
    },
    async insertGrants(userId, keys) {
      // ON CONFLICT DO NOTHING on (user_id, bot_key): keys the user already has are simply not returned.
      const { data, error } = await admin
        .from("user_tool_access")
        .upsert(keys.map((bot_key) => ({ user_id: userId, bot_key, source: "manual_admin" })), { onConflict: "user_id,bot_key", ignoreDuplicates: true })
        .select("bot_key");
      if (error) throw error;
      return (data ?? []).map((r: { bot_key: string }) => r.bot_key);
    },
    async deleteGrant(userId, key) {
      const { data, error } = await admin.from("user_tool_access").delete().eq("user_id", userId).eq("bot_key", key).select("id");
      if (error) throw error;
      return (data ?? []).length > 0;
    },
    async logEvent(row) {
      const { error } = await admin.from("payment_grant_events").insert(row);
      if (error) console.error("payment_grant_events insert failed:", error);
    },
    sendEmail: sendEmailViaBrevo,
  };
  Deno.serve(async (req) => {
    try {
      return await handle(req, deps);
    } catch (e) {
      console.error("admin-grant-tool-access error:", e);
      return json({ error: "internal" }, 500);
    }
  });
}
