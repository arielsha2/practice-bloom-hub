// /t/:slug: returns the app shell with the therapist's own page content in the HTML, so search engines and AI
// crawlers (which often do not run JavaScript) can read it. Any failure falls back to the plain shell, so the page
// itself never breaks. Responses are cached at the CDN (cached responses do not count as invocations).
import type { Config, Context } from "@netlify/edge-functions";
import { renderPage, type SiteRow } from "./lib/therapist-html.ts";

const SUPABASE_URL = "https://umtqmhzzxbfvokbiwsmr.supabase.co";
// The public (anon) key, the same one the site ships to every browser. Reads are limited by row-level security.
const ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVtdHFtaHp6eGJmdm9rYml3c21yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY2NjI5ODIsImV4cCI6MjA4MjIzODk4Mn0.lVF-CCkqp0VlTjCmXbVKhYIjBrp9y7_hWacMHk7AxCE";

export default async (request: Request, context: Context) => {
  const slug = context.params?.slug ?? new URL(request.url).pathname.split("/")[2] ?? "";
  if (!/^[a-z0-9-]{1,80}$/.test(slug)) return; // not a slug we know how to look up: leave the request alone

  const response = await context.next();
  if (!(response.headers.get("content-type") ?? "").includes("text/html")) return response;

  let row: SiteRow | null = null;
  try {
    const r = await fetch(
      `${SUPABASE_URL}/rest/v1/therapist_websites?slug=eq.${encodeURIComponent(slug)}&is_published=eq.true&select=content,updated_at&limit=1`,
      { headers: { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` }, signal: AbortSignal.timeout(4000) },
    );
    if (!r.ok) return response;
    const rows = (await r.json()) as SiteRow[];
    row = rows[0] ?? null;
  } catch {
    return response;
  }

  const shell = await response.text();
  const html = renderPage(shell, slug, row);
  const headers = new Headers(response.headers);
  headers.delete("content-length");
  headers.set("content-type", "text/html; charset=utf-8");
  // A new site or an edit shows up within ten minutes; an unknown address is rechecked every minute.
  headers.set("cache-control", row ? "public, max-age=0, s-maxage=600" : "public, max-age=0, s-maxage=60");
  return new Response(html, { status: row ? 200 : 404, headers });
};

export const config: Config = { path: "/t/:slug", cache: "manual" };
