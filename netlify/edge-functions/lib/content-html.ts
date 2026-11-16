// /contents/:id: the head of an article page (title, description, link preview, structured data) written into the
// HTML the server returns. The app sets the same tags with react-helmet, but search engines that do not run
// JavaScript and link-preview bots (WhatsApp, Facebook) read only the raw HTML, where every article otherwise
// carried the home page's tags.
//
// articleDescription / plainText / clip are mirrored in src/lib/articleSeo.ts (the browser side): keep them in step.

const SITE = "https://therapykeys.co.il";
const DEFAULT_IMAGE = `${SITE}/og-image.jpg`;

export interface ContentRow {
  title: string | null;
  excerpt: string | null;
  content: string | null;
  featured_image_url: string | null;
  published_at: string | null;
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
  /<meta\s+(?:name|property)="(?:description|og:title|og:description|og:url|og:image|og:type|twitter:title|twitter:description|twitter:image|robots)"[^>]*>\s*/gi;

export function injectContentHead(shell: string, row: ContentRow, id: string): string {
  const title = `${plainText(row.title ?? "") || "מאמר"} | על שפת הקליניקה`;
  const description = articleDescription(row);
  const canonical = `${SITE}/contents/${id}`;
  const image = row.featured_image_url ? (row.featured_image_url.startsWith("http") ? row.featured_image_url : `${SITE}${row.featured_image_url}`) : DEFAULT_IMAGE;
  const words = plainText(row.content ?? "").split(" ").filter(Boolean).length;

  const ld = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: plainText(row.title ?? ""),
    description,
    image,
    inLanguage: "he",
    ...(row.published_at ? { datePublished: row.published_at } : {}),
    ...(words ? { wordCount: words } : {}),
    author: { "@type": "Person", "@id": `${SITE}/#ariel-shapira`, name: 'ד"ר אריאל שפירא', url: SITE },
    publisher: { "@type": "Organization", "@id": `${SITE}/#organization`, name: "TherapyKeys", logo: { "@type": "ImageObject", url: DEFAULT_IMAGE } },
    mainEntityOfPage: { "@type": "WebPage", "@id": canonical },
  };

  const tags = [
    `<title>${esc(title)}</title>`,
    `<meta name="description" data-rh="true" content="${esc(description)}" />`,
    `<link rel="canonical" data-rh="true" href="${esc(canonical)}" />`,
    `<meta property="og:type" data-rh="true" content="article" />`,
    `<meta property="og:title" data-rh="true" content="${esc(title)}" />`,
    `<meta property="og:description" data-rh="true" content="${esc(description)}" />`,
    `<meta property="og:url" data-rh="true" content="${esc(canonical)}" />`,
    `<meta property="og:image" data-rh="true" content="${esc(image)}" />`,
    `<meta name="twitter:title" data-rh="true" content="${esc(title)}" />`,
    `<meta name="twitter:description" data-rh="true" content="${esc(description)}" />`,
    `<meta name="twitter:image" data-rh="true" content="${esc(image)}" />`,
    // the shell's own structured data describes the home page: an article carries its own
    `<script type="application/ld+json" data-rh="true">${JSON.stringify(ld).replace(/</g, "\\u003c")}</script>`,
  ].join("\n    ");

  const out = shell
    .replace(/<title>[\s\S]*?<\/title>\s*/i, "")
    .replace(SHELL_META, "")
    .replace(/<link\s+rel="canonical"[^>]*>\s*/gi, "")
    .replace(/<script\s+type="application\/ld\+json">[\s\S]*?<\/script>\s*/gi, "");
  return out.replace(/<\/head>/i, () => `    ${tags}\n  </head>`);
}
