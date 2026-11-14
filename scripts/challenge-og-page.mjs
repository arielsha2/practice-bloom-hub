// Post-build: give the challenge landing pages their own link preview
// (WhatsApp, Facebook...).
//
// Link-preview bots read the raw HTML and never run the app, so the
// react-helmet tags on the page are invisible to them and every URL showed
// the site-wide preview. This writes dist/<page>.html, a copy of the built
// index.html with the page's title/description/image. Netlify serves a
// matching static file before the "/* -> /index.html" rewrite, and the copy
// boots the same app, so the page itself is unchanged. Page paths must stay
// flat (no "/challenge/x"): a dist/challenge/ folder next to challenge.html
// could make Netlify redirect /challenge to /challenge/.
import { readdirSync, readFileSync, writeFileSync } from "node:fs";

const SITE = "https://therapykeys.co.il";
// v4: a mini version of the page hero that fits inside the centre 630x630 square.
// WhatsApp (phone and desktop) shows a square thumbnail cropped from the centre,
// so everything that matters must sit there; Facebook shows the full width.
const IMAGE = `${SITE}/og-challenge-v4.jpg`;

const PAGES = [
  {
    file: "challenge.html",
    path: "/challenge",
    chunk: "ChallengeLanding",
    title: "אתגר להיות מומחה מבוקש - עם אליענה שפירא",
    description:
      "אתגר חינמי של 5 ימים (15-19.11) למטפלים, יועצים ומאמנים שרוצים קליניקה מלאה ומבוקשת, בדרך אותנטית שמכבדת את המקצועיות שלהם.",
  },
  {
    file: "challenge-community.html",
    path: "/challenge-community",
    chunk: "ChallengeCommunity",
    title: "הזמנה לקהילה: אתגר להיות מומחה מבוקש - עם אליענה שפירא",
    description: "לחברי קהילת על שפת הקליניקה: אתגר חינמי של 5 ימים (15-19.11), ממטפל אנונימי למומחה מבוקש בתחומך.",
  },
  {
    file: "hamumchim.html",
    path: "/hamumchim",
    chunk: "ExpertsSales",
    image: `${SITE}/og-experts.jpg`,
    noindex: true, // the page itself is noindex until the design is approved
    title: "המומחים | תוכנית ליווי למטפלים עם אליענה שפירא",
    description:
      "ממטפל אנונימי למומחה מבוקש: ארבעה חודשים של לימוד, תרגול וליווי אישי וקבוצתי, שמשלבים אסטרטגיה שיווקית ועבודה פנימית.",
  },
];

const esc = (s) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
const base = readFileSync("dist/index.html", "utf8");
const assets = readdirSync("dist/assets");
const heroImage = assets.find((f) => /^eliana-portrait-.*\.(jpg|webp)$/.test(f));
if (!heroImage) throw new Error("challenge-og-page: hero image not found in dist/assets");

for (const page of PAGES) {
  let html = base;
  const set = (pattern, replacement, label) => {
    if (!pattern.test(html)) throw new Error(`challenge-og-page: ${label} not found in dist/index.html`);
    html = html.replace(pattern, replacement);
  };
  const url = `${SITE}${page.path}`;
  const image = page.image ?? IMAGE;

  set(/<title>[\s\S]*?<\/title>/, `<title>${esc(page.title)}</title>`, "<title>");
  set(/<meta\s+name="description"[\s\S]*?\/>/, `<meta name="description" content="${esc(page.description)}" />`, "description");
  set(/<link rel="canonical"[^>]*\/>/, `<link rel="canonical" href="${url}" />`, "canonical");
  set(/<meta property="og:title"[^>]*\/>/, `<meta property="og:title" content="${esc(page.title)}" />`, "og:title");
  set(/<meta\s+property="og:description"[\s\S]*?\/>/, `<meta property="og:description" content="${esc(page.description)}" />`, "og:description");
  set(/<meta property="og:url"[^>]*\/>/, `<meta property="og:url" content="${url}" />`, "og:url");
  set(
    /<meta property="og:image"[^>]*\/>/,
    `<meta property="og:image" content="${image}" />\n    <meta property="og:image:width" content="1200" />\n    <meta property="og:image:height" content="630" />\n    <meta property="og:image:alt" content="${esc(page.title)}" />`,
    "og:image",
  );
  set(/<meta name="twitter:image"[^>]*\/>/, `<meta name="twitter:image" content="${image}" />`, "twitter:image");

  // Pages are lazy-loaded chunks, so without hints the browser only discovers
  // the page chunk (and the hero photo inside it) after the main bundle has
  // run. Preload them up front so they download in parallel.
  const pageChunk = assets.find((f) => new RegExp(`^${page.chunk}-.*\\.js$`).test(f));
  if (!pageChunk) throw new Error(`challenge-og-page: ${page.chunk} chunk not found in dist/assets`);
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
  const robots = page.noindex ? `\n    <meta name="robots" content="noindex, nofollow" />` : "";
  set(/<\/head>/, `${hints}${robots}\n  </head>`, "</head>");

  writeFileSync(`dist/${page.file}`, html);
  console.log(`challenge-og-page: wrote dist/${page.file}`);
}
