// /contents/:id: the head of an article page (title, description, link preview, structured data) written into the
// HTML the server returns. The app sets the same tags with react-helmet, but search engines that do not run
// JavaScript and link-preview bots (WhatsApp, Facebook) read only the raw HTML, where every article otherwise
// carried the home page's tags.
//
// articleDescription / plainText / clip are mirrored in src/lib/articleSeo.ts (the browser side): keep them in step.

import { articleLd, ldScript, LOGO, SITE, type Lang } from "./schema.ts";
import { contentPath } from "./slug.ts";

const DEFAULT_IMAGE = LOGO;

export interface ContentRow {
  id: string;
  slug?: string | null;
  updated_at?: string | null;
  title: string | null;
  excerpt: string | null;
  content: string | null;
  featured_image_url: string | null;
  published_at: string | null;
  language?: string | null;
}

const esc = (v: unknown): string =>
  String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

const ENTITIES: Record<string, string> = { "&nbsp;": " ", "&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": '"', "&apos;": "'", "&#39;": "'" };

export function plainText(html: string): string {
  return html
    .replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, " ")
    .replace(/<br\s*\/?>|<\/p>|<\/h[1-6]>|<\/li>/gi, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/&(?:nbsp|amp|lt|gt|quot|apos|#39);/g, (m) => ENTITIES[m] ?? " ")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/\s+/g, " ")
    .trim();
}

// Cuts at a word boundary, so a description never ends in the middle of a word.
export function clip(s: string, n = 155): string {
  if (s.length <= n) return s;
  const cut = s.slice(0, n);
  const space = cut.lastIndexOf(" ");
  return (space > n * 0.6 ? cut.slice(0, space) : cut).replace(/[\s,.;:\-–—]+$/, "") + "…";
}

// The article's own summary when it has one; otherwise the way the text opens (articles here start with a hook).
export function articleDescription(row: { excerpt?: string | null; title?: string | null; content?: string | null }): string {
  const excerpt = plainText(row.excerpt ?? "");
  if (excerpt) return clip(excerpt);
  const body = plainText(row.content ?? "");
  if (body) return clip(body);
  return clip(plainText(row.title ?? ""));
}

const SHELL_META =
  /<meta\s+(?:name|property)="(?:description|og:locale|og:title|og:description|og:url|og:image|og:type|twitter:title|twitter:description|twitter:image|robots)"[^>]*>\s*/gi;

export function injectContentHead(shell: string, row: ContentRow): string {
  const lang: Lang = row.language === "en" ? "en" : "he";
  const title = `${plainText(row.title ?? "") || (lang === "en" ? "Article" : "מאמר")} | ${lang === "en" ? "TherapyKeys" : "על שפת הקליניקה"}`;
  const description = articleDescription(row);
  // the article's one address: its slug when it has one, so the id address and the slug address share a canonical
  const canonical = `${SITE}${encodeURI(contentPath(row))}`;
  const image = row.featured_image_url ? (row.featured_image_url.startsWith("http") ? row.featured_image_url : `${SITE}${row.featured_image_url}`) : DEFAULT_IMAGE;
  const words = plainText(row.content ?? "").split(" ").filter(Boolean).length;

  const ld = articleLd({
    headline: plainText(row.title ?? ""),
    description,
    url: canonical,
    lang,
    image,
    datePublished: row.published_at,
    dateModified: row.updated_at,
    wordCount: words || undefined,
  });

  const tags = [
    `<title>${esc(title)}</title>`,
    `<meta name="description" data-rh="true" content="${esc(description)}" />`,
    `<link rel="canonical" data-rh="true" href="${esc(canonical)}" />`,
    `<meta property="og:type" data-rh="true" content="article" />`,
    `<meta property="og:locale" data-rh="true" content="${lang === "en" ? "en_US" : "he_IL"}" />`,
    `<meta property="og:title" data-rh="true" content="${esc(title)}" />`,
    `<meta property="og:description" data-rh="true" content="${esc(description)}" />`,
    `<meta property="og:url" data-rh="true" content="${esc(canonical)}" />`,
    `<meta property="og:image" data-rh="true" content="${esc(image)}" />`,
    `<meta name="twitter:title" data-rh="true" content="${esc(title)}" />`,
    `<meta name="twitter:description" data-rh="true" content="${esc(description)}" />`,
    `<meta name="twitter:image" data-rh="true" content="${esc(image)}" />`,
    // the shell keeps the site-wide organization graph (who runs the site); the article adds its own
    ldScript(ld, `data-rh="true"`),
  ].join("\n    ");

  const out = shell
    .replace(/<title>[\s\S]*?<\/title>\s*/i, "")
    .replace(SHELL_META, "")
    .replace(/<link\s+rel="canonical"[^>]*>\s*/gi, "");
  return out.replace(/<\/head>/i, () => `    ${tags}\n  </head>`);
}
