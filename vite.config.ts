import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import fs from "node:fs";
import { componentTagger } from "lovable-tagger";
import { ldScript, siteLdGraph } from "./netlify/edge-functions/lib/schema.ts";
import { ANON_KEY, SUPABASE_URL } from "./netlify/edge-functions/lib/public-db.ts";
import {
  groupArticles,
  PILLAR_DESCRIPTION,
  PILLAR_PATH,
  PILLAR_TITLE,
  PILLAR_URL,
  pillarBodyHtml,
  pillarJsonLdScripts,
  type PillarArticle,
} from "./netlify/edge-functions/lib/pillar-clinic-marketing.ts";

// Writes the site-wide structured data into index.html (and so into the raw HTML of every route) from the one source
// of truth, netlify/edge-functions/lib/schema.ts, in the dev server and in the build.
const siteSchema = (): Plugin => ({
  name: "site-schema",
  transformIndexHtml: { order: "pre", handler: (html) => html.replace("<!-- SITE_JSON_LD -->", ldScript(siteLdGraph("he"))) },
});

// The pillar page's text in the raw HTML. The app renders in the browser, so a crawler that does not run JavaScript
// would see an empty page. After the build this writes dist/<page>.html: the built index.html with the page's head
// tags and its text (the same module the page renders from) inside <div id="root">. Netlify serves a matching static
// file before the "/* -> /index.html" rewrite, and the app replaces the text when it starts, so people see the app.
// If the file is not served for some reason the rewrite serves the plain app, exactly as before.
// The article lists are read at build time; a new article is on the live page at once and in this raw copy at the
// next deploy. Any failure here only skips the file: it never fails the build.
const prerenderPillar = (): Plugin => {
  let outDir = "dist";
  return {
    name: "prerender-pillar",
    apply: "build",
    configResolved(config) {
      outDir = path.resolve(config.root, config.build.outDir);
    },
    async closeBundle() {
      try {
        const shellPath = path.join(outDir, "index.html");
        if (!fs.existsSync(shellPath)) return;
        let html = fs.readFileSync(shellPath, "utf8");

        let articles: PillarArticle[] = [];
        try {
          const r = await fetch(
            `${SUPABASE_URL}/rest/v1/contents?status=eq.published&language=eq.he&select=id,slug,title&order=published_at.desc&limit=1000`,
            { headers: { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` }, signal: AbortSignal.timeout(8000) },
          );
          if (r.ok) articles = (await r.json()) as PillarArticle[];
          else console.warn(`prerender-pillar: articles not read (HTTP ${r.status}); the page is written without its article lists`);
        } catch (e) {
          console.warn("prerender-pillar: articles not read; the page is written without its article lists", e);
        }

        const esc = (v: string) => v.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
        const set = (pattern: RegExp, replacement: string, label: string) => {
          if (!pattern.test(html)) throw new Error(`${label} not found in index.html`);
          html = html.replace(pattern, () => replacement);
        };
        set(/<title>[\s\S]*?<\/title>/, `<title>${esc(PILLAR_TITLE)}</title>`, "<title>");
        set(/<meta\s+name="description"[\s\S]*?\/>/, `<meta name="description" data-rh="true" content="${esc(PILLAR_DESCRIPTION)}" />`, "description");
        set(/<link rel="canonical"[^>]*\/>/, `<link rel="canonical" data-rh="true" href="${PILLAR_URL}" />`, "canonical");
        set(/<meta property="og:title"[^>]*\/>/, `<meta property="og:title" data-rh="true" content="${esc(PILLAR_TITLE)}" />`, "og:title");
        set(/<meta\s+property="og:description"[\s\S]*?\/>/, `<meta property="og:description" data-rh="true" content="${esc(PILLAR_DESCRIPTION)}" />`, "og:description");
        set(/<meta property="og:url"[^>]*\/>/, `<meta property="og:url" data-rh="true" content="${PILLAR_URL}" />`, "og:url");
        set(/<meta property="og:type"[^>]*\/>/, `<meta property="og:type" data-rh="true" content="article" />`, "og:type");
        set(/<\/head>/, `    ${pillarJsonLdScripts()}\n  </head>`, "</head>");
        set(/<div id="root"><\/div>/, `<div id="root">${pillarBodyHtml(groupArticles(articles))}</div>`, '<div id="root">');

        const out = path.join(outDir, `${PILLAR_PATH.slice(1)}.html`);
        fs.writeFileSync(out, html);
        console.log(`prerender-pillar: wrote ${path.relative(process.cwd(), out)} (${articles.length} articles)`);
      } catch (e) {
        console.warn("prerender-pillar: skipped", e);
      }
    },
  };
};

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react(), siteSchema(), prerenderPillar(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "framer-motion"],
  },
  optimizeDeps: {
    include: ['framer-motion'],
  },
}));
