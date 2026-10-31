// Turns the single-page-app shell (dist/index.html) into a page a crawler can read: the therapist's own title,
// description, canonical address, structured data and the page text, in the HTML the server returns. The browser
// still loads the app, which replaces the text inside #root as soon as it starts.
// Pure functions (no Deno or Netlify APIs) so they can be tested with plain Node.

export interface SiteRow {
  content: Record<string, unknown>;
  updated_at?: string | null;
}

const ORIGIN = "https://therapykeys.co.il";

export const esc = (v: unknown): string =>
  String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

const text = (v: unknown): string => (typeof v === "string" ? v.replace(/\s+/g, " ").trim() : "");

const clip = (s: string, n: number): string => (s.length <= n ? s : s.slice(0, n - 1).replace(/\s+\S*$/, "") + "…");

// JSON inside a <script> must not be able to close the tag.
const jsonLd = (o: unknown): string =>
  JSON.stringify(o)
    .replace(/</g, "\\u003c")
    .split(String.fromCharCode(0x2028)).join("")
    .split(String.fromCharCode(0x2029)).join("");

export interface Seo {
  title: string;
  description: string;
  canonical: string;
  image: string;
  name: string;
}

export function seoFor(slug: string, c: Record<string, unknown>): Seo {
  const name = text(c.fullName);
  const role = text(c.title);
  const keyPhrase = text(c.keyPhrase);
  const lead = text(c.heroLine) || text(c.about);
  const title = clip([name, role].filter(Boolean).join(" | ") || keyPhrase || "מטפל", 62);
  const description = clip([keyPhrase, lead].filter(Boolean).join(". ").replace(/\.\./g, "."), 160);
  const avatar = text(c.avatarUrl);
  return {
    title,
    description,
    canonical: `${ORIGIN}/t/${slug}`,
    image: avatar.startsWith("https://") ? avatar : `${ORIGIN}/og-image.jpg`,
    name,
  };
}

function faqOf(c: Record<string, unknown>): Array<{ q: string; a: string }> {
  if (!Array.isArray(c.faq)) return [];
  return (c.faq as Array<Record<string, unknown>>)
    .map((f) => ({ q: text(f?.q), a: text(f?.a) }))
    .filter((f) => f.q && f.a);
}

function structuredData(slug: string, c: Record<string, unknown>, seo: Seo): unknown {
  const personId = `${seo.canonical}#person`;
  const person: Record<string, unknown> = { "@type": "Person", "@id": personId, name: seo.name, url: seo.canonical };
  const role = text(c.title);
  if (role) person.jobTitle = role;
  if (seo.description) person.description = seo.description;
  if (text(c.avatarUrl).startsWith("https://")) person.image = text(c.avatarUrl);
  if (text(c.phone)) person.telephone = text(c.phone);
  if (text(c.email)) person.email = text(c.email);
  const service: Record<string, unknown> = {
    "@type": ["ProfessionalService", "MedicalBusiness"],
    "@id": `${seo.canonical}#service`,
    name: seo.name ? `${seo.name}${role ? `, ${role}` : ""}` : seo.title,
    url: seo.canonical,
    description: seo.description,
    founder: { "@id": personId },
    inLanguage: "he",
  };
  if (text(c.phone)) service.telephone = text(c.phone);
  if (text(c.email)) service.email = text(c.email);
  const graph: unknown[] = [person, service];
  const faq = faqOf(c);
  if (faq.length) {
    graph.push({
      "@type": "FAQPage",
      "@id": `${seo.canonical}#faq`,
      mainEntity: faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
    });
  }
  return { "@context": "https://schema.org", "@graph": graph };
}

function bodyHtml(c: Record<string, unknown>): string {
  const forYou = Array.isArray(c.forYouIf) ? (c.forYouIf as unknown[]).map(text).filter(Boolean) : [];
  const parts: string[] = [];
  parts.push(`<h1>${esc(text(c.keyPhrase) || text(c.fullName))}</h1>`);
  if (text(c.heroLine)) parts.push(`<p>${esc(text(c.heroLine))}</p>`);
  if (text(c.fullName)) parts.push(`<p><strong>${esc(text(c.fullName))}</strong>${text(c.title) ? `, ${esc(text(c.title))}` : ""}</p>`);
  if (text(c.about)) parts.push(`<h2>קצת עליי</h2><p>${esc(text(c.about))}</p>`);
  if (forYou.length) parts.push(`<h2>הדף הזה בשבילך אם</h2><ul>${forYou.map((l) => `<li>${esc(l)}</li>`).join("")}</ul>`);
  const steps = Array.isArray(c.firstSession) ? (c.firstSession as unknown[]).map(text).filter(Boolean) : [];
  if (steps.length) parts.push(`<h2>איך מתחילים</h2><ol>${steps.map((l) => `<li>${esc(l)}</li>`).join("")}</ol>`);
  const faq = faqOf(c);
  if (faq.length) parts.push(`<h2>שאלות נפוצות</h2>${faq.map((f) => `<h3>${esc(f.q)}</h3><p>${esc(f.a)}</p>`).join("")}`);
  const contact: string[] = [];
  if (text(c.phone)) contact.push(`<a href="tel:${esc(text(c.phone).replace(/[^\d+]/g, ""))}">${esc(text(c.phone))}</a>`);
  if (text(c.email)) contact.push(`<a href="mailto:${esc(text(c.email))}">${esc(text(c.email))}</a>`);
  if (text(c.location)) contact.push(esc(text(c.location)));
  if (contact.length) parts.push(`<h2>יצירת קשר</h2><p>${contact.join(" · ")}</p>`);
  return parts.join("");
}

const STYLE =
  "font-family:Assistant,Heebo,system-ui,sans-serif;max-width:640px;margin:0 auto;padding:56px 20px;line-height:1.7;color:#26272A;background:#F4EFE7;min-height:100vh";

const SHELL_META =
  /<meta\s+(?:name|property)="(?:description|og:title|og:description|og:url|og:image|og:type|twitter:title|twitter:description|twitter:image|robots)"[^>]*>\s*/gi;

function injectIntoShell(shell: string, headTags: string, rootHtml: string): string {
  let out = shell
    .replace(/<title>[\s\S]*?<\/title>\s*/i, "")
    .replace(SHELL_META, "")
    .replace(/<link\s+rel="canonical"[^>]*>\s*/gi, "")
    // the shell carries the home page's own structured data: it must not describe a therapist's page
    .replace(/<script\s+type="application\/ld\+json">[\s\S]*?<\/script>\s*/gi, "");
  out = out.replace(/<\/head>/i, () => `${headTags}</head>`);
  out = out.replace(/<div id="root">\s*<\/div>/i, () => `<div id="root">${rootHtml}</div>`);
  return out;
}

export function renderPage(shell: string, slug: string, row: SiteRow | null): string {
  if (!row) {
    const tags = `<title>הדף לא נמצא</title><meta name="robots" content="noindex, nofollow" />`;
    return injectIntoShell(shell, tags, "");
  }
  const c = row.content ?? {};
  const seo = seoFor(slug, c);
  const tags = [
    `<title>${esc(seo.title)}</title>`,
    `<meta name="description" content="${esc(seo.description)}" />`,
    `<link rel="canonical" href="${esc(seo.canonical)}" />`,
    `<meta name="robots" content="index, follow, max-image-preview:large" />`,
    `<meta property="og:type" content="profile" />`,
    `<meta property="og:title" content="${esc(seo.title)}" />`,
    `<meta property="og:description" content="${esc(seo.description)}" />`,
    `<meta property="og:url" content="${esc(seo.canonical)}" />`,
    `<meta property="og:image" content="${esc(seo.image)}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${esc(seo.title)}" />`,
    `<meta name="twitter:description" content="${esc(seo.description)}" />`,
    `<meta name="twitter:image" content="${esc(seo.image)}" />`,
    `<script type="application/ld+json">${jsonLd(structuredData(slug, c, seo))}</script>`,
  ].join("\n    ");
  const root = `<main lang="he" dir="rtl" style="${STYLE}">${bodyHtml(c)}</main>`;
  return injectIntoShell(shell, `    ${tags}\n  `, root);
}
