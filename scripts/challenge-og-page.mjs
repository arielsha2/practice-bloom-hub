// Post-build: give /challenge its own link preview (WhatsApp, Facebook...).
//
// Link-preview bots read the raw HTML and never run the app, so the
// react-helmet tags on the page are invisible to them and every URL showed
// the site-wide preview. This writes dist/challenge.html, a copy of the
// built index.html with the challenge's title/description/image. Netlify
// serves a matching static file before the "/* -> /index.html" rewrite,
// and the copy boots the same app, so the page itself is unchanged.
import { readdirSync, readFileSync, writeFileSync } from "node:fs";

const SITE = "https://therapykeys.co.il";
const TITLE = "אתגר להיות מומחה מבוקש - עם אליענה שפירא";
const DESCRIPTION =
  "אתגר חינמי של 5 ימים (15-19.11) למטפלים, יועצים ומאמנים שרוצים קליניקה מלאה ומבוקשת, בדרך אותנטית שמכבדת את המקצועיות שלהם.";
const IMAGE = `${SITE}/og-challenge.jpg`;
const URL = `${SITE}/challenge`;

const esc = (s) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");

let html = readFileSync("dist/index.html", "utf8");

function set(pattern, replacement, label) {
  if (!pattern.test(html)) throw new Error(`challenge-og-page: ${label} not found in dist/index.html`);
  html = html.replace(pattern, replacement);
}

set(/<title>[\s\S]*?<\/title>/, `<title>${esc(TITLE)}</title>`, "<title>");
set(/<meta\s+name="description"[\s\S]*?\/>/, `<meta name="description" content="${esc(DESCRIPTION)}" />`, "description");
set(/<link rel="canonical"[^>]*\/>/, `<link rel="canonical" href="${URL}" />`, "canonical");
set(/<meta property="og:title"[^>]*\/>/, `<meta property="og:title" content="${esc(TITLE)}" />`, "og:title");
set(/<meta\s+property="og:description"[\s\S]*?\/>/, `<meta property="og:description" content="${esc(DESCRIPTION)}" />`, "og:description");
set(/<meta property="og:url"[^>]*\/>/, `<meta property="og:url" content="${URL}" />`, "og:url");
set(
  /<meta property="og:image"[^>]*\/>/,
  `<meta property="og:image" content="${IMAGE}" />\n    <meta property="og:image:width" content="1200" />\n    <meta property="og:image:height" content="630" />\n    <meta property="og:image:alt" content="${esc(TITLE)}" />`,
  "og:image",
);
set(/<meta name="twitter:image"[^>]*\/>/, `<meta name="twitter:image" content="${IMAGE}" />`, "twitter:image");

// Pages are lazy-loaded chunks, so without hints the browser only discovers
// the challenge chunk (and the hero photo inside it) after the main bundle
// has run. Preload them up front so they download in parallel.
const assets = readdirSync("dist/assets");
const pageChunk = assets.find((f) => /^ChallengeLanding-.*\.js$/.test(f));
const heroImage = assets.find((f) => /^eliana-portrait-.*\.(jpg|webp)$/.test(f));
if (!pageChunk || !heroImage) throw new Error("challenge-og-page: challenge chunk or hero image not found in dist/assets");

const chunks = new Set();
(function walk(file) {
  if (chunks.has(file)) return;
  chunks.add(file);
  const src = readFileSync(`dist/assets/${file}`, "utf8");
  for (const m of src.matchAll(/(?:from|import)\s*"\.\/([^"]+\.js)"/g)) walk(m[1]);
})(pageChunk);

const hints = [
  `<link rel="preload" as="image" href="/assets/${heroImage}" fetchpriority="high" />`,
  ...[...chunks].map((f) => `<link rel="modulepreload" crossorigin href="/assets/${f}" />`),
].map((l) => `    ${l}`).join("\n");
set(/<\/head>/, `${hints}\n  </head>`, "</head>");

writeFileSync("dist/challenge.html", html);
console.log("challenge-og-page: wrote dist/challenge.html");
