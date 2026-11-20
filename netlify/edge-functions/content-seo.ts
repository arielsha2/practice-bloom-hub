// /contents/:key (the key is an article's slug, or, for older links, its id): returns the app shell with the article's
// own title, description and link preview in the HTML, so search engines and link-preview bots (which do not run
// JavaScript) no longer see the home page's tags on every article. Any failure falls back to the plain shell, so the
// page itself never breaks. Cached at the CDN.
//
// An address that carries the id is sent on to the readable address with a permanent redirect (one hop) once
// REDIRECT_ID_TO_SLUG is on (switched on after the slug addresses were live and checked on every article; a
// mistake can be undone by flipping this one constant).
import type { Config, Context } from "@netlify/edge-functions";
import { injectContentHead, type ContentRow } from "./lib/content-html.ts";
import { ANON_KEY, SUPABASE_URL } from "./lib/public-db.ts";
import { contentPath, RESERVED_SLUGS, UUID_RE } from "./lib/slug.ts";

export const REDIRECT_ID_TO_SLUG = true;

const FIELDS = "id,slug,updated_at,title,excerpt,content,featured_image_url,published_at,language";

export default async (request: Request, context: Context) => {
  const url = new URL(request.url);
  const raw = context.params?.id ?? url.pathname.split("/")[2] ?? "";
  let key = "";
  try {
    key = decodeURIComponent(raw);
  } catch {
    return; // not a valid address: leave the request alone
  }
  if (!key || RESERVED_SLUGS.includes(key)) return; // /contents/admin is a page of its own

  const byId = UUID_RE.test(key);
  let row: ContentRow | null = null;
  try {
    const filter = byId ? `id=eq.${key}` : `slug=eq.${encodeURIComponent(key)}`;
    const r = await fetch(`${SUPABASE_URL}/rest/v1/contents?${filter}&is_published=eq.true&select=${FIELDS}&limit=1`, {
      headers: { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` },
      signal: AbortSignal.timeout(4000),
    });
    if (!r.ok) return;
    row = ((await r.json()) as ContentRow[])[0] ?? null;
  } catch {
    return;
  }
  if (!row?.title) return; // unknown or unpublished: the app shows its own state

  if (REDIRECT_ID_TO_SLUG && byId && row.slug) {
    return new Response(null, {
      status: 301,
      headers: {
        location: `${encodeURI(contentPath(row))}${url.search}`,
        "cache-control": "public, max-age=0, s-maxage=600",
      },
    });
  }

  const response = await context.next();
  if (!(response.headers.get("content-type") ?? "").includes("text/html")) return response;

  const html = injectContentHead(await response.text(), row);
  const headers = new Headers(response.headers);
  headers.delete("content-length");
  headers.set("content-type", "text/html; charset=utf-8");
  // An edit shows up within ten minutes.
  headers.set("cache-control", "public, max-age=0, s-maxage=600");
  return new Response(html, { status: 200, headers });
};

export const config: Config = { path: "/contents/:id", cache: "manual" };
