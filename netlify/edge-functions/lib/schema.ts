// Structured data (JSON-LD) for the site, in one place. Plain TypeScript with no imports and no browser or Deno APIs,
// so the same functions run in the app (react-helmet), in the build (index.html, vite.config.ts) and on the
// Netlify edge (the raw HTML that crawlers and AI engines read without running JavaScript).
//
// Every function takes the page language ("he" | "en"): the site is Hebrew first and will grow in English, so the
// entities carry both languages' names and the text follows the page.
//
// Facts here come from the owners: the founders' roles, the social profiles (Facebook and Instagram of the brand,
// Ariel's LinkedIn) and the brand's Instagram bio. Add Eliana's own profile links to ELIANA.sameAs when she has them.

export type Lang = "he" | "en";

export const SITE = "https://therapykeys.co.il";
export const LOGO = `${SITE}/og-image.jpg`;

export const IDS = {
  org: `${SITE}/#organization`,
  website: `${SITE}/#website`,
  ariel: `${SITE}/#ariel-shapira`,
  eliana: `${SITE}/#eliana-shapira`,
};

export const SOCIAL = {
  facebook: "https://www.facebook.com/ashaklinika/",
  instagram: "https://www.instagram.com/sfat_clinica/",
  arielLinkedin: "https://www.linkedin.com/in/dr-ariel-shapira-phd-00703ba8/",
};

const t = <T,>(lang: Lang, he: T, en: T): T => (lang === "he" ? he : en);

export function arielLd(lang: Lang) {
  return {
    "@type": "Person",
    "@id": IDS.ariel,
    name: t(lang, 'ד"ר אריאל שפירא', "Dr. Ariel Shapira"),
    alternateName: t(lang, "Dr. Ariel Shapira", 'ד"ר אריאל שפירא'),
    jobTitle: t(lang, "פסיכולוג קליני מומחה", "Clinical Psychologist"),
    description: t(
      lang,
      "פסיכולוג קליני, מייסד TherapyKeys ('על שפת הקליניקה'), שמלווה מטפלים בבניית קליניקה פרטית מלאה ויציבה בשיווק שמותאם לעולם הטיפול.",
      "Clinical psychologist and founder of TherapyKeys, helping therapists build thriving private practices with empathic marketing.",
    ),
    url: SITE,
    sameAs: [SOCIAL.arielLinkedin],
    alumniOf: { "@type": "CollegeOrUniversity", name: t(lang, "אוניברסיטת תל אביב", "Tel Aviv University"), sameAs: "https://en.wikipedia.org/wiki/Tel_Aviv_University" },
    knowsAbout: t(
      lang,
      ["בניית קליניקה פרטית", "שיווק למטפלים", "ליווי עסקי למטפלים", "פסיכולוגיה קלינית", "Clean Language", "SFBT, טיפול ממוקד פתרון"],
      ["building a private practice", "marketing for therapists", "business coaching for therapists", "clinical psychology", "Clean Language", "SFBT, solution-focused brief therapy"],
    ),
    hasCredential: {
      "@type": "EducationalOccupationalCredential",
      credentialCategory: "Doctoral Degree",
      name: "Doctor of Philosophy (Ph.D)",
      educationalLevel: "Ph.D",
      recognizedBy: { "@type": "CollegeOrUniversity", name: t(lang, "אוניברסיטת תל אביב", "Tel Aviv University") },
    },
    worksFor: { "@id": IDS.org },
    address: { "@type": "PostalAddress", addressCountry: "IL" },
  };
}

export function elianaLd(lang: Lang) {
  return {
    "@type": "Person",
    "@id": IDS.eliana,
    name: t(lang, "אליענה שפירא", "Eliana Shapira"),
    alternateName: t(lang, "Eliana Shapira", "אליענה שפירא"),
    jobTitle: t(lang, "יועצת חינוכית (M.A.) ומטפלת זוגית ומשפחתית", "M.A. Educational Counselor, Couples and Family Therapist"),
    description: t(
      lang,
      "מטפלת זוגית ומשפחתית, מייסדת שותפה של TherapyKeys ('על שפת הקליניקה'), שמלווה מטפלים בבניית קליניקה פרטית.",
      "Couples and family therapist, co-founder of TherapyKeys, helping therapists build private practices.",
    ),
    url: SITE,
    worksFor: { "@id": IDS.org },
    address: { "@type": "PostalAddress", addressCountry: "IL" },
  };
}

export function organizationLd(lang: Lang) {
  return {
    "@type": ["Organization", "ProfessionalService"],
    "@id": IDS.org,
    name: t(lang, "על שפת הקליניקה", "TherapyKeys"),
    alternateName: t(lang, ["TherapyKeys", "Therapy Keys"], ["Therapy Keys", "על שפת הקליניקה"]),
    url: SITE,
    logo: { "@type": "ImageObject", url: LOGO },
    description: t(
      lang,
      "מטפלים מנוסים שעוזרים למטפלים להגיע לקליניקה מלאה ומתגמלת, עם שיווק שמותאם לעולם הטיפול.",
      "Experienced therapists helping therapists reach a full, rewarding private practice, with marketing that fits the world of therapy.",
    ),
    founder: [arielLd(lang), elianaLd(lang)],
    sameAs: [SOCIAL.facebook, SOCIAL.instagram],
    areaServed: { "@type": "Country", name: "Israel" },
    serviceType: t(
      lang,
      ["ליווי עסקי למטפלים", "שיווק לקליניקה פרטית", "הדרכה מקצועית לפסיכולוגים ולמטפלים"],
      ["business coaching for therapists", "marketing for private practices", "professional training for psychologists and therapists"],
    ),
    availableLanguage: ["Hebrew", "English"],
  };
}

export function websiteLd(lang: Lang) {
  return {
    "@type": "WebSite",
    "@id": IDS.website,
    name: t(lang, "על שפת הקליניקה", "TherapyKeys"),
    alternateName: "TherapyKeys",
    url: SITE,
    inLanguage: ["he", "en"],
    publisher: { "@id": IDS.org },
    potentialAction: {
      "@type": "SearchAction",
      target: { "@type": "EntryPoint", urlTemplate: `${SITE}/contents?q={search_term_string}` },
      "query-input": "required name=search_term_string",
    },
  };
}

// Site-wide (index.html, so every route's raw HTML carries it): who the organization is and who runs it.
export function siteLdGraph(lang: Lang = "he") {
  return { "@context": "https://schema.org", "@graph": [organizationLd(lang), websiteLd(lang)] };
}

// Home page only: what is offered. (HowTo and Course used to sit in the shell and so described EVERY page.)
export function courseLd(lang: Lang) {
  return {
    "@context": "https://schema.org",
    "@type": "Course",
    "@id": `${SITE}/turning-point#course`,
    name: t(lang, "נקודת המפנה", "Turning Point"),
    description: t(
      lang,
      "תוכנית ליווי של 3 חודשים למטפלים ופסיכולוגים לבניית קליניקה פרטית רווחית",
      "A 3-month coaching program for therapists and psychologists to build a profitable private practice",
    ),
    url: `${SITE}/turning-point`,
    inLanguage: lang,
    timeRequired: "P3M",
    educationalLevel: t(lang, "מטפלים מוסמכים, פסיכולוגים, עובדים סוציאליים", "licensed therapists, psychologists, social workers"),
    provider: { "@id": IDS.org },
    instructor: { "@id": IDS.ariel },
    hasCourseInstance: { "@type": "CourseInstance", courseMode: "Blended", inLanguage: lang },
  };
}

export function howToLd(lang: Lang) {
  const steps = t(
    lang,
    [
      ["הגדרת זהות מקצועית", "הגדרת זהות מקצועית וייחודיות המטפל"],
      ["בניית מצב פנימי", "בניית מצב פנימי נכון לפני כלים שיווקיים"],
      ["תמחור ומודל הכנסות", "תימחור נכון ובניית מודל הכנסות"],
      ["נראות ושיווק אותנטי", "בניית נראות ושיווק אותנטי"],
      ["מערכת הפניות", "יצירת מערכת הפניות ומטופלים קבועים"],
    ],
    [
      ["Define your professional identity", "Define your professional identity and what makes you distinct"],
      ["Build the right inner stance", "Build the right inner stance before the marketing tools"],
      ["Pricing and income model", "Price correctly and build an income model"],
      ["Authentic visibility", "Build authentic visibility and marketing"],
      ["A referral system", "Create a referral system and regular clients"],
    ],
  );
  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: t(lang, "כיצד בונים קליניקה פרטית רווחית", "How to build a profitable private practice"),
    description: t(
      lang,
      "תהליך לבניית קליניקה פרטית מצליחה לפי שיטת ד\"ר אריאל שפירא",
      "A process for building a successful private practice, by Dr. Ariel Shapira's method",
    ),
    inLanguage: lang,
    totalTime: "P3M",
    step: steps.map(([name, text], i) => ({ "@type": "HowToStep", position: i + 1, name, text })),
  };
}

export function homeLd(lang: Lang) {
  return [courseLd(lang), howToLd(lang)];
}

// An article or guide. The author is the person (named in full, so the page stands alone for a crawler); the
// publisher is the organization, whose founders are in the site-wide graph.
export function articleLd(a: {
  headline: string;
  description: string;
  url: string;
  lang: Lang;
  image?: string | null;
  datePublished?: string | null;
  dateModified?: string | null;
  wordCount?: number;
}) {
  const author = arielLd(a.lang);
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: a.headline,
    description: a.description,
    inLanguage: a.lang,
    ...(a.image ? { image: a.image } : {}),
    ...(a.datePublished ? { datePublished: a.datePublished } : {}),
    ...(a.dateModified || a.datePublished ? { dateModified: a.dateModified ?? a.datePublished } : {}),
    ...(a.wordCount ? { wordCount: a.wordCount } : {}),
    author: { "@type": "Person", "@id": author["@id"], name: author.name, jobTitle: author.jobTitle, url: SITE, sameAs: author.sameAs },
    publisher: { "@type": "Organization", "@id": IDS.org, name: t(a.lang, "על שפת הקליניקה", "TherapyKeys"), url: SITE, logo: { "@type": "ImageObject", url: LOGO } },
    mainEntityOfPage: { "@type": "WebPage", "@id": a.url },
  };
}

export function faqLd(items: { q: string; a: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.q.trim(),
      acceptedAnswer: { "@type": "Answer", text: item.a.trim() },
    })),
  };
}

// <script> text: "<" escaped so nothing in a title or an answer can close the tag.
export const ldScript = (obj: unknown, attrs = ""): string =>
  `<script type="application/ld+json"${attrs ? ` ${attrs}` : ""}>${JSON.stringify(obj).replace(/</g, "\\u003c")}</script>`;
