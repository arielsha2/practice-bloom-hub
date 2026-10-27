// Opens a stored diagnosis report from a personal link (the follow-up e-mail), without a login.
// The token is the only credential: 64 random hex characters stored in diagnosis_report_links, with an expiry.
// Returns only the therapist's own stored diagnosis and display name. Writes one "report opened" row for the admin
// card and counts the opening on the link.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ===== core: begin =====
export interface LinkRow { user_id: string; expires_at: string }
export interface Deps {
  now: () => Date;
  findLink: (token: string) => Promise<LinkRow | null>;
  loadReport: (userId: string) => Promise<{ displayName: string | null; email: string | null; output: Record<string, unknown> | null } | null>;
  recordOpen: (userId: string, email: string | null, name: string | null, tool: string | null) => Promise<void>;
}

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

export async function handle(req: Request, deps: Deps): Promise<Response> {
  if (req.method !== "POST") return json(405, { error: "method_not_allowed" });
  let token = "";
  try {
    const body = await req.json();
    token = typeof body?.token === "string" ? body.token : "";
  } catch { /* handled below */ }
  if (!/^[a-f0-9]{64}$/.test(token)) return json(404, { error: "not_found" });

  const link = await deps.findLink(token);
  if (!link) return json(404, { error: "not_found" });
  if (new Date(link.expires_at).getTime() <= deps.now().getTime()) return json(410, { error: "expired" });

  const data = await deps.loadReport(link.user_id);
  const output = data?.output;
  if (!data || !output || !output.recommended_tool) return json(404, { error: "no_report" });

  await deps.recordOpen(link.user_id, data.email, data.displayName, String(output.recommended_tool));
  return json(200, { display_name: data.displayName, diagnosis_output: output });
}
// ===== core: end =====

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const deps: Deps = {
      now: () => new Date(),
      findLink: async (token) => {
        const { data } = await admin.from("diagnosis_report_links").select("user_id, expires_at").eq("token", token).maybeSingle();
        return (data as LinkRow | null) ?? null;
      },
      loadReport: async (userId) => {
        const [{ data: journey }, { data: profile }] = await Promise.all([
          admin.from("therapist_journeys").select("diagnosis_output").eq("user_id", userId).maybeSingle(),
          admin.from("profiles").select("email, display_name").eq("id", userId).maybeSingle(),
        ]);
        const name = (profile as any)?.display_name as string | null | undefined;
        return {
          displayName: name && !name.includes("@") ? name : null,
          email: ((profile as any)?.email as string | null) ?? null,
          output: ((journey as any)?.diagnosis_output as Record<string, unknown> | null) ?? null,
        };
      },
      recordOpen: async (userId, email, name, tool) => {
        try {
          await admin.rpc("touch_diagnosis_report_link", { p_user_id: userId });
          await admin.from("diagnosis_consult_clicks").insert({
            user_id: userId, email, full_name: name, kind: "report_opened", recommended_tool: tool, language: "he",
          });
        } catch (e) {
          console.error("diagnosis-report-view: recording the opening failed", e);
        }
      },
    };
    return await handle(req, deps);
  } catch (e) {
    console.error("diagnosis-report-view", e);
    return json(500, { error: "server_error" });
  }
});
