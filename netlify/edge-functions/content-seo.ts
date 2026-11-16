// /contents/:id: returns the app shell with the article's own title, description and link preview in the HTML, so
// search engines and link-preview bots (which do not run JavaScript) no longer see the home page's tags on every
// article. Any failure falls back to the plain shell, so the page itself never breaks. Cached at the CDN.
import type { Config, Context } from "@netlify/edge-functions";
import { injectContentHead, type ContentRow } from "./lib/content-html.ts";

const SUPABASE_URL = "https://umtqmhzzxbfvokbiwsmr.supabase.co";
// The public (anon) key, the same one the site ships to every browser. Reads are limited by row-level security,
// which lets anyone read published articles only.
const ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVtdHFtaHp6eGJmdm9rYml3c21yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY2NjI5ODIsImV4cCI6MjA4MjIzODk4Mn0.lVF-CCkqp0VlTjCmXbVKhYIjBrp9y7_hWacMHk7AxCE";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async (request: Request, context: Context) => {
  const id = context.params?.id ?? new URL(request.url).pathname.split("/")[2] ?? "";
  if (!UUID.test(id)) return; // /contents/admin and anything else that is not an article id: leave the request alone

  const response = await context.next();
  if (!(response.headers.get("content-type") ?? "").includes("text/html")) return response;

  let row: ContentRow | null = null;
  try {
    const r = await fetch(
      `${SUPABASE_URL}/rest/v1/contents?id=eq.${id}&is_published=eq.true&select=title,excerpt,content,featured_image_url,published_at&limit=1`,
      { headers: { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` }, signal: AbortSignal.timeout(4000) },
    );
    if (!r.ok) return response;
    row = ((await r.json()) as ContentRow[])[0] ?? null;
  } catch {
    return response;
  }
  if (!row?.title) return response; // unknown or unpublished: the app shows its own state

  const html = injectContentHead(await response.text(), row, id);
  const headers = new Headers(response.headers);
  headers.delete("content-length");
  headers.set("content-type", "text/html; charset=utf-8");
  // An edit shows up within ten minutes.
  headers.set("cache-control", "public, max-age=0, s-maxage=600");
  return new Response(html, { status: 200, headers });
};

export const config: Config = { path: "/contents/:id", cache: "manual" };
