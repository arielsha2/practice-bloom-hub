// Admin-only: give a user (or an email that has no account yet) access to one or several Mentor tools by hand (a payment made outside the automatic
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
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

// Sent when access is granted to an email that has no account yet: it says what was granted and links to the
// sign-up page (which continues to the first tool after sign-up).
export function buildInviteEmail(keys: string[], email: string, hasReplyTo: boolean) {
  const labels = keys.map((k) => TOOL_LABELS_HE[k] ?? k);
  const link = `${SITE_URL}/auth?mode=signup&next=bot:${keys[0]}`;
  const single = keys.length === 1;
  const what = single ? `הכלי <b>${escapeHtml(labels[0])}</b>` : `${keys.length} כלים: <b>${escapeHtml(labels.join(", "))}</b>`;
  const subject = single ? `הוענקה לך גישה ל${labels[0]}` : "הוענקה לך גישה לכלים ב-TherapyKeys";
  const help = hasReplyTo ? "אם משהו לא עובד, אפשר להשיב למייל הזה." : "אם משהו לא עובד, אפשר לפנות אלינו דרך האתר.";
  const html = `<!doctype html><html lang="he" dir="rtl"><body style="margin:0;background:#faf7f2;font-family:Arial,Helvetica,sans-serif;color:#1e1a18">
<div style="max-width:520px;margin:0 auto;padding:24px">
<div style="background:#fff;border:1px solid #e6dfd6;border-radius:10px;padding:24px">
<h1 style="margin:0 0 12px;font-size:20px;color:#4b0b24">הוענקה לך גישה</h1>
<p style="margin:0 0 16px;font-size:15px;line-height:1.6">שמרנו עבורך גישה ל${what}. כדי להפעיל אותה צריך להירשם באתר עם האימייל הזה: <b dir="ltr">${escapeHtml(email)}</b>.</p>
<p style="margin:0 0 20px"><a href="${link}" style="display:inline-block;background:#4b0b24;color:#fff;text-decoration:none;padding:12px 22px;border-radius:8px;font-size:15px">להרשמה ולכניסה לכלי</a></p>
<p style="margin:0 0 12px;font-size:13px;line-height:1.6;color:#6b625c">ההרשמה קצרה: אימייל וקוד אימות. הגישה נפתחת מיד אחריה.</p>
<p style="margin:0;font-size:13px;line-height:1.6;color:#6b625c">${help}</p>
</div>
<p style="text-align:center;font-size:12px;color:#9a918a;margin:14px 0 0">על שפת הקליניקה · therapykeys.co.il</p>
</div></body></html>`;
  const text = `הוענקה לך גישה ל${labels.join(", ")}\n\nכדי להפעיל אותה צריך להירשם באתר עם האימייל ${email}:\n${link}\n\n${help}`;
  return { subject, html, text, link };
}

export interface Grant { bot_key: string; source: string; granted_at: string }
export interface PendingGrant { id: string; email: string; bot_key: string; created_at: string; applied_at: string | null }
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
  // grants by email, for people who have no account yet
  findProfileByEmail(email: string): Promise<Profile | null>;
  listPending(): Promise<PendingGrant[]>; // open ones plus the most recently applied
  insertPending(email: string, keys: string[], by: string): Promise<string[]>; // returns the keys actually added
  deletePending(id: string): Promise<{ email: string; bot_key: string } | null>; // only if still open
  sendInviteEmail(to: string, keys: string[]): Promise<{ ok: boolean; error?: string }>;
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
  if (!["list", "grant", "revoke", "pre_list", "pre_grant", "pre_revoke"].includes(action)) return json({ error: "invalid_action" }, 400);

  // ---- by email: the person may not have an account yet ----
  if (action === "pre_list") return json({ pending: await deps.listPending() });

  if (action === "pre_revoke") {
    const id = String(body?.id ?? "").trim();
    if (!UUID_RE.test(id)) return json({ error: "invalid_id" }, 400);
    const removed = await deps.deletePending(id);
    if (removed) {
      await deps.logEvent({ provider: "manual", payer_email: removed.email, tool: removed.bot_key, outcome: "pre_revoked", resolved: true, detail: { by: caller.id } });
    }
    return json({ revoked: removed !== null });
  }

  if (action === "pre_grant") {
    const email = String(body?.email ?? "").trim().toLowerCase();
    if (!EMAIL_RE.test(email) || email.length > 254) return json({ error: "invalid_email" }, 400);
    const keys = [...new Set((Array.isArray(body?.bot_keys) ? (body.bot_keys as unknown[]).map(String) : []))];
    if (keys.length === 0 || keys.length > TOOL_KEYS.length || keys.some((k) => !TOOL_KEYS.includes(k))) return json({ error: "invalid_bot_keys" }, 400);
    const wantsEmail = body?.send_email === true;

    // Someone who already has an account gets the access right now, exactly like the per-user grant.
    const existing = await deps.findProfileByEmail(email);
    if (existing) {
      const inserted = await deps.insertGrants(existing.id, keys);
      let sent = false;
      let err: string | null = null;
      if (inserted.length > 0 && wantsEmail) {
        const r = await deps.sendEmail(email, inserted);
        sent = r.ok;
        err = r.ok ? null : r.error ?? "send_failed";
      }
      for (const key of inserted) {
        await deps.logEvent({ provider: "manual", payer_email: email, user_id: existing.id, tool: key, outcome: "granted", resolved: true, email_sent: sent, email_error: err, detail: { by: caller.id, emailed: wantsEmail, via: "pre_grant_existing_user" } });
      }
      return json({ mode: "direct", granted: inserted, already: keys.filter((k) => !inserted.includes(k)), email: { requested: wantsEmail && inserted.length > 0, sent, error: err } });
    }

    const added = await deps.insertPending(email, keys, caller.id);
    let sent = false;
    let err: string | null = null;
    if (added.length > 0 && wantsEmail) {
      const r = await deps.sendInviteEmail(email, added);
      sent = r.ok;
      err = r.ok ? null : r.error ?? "send_failed";
    }
    for (const key of added) {
      await deps.logEvent({ provider: "manual", payer_email: email, tool: key, outcome: "pre_granted", resolved: true, email_sent: sent, email_error: err, detail: { by: caller.id, emailed: wantsEmail } });
    }
    return json({ mode: "pending", pending: added, already: keys.filter((k) => !added.includes(k)), email: { requested: wantsEmail && added.length > 0, sent, error: err } });
  }

  // ---- by user id ----
  const userId = String(body?.user_id ?? "").trim();
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
async function sendEmailViaBrevo(to: string, keys: string[], invite = false): Promise<{ ok: boolean; error?: string }> {
  try {
    const lovableKey = Deno.env.get("LOVABLE_API_KEY");
    const brevoKey = Deno.env.get("BREVO_API_KEY");
    if (!lovableKey || !brevoKey) return { ok: false, error: "missing_email_secrets" };
    const replyTo = Deno.env.get("PURCHASE_REPLY_TO") ?? "";
    const m = invite ? buildInviteEmail(keys, to, !!replyTo) : buildManualAccessEmail(keys, to, !!replyTo);
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
    sendEmail: (to, keys) => sendEmailViaBrevo(to, keys),
    sendInviteEmail: (to, keys) => sendEmailViaBrevo(to, keys, true),
    async findProfileByEmail(email) {
      const { data } = await admin.from("profiles").select("id, email, display_name").ilike("email", email).limit(1).maybeSingle();
      return (data as Profile | null) ?? null;
    },
    async listPending() {
      const { data: open } = await admin.from("pending_tool_grants").select("id, email, bot_key, created_at, applied_at").is("applied_at", null).order("created_at", { ascending: false });
      const { data: done } = await admin.from("pending_tool_grants").select("id, email, bot_key, created_at, applied_at").not("applied_at", "is", null).order("applied_at", { ascending: false }).limit(10);
      return [...((open ?? []) as PendingGrant[]), ...((done ?? []) as PendingGrant[])];
    },
    async insertPending(email, keys, by) {
      const { data, error } = await admin
        .from("pending_tool_grants")
        .insert(keys.map((bot_key) => ({ email, bot_key, created_by: by })))
        .select("bot_key");
      if (!error) return (data ?? []).map((r: { bot_key: string }) => r.bot_key);
      // A key that is already waiting for this email violates the open-grant unique index: add the others one by one.
      const added: string[] = [];
      for (const bot_key of keys) {
        const r = await admin.from("pending_tool_grants").insert({ email, bot_key, created_by: by }).select("bot_key");
        if (!r.error) added.push(bot_key);
        else if (!String(r.error.message).includes("duplicate key")) throw r.error;
      }
      return added;
    },
    async deletePending(id) {
      const { data, error } = await admin.from("pending_tool_grants").delete().eq("id", id).is("applied_at", null).select("email, bot_key");
      if (error) throw error;
      return (data ?? [])[0] ?? null;
    },
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
