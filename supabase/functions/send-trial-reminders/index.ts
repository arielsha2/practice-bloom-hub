// Daily-scheduled function: temporarily disabled.
// The product trial window changed, but this reminder still referenced the old
// "two days left" messaging. Keep the function deployed as a no-op so scheduled
// invocations succeed without sending misleading emails.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  return new Response(JSON.stringify({ ok: true, disabled: true, sent: 0 }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
