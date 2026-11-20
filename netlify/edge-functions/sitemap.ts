// /sitemap.xml: the hand-kept list of pages (public/sitemap.xml) plus every published article, each with the date it
// was last changed. The static file had no articles at all, so a crawler could reach them only by following links.
//
// The static file stays the place to add or remove ordinary pages. Any failure returns it untouched, so the sitemap
// is never worse than before. Cached for ten minutes.
import type { Config, Context } from "@netlify/edge-functions";
import { ANON_KEY, SUPABASE_URL } from "./lib/public-db.ts";
import { contentPath } from "./lib/slug.ts";

const SITE = "https://therapykeys.co.il";
export interface SitemapArticle {
  id: string;
  slug: string | null;
  updated_at: string | null;
  published_at: string | null;
}

const xmlEsc = (v: string) => v.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" })[c]!);

// A date the way a sitemap wants it (YYYY-MM-DD), or null when the value is not a date.
export function lastmod(value: string | null | undefined): string | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
}

export function withArticles(staticXml: string, articles: SitemapArticle[]): string {
  if (!/<\/urlset>/i.test(staticXml)) return staticXml;
  const entries = articles
    // an article without a slug is still reachable by its id, so it is listed under that address
    .map((a) => {
      const loc = `${SITE}${encodeURI(contentPath(a))}`;
      const mod = lastmod(a.updated_at) ?? lastmod(a.published_at);
      return `  <url>\n    <loc>${xmlEsc(loc)}</loc>${mod ? `\n    <lastmod>${mod}</lastmod>` : ""}\n    <changefreq>monthly</changefreq>\n    <priority>0.6</priority>\n  </url>`;
    })
    .join("\n");
  if (!entries) return staticXml;
  return staticXml.replace(/<\/urlset>/i, () => `${entries}\n</urlset>`);
}

export default async (_request: Request, context: Context) => {
  const response = await context.next();
  const untouched = response.clone();
  try {
    if (!response.ok) return untouched;
    const staticXml = await response.text();
    const r = await fetch(
      `${SUPABASE_URL}/rest/v1/contents?is_published=eq.true&select=id,slug,updated_at,published_at&order=published_at.desc&limit=1000`,
      { headers: { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` }, signal: AbortSignal.timeout(4000) },
    );
    if (!r.ok) return untouched;
    const xml = withArticles(staticXml, (await r.json()) as SitemapArticle[]);
    return new Response(xml, {
      status: 200,
      headers: { "content-type": "application/xml; charset=utf-8", "cache-control": "public, max-age=0, s-maxage=600" },
    });
  } catch {
    return untouched;
  }
};

export const config: Config = { path: "/sitemap.xml", cache: "manual" };
