// The browser side of an article's search/preview tags. The same functions run on the server in
// netlify/edge-functions/lib/content-html.ts (which writes the tags into the HTML for crawlers that do not run
// JavaScript): keep the two in step.

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
