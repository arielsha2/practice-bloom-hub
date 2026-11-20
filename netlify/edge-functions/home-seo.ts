// "/": returns the app shell with the home page's own structured data already in the HTML <head>: the FAQPage (the
// questions and answers that sit inside the collapsed accordion), the Course and the HowTo. Search engines and AI
// crawlers (GPTBot, ClaudeBot, PerplexityBot...) do not run JavaScript, so this is where they read them. It is
// written for "/" only on purpose: index.html is the shell for EVERY route (it carries only the site-wide
// organization graph), and this markup must describe what the home page itself shows.
//
// The data is the same modules the page renders from (lib/home-faq.ts, lib/schema.ts), so one edit updates the page
// and the markup. Each tag carries data-rh="true" and the same text the page's own react-helmet tag produces, so once
// the app starts it keeps one copy, not two. Any failure returns the plain shell: the page itself never breaks.
import type { Config, Context } from "@netlify/edge-functions";
import { buildFaqJsonLd, HOME_FAQ } from "./lib/home-faq.ts";
import { homeLd, ldScript } from "./lib/schema.ts";

// Adds each of the home page's schemas that the shell does not already carry (checked per @type: never twice).
export function withHomeJsonLd(shell: string): string {
  const missing = [...homeLd("he"), buildFaqJsonLd(HOME_FAQ)].filter(
    (ld) => !new RegExp(`"@type"\\s*:\\s*"${ld["@type"]}"`).test(shell),
  );
  if (!missing.length) return shell;
  const tags = missing.map((ld) => ldScript(ld, `data-rh="true"`)).join("\n    ");
  return shell.replace(/<\/head>/i, () => `    ${tags}\n  </head>`);
}

export default async (_request: Request, context: Context) => {
  const response = await context.next();
  if (!(response.headers.get("content-type") ?? "").includes("text/html")) return response;
  const untouched = response.clone(); // the body can be read only once: keep a copy to fall back to
  try {
    const html = withHomeJsonLd(await response.text());
    const headers = new Headers(response.headers);
    headers.delete("content-length");
    headers.set("content-type", "text/html; charset=utf-8");
    // The page and its markup change only with a deploy (which also clears this cache).
    headers.set("cache-control", "public, max-age=0, s-maxage=600");
    return new Response(html, { status: response.status, headers });
  } catch {
    return untouched;
  }
};

export const config: Config = { path: "/", cache: "manual" };
