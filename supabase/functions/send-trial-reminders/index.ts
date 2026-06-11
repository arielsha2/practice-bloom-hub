// Daily-scheduled function: emails free-tier users who are 2 days from trial expiry.
// Window: trial_start_date in [now - 6.5d, now - 5.5d) AND plan='free'.
// Idempotency: tracked via profiles.trial_reminder_sent_at (migration adds the column).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PAY_URL = "https://meshulam.co.il/quick_payment?b=692abdd2459224a95d57aef700a015ab";
const GATEWAY_URL = "https://connector-gateway.lovable.dev/brevo";
const FROM_EMAIL = Deno.env.get("BREVO_FROM_EMAIL") || "noreply@therapykeys.co.il";
const FROM_NAME = "אליענה - TherapyKeys";

function emailHtml(name: string) {
  const greet = name ? `היי ${name},` : "היי,";
  return `<!doctype html><html lang="he" dir="rtl"><body style="font-family:Heebo,Arial,sans-serif;background:#f5f2ff;padding:24px;color:#2a1a3a;">
  <table role="presentation" width="100%" style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:16px;padding:32px;">
    <tr><td>
      <h1 style="color:#58005a;font-size:22px;margin:0 0 16px;">עוד יומיים — והמסע יכול להמשיך</h1>
      <p style="font-size:16px;line-height:1.7;margin:0 0 12px;">${greet}</p>
      <p style="font-size:16px;line-height:1.7;margin:0 0 12px;">התחלת את המסע עם אליענה לפני כמה ימים, ואני שמחה שהצטרפת. עוד יומיים תסתיים תקופת הניסיון שלך.</p>
      <p style="font-size:16px;line-height:1.7;margin:0 0 24px;">אם את מוכנה להמשיך – כל ההיסטוריה שלנו שמורה ומחכה לך.</p>
      <p style="text-align:center;margin:24px 0;">
        <a href="${PAY_URL}" style="background:#ff6f61;color:#fff;text-decoration:none;padding:14px 28px;border-radius:12px;font-weight:600;display:inline-block;">המשיכי את המסע</a>
      </p>
      <p style="font-size:13px;color:#7a6a85;margin-top:24px;">אם כבר שדרגת — תוכלי להתעלם מהמייל הזה.</p>
    </td></tr>
  </table>
</body></html>`;
}

async function sendBrevo(toEmail: string, toName: string | null) {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  const BREVO_KEY = Deno.env.get("BREVO_API_KEY");
  if (!LOVABLE_API_KEY || !BREVO_KEY) {
    throw new Error("Brevo connector not configured");
  }
  const res = await fetch(`${GATEWAY_URL}/smtp/email`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "X-Connection-Api-Key": BREVO_KEY,
    },
    body: JSON.stringify({
      sender: { name: FROM_NAME, email: FROM_EMAIL },
      to: [{ email: toEmail, name: toName || undefined }],
      subject: "עוד יומיים – והמסע עם אליענה יכול להמשיך",
      htmlContent: emailHtml(toName || ""),
    }),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Brevo ${res.status}: ${txt}`);
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const now = new Date();
  const upper = new Date(now.getTime() - 5.5 * 24 * 3600 * 1000).toISOString(); // < 5.5d ago
  const lower = new Date(now.getTime() - 6.5 * 24 * 3600 * 1000).toISOString(); // >= 6.5d ago

  const { data, error } = await admin
    .from("profiles")
    .select("id, email, trial_start_date, trial_reminder_sent_at")
    .eq("plan", "free")
    .is("trial_reminder_sent_at", null)
    .gte("trial_start_date", lower)
    .lt("trial_start_date", upper);

  if (error) {
    console.error("query error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let sent = 0, failed = 0;
  for (const row of data || []) {
    if (!row.email) continue;
    try {
      await sendBrevo(row.email, null);
      await admin.from("profiles").update({ trial_reminder_sent_at: new Date().toISOString() }).eq("id", row.id);
      sent++;
    } catch (e) {
      console.error("send failed for", row.email, e);
      failed++;
    }
  }

  return new Response(JSON.stringify({ ok: true, candidates: data?.length ?? 0, sent, failed }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
