import { useEffect } from "react";
import { Helmet } from "react-helmet-async";

const SITE_URL = "https://therapykeys.co.il";
const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.jpg`;

type Lang = "he" | "en";

interface SEOHeadProps {
  title: string;
  description: string;
  canonicalUrl: string;
  ogImage?: string;
  ogType?: string;
  jsonLd?: object | object[];
  noindex?: boolean;
  /** The page's language. Default: English under /en, Hebrew everywhere else. */
  lang?: Lang;
  /**
   * The same page in the other language, only where one really exists (e.g. { he: "/", en: "/en" }). hreflang
   * tags are written only for these: a tag that points at a page that does not exist tells crawlers the wrong thing.
   */
  alternates?: { he?: string; en?: string };
}

const abs = (u: string) => (u.startsWith("http") ? u : `${SITE_URL}${u}`);
const pathOf = (u: string) => (u.startsWith("http") ? new URL(u).pathname : u);

export const SEOHead = ({
  title,
  description,
  canonicalUrl,
  ogImage = DEFAULT_OG_IMAGE,
  ogType = "website",
  jsonLd,
  noindex = false,
  lang: langProp,
  alternates,
}: SEOHeadProps) => {
  const fullCanonical = abs(canonicalUrl);
  const fullOgImage = abs(ogImage);
  const ldArray = jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : [];
  const path = pathOf(canonicalUrl);
  const lang: Lang = langProp ?? (path === "/en" || path.startsWith("/en/") ? "en" : "he");

  // The page's language and direction on <html> (the static shell says Hebrew / RTL for every route). Restored
  // when the page goes away, so a page without SEOHead is never left with the previous page's direction.
  useEffect(() => {
    const el = document.documentElement;
    const before = { lang: el.getAttribute("lang"), dir: el.getAttribute("dir") };
    el.setAttribute("lang", lang);
    el.setAttribute("dir", lang === "en" ? "ltr" : "rtl");
    return () => {
      if (before.lang) el.setAttribute("lang", before.lang);
      if (before.dir) el.setAttribute("dir", before.dir);
    };
  }, [lang]);

  const hasAlternates = !!(alternates?.he || alternates?.en);

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={fullCanonical} />

      {noindex && <meta name="robots" content="noindex, nofollow" />}

      {/* hreflang: only for the pages that have a counterpart in the other language (see the prop) */}
      {hasAlternates && alternates?.he && <link rel="alternate" hrefLang="he" href={abs(alternates.he)} />}
      {hasAlternates && alternates?.en && <link rel="alternate" hrefLang="en" href={abs(alternates.en)} />}
      {hasAlternates && <link rel="alternate" hrefLang="x-default" href={abs(alternates?.he ?? alternates?.en ?? canonicalUrl)} />}

      {/* Open Graph */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={fullCanonical} />
      <meta property="og:image" content={fullOgImage} />
      <meta property="og:locale" content={lang === "en" ? "en_US" : "he_IL"} />
      <meta property="og:site_name" content="TherapyKeys" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={fullOgImage} />

      {/* JSON-LD */}
      {ldArray.map((ld, i) => (
        <script key={i} type="application/ld+json">
          {JSON.stringify(ld)}
        </script>
      ))}
    </Helmet>
  );
};

export default SEOHead;
