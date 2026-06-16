import { Helmet } from "react-helmet-async";

const SITE_URL = "https://therapykeys.co.il";
const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.jpg`;

interface SEOHeadProps {
  title: string;
  description: string;
  canonicalUrl: string;
  ogImage?: string;
  ogType?: string;
  jsonLd?: object | object[];
  noindex?: boolean;
}

export const SEOHead = ({
  title,
  description,
  canonicalUrl,
  ogImage = DEFAULT_OG_IMAGE,
  ogType = "website",
  jsonLd,
  noindex = false,
}: SEOHeadProps) => {
  const fullCanonical = canonicalUrl.startsWith("http")
    ? canonicalUrl
    : `${SITE_URL}${canonicalUrl}`;
  const fullOgImage = ogImage.startsWith("http") ? ogImage : `${SITE_URL}${ogImage}`;
  const ldArray = jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : [];

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={fullCanonical} />

      {noindex && <meta name="robots" content="noindex, nofollow" />}

      {/* hreflang — mirror /path <-> /en/path for known bilingual routes */}
      {(() => {
        const path = canonicalUrl.startsWith("http") ? new URL(canonicalUrl).pathname : canonicalUrl;
        const isEn = path === "/en" || path.startsWith("/en/");
        const hePath = isEn ? (path === "/en" ? "/" : path.replace(/^\/en/, "")) : path;
        const enPath = isEn ? path : path === "/" ? "/en" : `/en${path}`;
        return (
          <>
            <link rel="alternate" hrefLang="he" href={`${SITE_URL}${hePath}`} />
            <link rel="alternate" hrefLang="en" href={`${SITE_URL}${enPath}`} />
            <link rel="alternate" hrefLang="x-default" href={`${SITE_URL}${hePath}`} />
          </>
        );
      })()}

      {/* Open Graph */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={fullCanonical} />
      <meta property="og:image" content={fullOgImage} />
      <meta property="og:locale" content="he_IL" />
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
