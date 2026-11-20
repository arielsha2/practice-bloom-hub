import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { ldScript, siteLdGraph } from "./netlify/edge-functions/lib/schema.ts";

// Writes the site-wide structured data into index.html (and so into the raw HTML of every route) from the one source
// of truth, netlify/edge-functions/lib/schema.ts, in the dev server and in the build.
const siteSchema = (): Plugin => ({
  name: "site-schema",
  transformIndexHtml: { order: "pre", handler: (html) => html.replace("<!-- SITE_JSON_LD -->", ldScript(siteLdGraph("he"))) },
});

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react(), siteSchema(), mode === "development" && componentTagger()].filter(Boolean),
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
