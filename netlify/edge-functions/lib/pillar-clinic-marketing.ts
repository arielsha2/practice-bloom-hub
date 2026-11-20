// The pillar page "שיווק קליניקה למטפלים" (/שיווק-קליניקה-למטפלים): its text, its structure and its links, in one place.
// Plain TypeScript, imported by the page (src/pages/ShivukKlinika.tsx) and by the build step in vite.config.ts that
// writes the page's text into the raw HTML, so crawlers that do not run JavaScript read the same page people see.
//
// To change the page: edit the text here. To add an article to a topic: add its slug to that topic's `slugs`.
// An article that is on no list still appears, under "more articles": every Hebrew article is linked from here.

import { articleLd, faqLd, howToLd as buildHowTo, ldScript } from "./schema.ts";
import { contentPath } from "./slug.ts";

export const PILLAR_PATH = "/שיווק-קליניקה-למטפלים";
export const PILLAR_URL = `https://therapykeys.co.il${encodeURI(PILLAR_PATH)}`;
export const PILLAR_TITLE = "שיווק קליניקה למטפלים — המדריך המלא | על שפת הקליניקה";
export const PILLAR_DESCRIPTION =
  'איך מטפלים ופסיכולוגים בונים שיווק קליניקה אותנטי? המדריך המלא של ד"ר אריאל שפירא ואליענה שפירא: 5 שלבים, מאמרים לפי נושא ותשובות לשאלות הנפוצות.';
export const PILLAR_H1 = 'שיווק קליניקה למטפלים — המדריך המלא של ד"ר אריאל שפירא';

// Fixed dates: a date that changed on every page load would tell crawlers the page is edited daily. Update
// DATE_MODIFIED when the guide's text really changes.
export const DATE_PUBLISHED = "2026-11-20";
export const DATE_MODIFIED = "2026-11-20";

export const INTRO =
  'שיווק קליניקה פרטית למטפלים הוא תהליך שונה לחלוטין משיווק עסקי רגיל — כי מטפל שמרגיש לא אותנטי לא יצליח לשווק לאורך זמן. הגישה של ד"ר אריאל שפירא מ-TherapyKeys מבוססת על עיקרון אחד: מצב פנימי נכון לפני כלים שיווקיים. מטפל שיודע מי הוא ומה הייחודיות שלו — ימשוך מטופלים שמתאימים לו, בלי להרגיש שהוא "מוכר את עצמו".';

export const WHY = {
  heading: "למה שיווק רגיל לא עובד למטפלים",
  intro: "שיווק קלאסי בנוי על העברת מסר מוצרי לקהל רחב. בעולם הטיפולי, זה לא רק לא עובד — זה גם פוגע באמון המקצועי. הנה למה:",
  points: [
    "המטפל הוא המוצר — אי אפשר להפריד בין מי שאתה לבין מה שאתה מציע.",
    "מטופלים בוחרים מטפל מתוך תחושת ביטחון ואמון, לא מתוך השוואת תכונות.",
    "טכניקות שיווק אגרסיביות סותרות את עמדת ההקשבה הטיפולית ויוצרות דיסוננס פנימי שמשתק.",
  ],
};

export interface Topic {
  id: string;
  title: string;
  intro: string;
  slugs: string[];
}

// The topics of the articles. Slugs are the stored addresses of the articles (they do not change with a title).
export const TOPICS: Topic[] = [
  {
    id: "topic-start",
    title: "המטופלים הראשונים",
    intro: "איך מגיעים למטופלים הראשונים בקליניקה פרטית, ומה עושים בשבועות הראשונים.",
    slugs: ["איך-משיגים-את-המטופלים-הראשונים-לקליניקה-פרטית"],
  },
  {
    id: "topic-identity",
    title: "זהות מקצועית ובידול",
    intro: "לפני כל ערוץ שיווקי צריך להיות ברור למי הקליניקה מיועדת ובמה היא מיוחדת, ובאיזו שפה מטופלים מזהים את זה.",
    slugs: [
      "האם-יש-לשירות-שלך-זהות-ייחודית-ובין-הורות-לשירות",
      "איש-טיפול-או-איש-עסקים-מי-אני-בדיוק",
      "האם-אני-מספיק-מקצוען",
      "מטפל-טוב-דיו-מעודכן",
      "שער-המראה",
      "שפת-הטיפול-ושפת-המכירה",
      "שפה-טיפולית-ושפה-עסקית-הילכו-שניהם-יחדיו",
    ],
  },
  {
    id: "topic-inner",
    title: "מצב פנימי וחסמים",
    intro: "פחד מנראות, ביקורת, חרדת נטישה ותחושת \"מי אני שאגיד\": החסמים שעוצרים מטפלים הרבה לפני שהגיעו לשאלה איזה ערוץ לבחור.",
    slugs: [
      "המכשול-הפנימי",
      "האומץ-לנראות",
      "חרדת-נטישה",
      "ביקורת",
      "מה-עושים-כשאין-שום-חשק-לקדם-את-הקליניקה",
      "הכוח-הפנימי-לשווק",
      "מחשבות-חוזרות-על-שיווק",
      "המשגה-וחוסר-בטחון",
    ],
  },
  {
    id: "topic-visibility",
    title: "נראות ושיווק אותנטי",
    intro: "איך להיות נראים ולדבר בשפה הטיפולית שלך, בלי שפה שיווקית מלאכותית ובלי להתפזר על יותר מדי ערוצים.",
    slugs: [
      "איך-משווקים-טיפול",
      "מיצוב-באמצעות-פוסטים",
      "לשווק-בעצמי-חלק-1",
      "know-like-trust-1",
      "know-like-trust-2",
      "האם-יש-למטפלים-פוטנציאל-שיווקי-או-שכל-ניסיון-נדון-לכישלון",
      "אאוטסורסינג",
      "דורות-של-פסיכולוגים-מצקצקים-כתיבת-תוכן",
    ],
  },
  {
    id: "topic-pricing",
    title: "תמחור וכסף",
    intro: "הקשר הרגשי לכסף, תמחור שמרגיש נכון, וכמה זה משפיע על כל מה שאחר כך.",
    slugs: [
      "בטחון-לתמחר-נכון",
      "מחיר-כערך-עצמי",
      "כסף-מצד-המטופלים",
      "טעינות-רגשית-סביב-כסף",
      "הלוואי-שיכולתי-לתת-את-הטיפול-חינם",
      "מטופלים-בשירות-הציבורי-והפרטי",
    ],
  },
  {
    id: "topic-business",
    title: "הקליניקה כעסק ואסטרטגיה",
    intro: "חשיבה אסטרטגית, מטרות וניהול הקליניקה כעסק, כולל בתקופות עמוסות ולחוצות.",
    slugs: [
      "הצורך-באסטרטגיה",
      "לעבור-לתכנון-אסטרטגי",
      "חשיבה-אסטרטגית",
      "קביעת-מטרות",
      "קליניקה-כעסק-1",
      "ניהול-העסק-בתקופות-מתח",
      "אפקט-הדומינו",
      "אין-לי-זמן-לעשות-כסף",
      "על-חיסכון-והוצאות",
      "האם-שוב-חסכת-מעעצמך",
      "אם-רק-הייתי-משקיע",
      "אם-רק-הייתי-משקיע-2",
    ],
  },
];

// Near copies of another article (the same text under a second title): linked from nowhere, so the page does not
// send readers and crawlers to the same text twice. The articles themselves stay on the site.
export const NOT_LINKED = ["אין-לי-זמן-לעשות-כסף-2", "אפקט-הדומינו-2", "outsourcing"];

export const MORE_TITLE = "עוד מאמרים";
export const MORE_ID = "topic-more";

export interface PillarArticle {
  slug: string | null;
  id: string;
  title: string;
}

export interface TopicWithArticles {
  id: string;
  title: string;
  intro: string;
  articles: PillarArticle[];
}

// Puts the published Hebrew articles under their topics (in the order written above). A topic keeps only articles
// that exist; whatever is on no list goes under "more articles", so a new article is linked as soon as it exists.
export function groupArticles(articles: PillarArticle[]): TopicWithArticles[] {
  const bySlug = new Map(articles.filter((a) => a.slug).map((a) => [a.slug as string, a]));
  const used = new Set<string>(NOT_LINKED);
  const out: TopicWithArticles[] = [];
  for (const topic of TOPICS) {
    const list: PillarArticle[] = [];
    for (const slug of topic.slugs) {
      const a = bySlug.get(slug);
      if (a && !used.has(slug)) {
        list.push(a);
        used.add(slug);
      }
    }
    if (list.length) out.push({ id: topic.id, title: topic.title, intro: topic.intro, articles: list });
  }
  const rest = articles.filter((a) => !(a.slug && used.has(a.slug)));
  if (rest.length) out.push({ id: MORE_ID, title: MORE_TITLE, intro: "מאמרים נוספים על הדרך אל קליניקה מלאה.", articles: rest });
  return out;
}

export const STEPS: { name: string; text: string; topic: string }[] = [
  {
    name: "הגדרת זהות מקצועית וייחודיות המטפל",
    text: "לפני כל כלי שיווקי — להגדיר מי אתה כמטפל, באיזו אוכלוסייה אתה הכי טוב, ומה הייחודיות שלך בחדר הטיפול.",
    topic: "topic-identity",
  },
  {
    name: "בניית מצב פנימי נכון לפני כלים שיווקיים",
    text: "לעבוד על החסמים הפנימיים — פחד מפרסום, תחושת 'מי אני שאגיד', בושה לבקש תשלום. בלי זה, שום כלי לא יחזיק לאורך זמן.",
    topic: "topic-inner",
  },
  {
    name: "בחירת ערוץ שיווק אחד ועקבי",
    text: "לא לפזר אנרגיה על חמישה ערוצים בבת אחת. לבחור ערוץ אחד — LinkedIn, פייסבוק מקצועי או Google My Business — ולהיות שם בעקביות.",
    topic: "topic-visibility",
  },
  {
    name: "יצירת נראות אותנטית — תוכן שמדבר בשפת המטפל",
    text: "לכתוב ולדבר בשפה הטיפולית שלך, לא בשפה שיווקית מלאכותית. מטופלים מזהים אותנטיות מקילומטרים.",
    topic: "topic-visibility",
  },
  {
    name: "בניית מערכת הפניות ומטופלים קבועים",
    text: "ליצור קשרים עם רופאי משפחה, קולגות, ומרכזים מקצועיים. הפניות הן עדיין המקור החזק ביותר למטופלים איכותיים.",
    topic: "topic-start",
  },
];

export const FAQS: { q: string; a: string }[] = [
  {
    q: "האם מותר לפסיכולוג לפרסם את עצמו?",
    a: "כן — האתיקה המקצועית מאפשרת פרסום כל עוד הוא אמיתי ולא מטעה. השאלה היא לא 'האם מותר' אלא 'איך לעשות זאת בצורה שמרגישה נכונה'.",
  },
  {
    q: "מה הדרך הכי יעילה למצוא מטופלים ראשונים?",
    a: "הפניות מקולגות ומכרים הן המקור המהיר ביותר. לאחר מכן — נוכחות עקבית בערוץ אחד: LinkedIn, קבוצות פייסבוק מקצועיות, או Google My Business.",
  },
  {
    q: "כמה זמן לוקח לבנות קליניקה מלאה?",
    a: "על פי הניסיון עם עשרות מטפלים ב-TherapyKeys — עם ליווי נכון, 3-6 חודשים מספיקים לעבור מקליניקה ריקה לקליניקה עם מטופלים קבועים.",
  },
  {
    q: "האם צריך אתר אינטרנט כדי לשווק קליניקה?",
    a: "לא חייב בשלב הראשון. פרופיל Google My Business מעודכן + LinkedIn פעיל יכולים להספיק בהתחלה. אתר הוא כלי חשוב לשלב השני.",
  },
  {
    q: "מה ההבדל בין שיווק קליניקה לשיווק עסק רגיל?",
    a: "בעסק רגיל אפשר להפריד בין המוצר לבין המוכר. בקליניקה — המטפל הוא המוצר. לכן שיווק שלא נובע מזהות אמיתית מרגיש מזויף ולא עובד לאורך זמן.",
  },
  {
    q: "מה זה \"מצב פנימי נכון לפני כלים שיווקיים\"?",
    a: "זה העיקרון שבבסיס הגישה: לפני שבוחרים ערוץ או כותבים פוסט, עובדים על מה שעוצר מטפלים מבפנים — פחד מנראות, ביקורת, תחושת \"מי אני שאגיד\" וקושי לבקש תשלום. כשהמצב הפנימי יציב, הכלים השיווקיים מחזיקים לאורך זמן.",
  },
  {
    q: "איך אפשר להתחיל בלי להתחייב לתוכנית?",
    a: "האבחון החינמי של TherapyKeys עוזר לזהות איפה בדיוק הקליניקה נתקעת: נישה ובידול, תמחור, הצגה עצמית, הפניות, קשרים עם עמיתים או שיחת היכרות ראשונה. אחרי האבחון מקבלים דוח עם צעדים מעשיים.",
  },
  {
    q: "מה אפשר לעשות כשיש תחושה של \"אני לא יודע לשווק את עצמי\"?",
    a: "זו אחת התחושות הנפוצות ביותר אצל מטפלים, והיא כמעט אף פעם לא עניין של חוסר כישרון. היא קשורה בדרך כלל לזהות מקצועית לא מנוסחת ולחסמים פנימיים, ולכן מתחילים מהם ולא מהכלים. כמה ממאמרי המדריך עוסקים בדיוק בזה.",
  },
];

export const ABOUT = {
  heading: "מי עומד מאחורי המדריך",
  people: [
    { name: 'ד"ר אריאל שפירא', role: "פסיכולוג קליני מומחה, מייסד TherapyKeys ('על שפת הקליניקה')" },
    { name: "אליענה שפירא", role: "יועצת חינוכית (M.A.), מטפלת זוגית ומשפחתית ומייסדת שותפה" },
  ],
  text: "TherapyKeys הוא מקום שבו מטפלים מנוסים מלווים מטפלים בבניית קליניקה פרטית מלאה, עם שיווק שמותאם לעולם הטיפול.",
};

export const CTA = {
  heading: "איך TherapyKeys עוזר למטפלים לשווק נכון",
  text: 'תוכנית "נקודת המפנה" של ד"ר אריאל שפירא היא ליווי של 3 חודשים שמתחיל מהמצב הפנימי של המטפל וממשיך לכלים שיווקיים אותנטיים. בסיום התוכנית — קליניקה עם מטופלים קבועים, זהות מקצועית ברורה יותר, ושיווק שמרגיש כמו המשך טבעי של עבודת הטיפול.',
  programLabel: "לפרטים על תוכנית נקודת המפנה",
  programPath: "/turning-point",
  diagnosisLabel: "לאבחון החינמי של הקליניקה",
  diagnosisPath: "/ai-assistants/practice-diagnosis",
};

export const TOC: { id: string; label: string }[] = [
  { id: "why", label: WHY.heading },
  { id: "steps", label: "איך בונים שיווק קליניקה שמרגיש אמיתי — 5 שלבים" },
  { id: "articles", label: "מאמרים לפי נושא" },
  { id: "faq", label: "השאלות שמטפלים שואלים הכי הרבה" },
  { id: "about", label: ABOUT.heading },
  { id: "next", label: "להתחיל" },
];

// Structured data: the same for the page (react-helmet) and for the raw HTML (build step), so one copy remains.
export function pillarJsonLd() {
  const guide = articleLd({
    headline: "שיווק קליניקה למטפלים — המדריך המלא",
    description: PILLAR_DESCRIPTION,
    url: PILLAR_URL,
    lang: "he",
    datePublished: DATE_PUBLISHED,
    dateModified: DATE_MODIFIED,
  });
  const howTo = {
    ...buildHowTo("he"),
    name: "איך בונים שיווק קליניקה שמרגיש אמיתי",
    description: '5 שלבים לשיווק קליניקה פרטית למטפלים לפי שיטת ד"ר אריאל שפירא',
    step: STEPS.map((s, i) => ({ "@type": "HowToStep", position: i + 1, name: s.name, text: s.text })),
  };
  return [guide, howTo, faqLd(FAQS)];
}

const esc = (v: string) => v.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

// The page's text as plain, semantic HTML: what a crawler without JavaScript reads. It sits inside <div id="root">
// until the app starts and replaces it, so it carries only light inline styling.
export function pillarBodyHtml(groups: TopicWithArticles[]): string {
  const topicIds = new Set(groups.map((g) => g.id));
  const link = (href: string, label: string) => `<a href="${esc(href)}">${esc(label)}</a>`;
  const toc = TOC.filter((t) => t.id !== "articles" || groups.length).map((t) => `<li>${link(`#${t.id}`, t.label)}</li>`).join("");
  const steps = STEPS.map(
    (s, i) =>
      `<li><h3>שלב ${i + 1}: ${esc(s.name)}</h3><p>${esc(s.text)}</p>${topicIds.has(s.topic) ? `<p>${link(`#${s.topic}`, "למאמרים בנושא")}</p>` : ""}</li>`,
  ).join("");
  const topics = groups
    .map(
      (g) =>
        `<section id="${g.id}"><h3>${esc(g.title)}</h3><p>${esc(g.intro)}</p><ul>${g.articles
          .map((a) => `<li>${link(encodeURI(contentPath({ id: a.id, slug: a.slug })), a.title.trim())}</li>`)
          .join("")}</ul></section>`,
    )
    .join("");
  const faq = FAQS.map((f) => `<h3>${esc(f.q)}</h3><p>${esc(f.a)}</p>`).join("");
  const people = ABOUT.people.map((p) => `<li><strong>${esc(p.name)}</strong> — ${esc(p.role)}</li>`).join("");
  return (
    `<main dir="rtl" lang="he" style="max-width:48rem;margin:0 auto;padding:6rem 1rem 3rem;font-family:Assistant,Arial,sans-serif;line-height:1.7">` +
    `<article><header><h1>${esc(PILLAR_H1)}</h1><p>${esc(INTRO)}</p></header>` +
    `<nav aria-label="תוכן עניינים"><h2>בדף הזה</h2><ul>${toc}</ul></nav>` +
    `<section id="why"><h2>${esc(WHY.heading)}</h2><p>${esc(WHY.intro)}</p><ul>${WHY.points.map((p) => `<li>${esc(p)}</li>`).join("")}</ul></section>` +
    `<section id="steps"><h2>${esc(TOC[1].label)}</h2><ol>${steps}</ol></section>` +
    (groups.length ? `<section id="articles"><h2>מאמרים לפי נושא</h2>${topics}</section>` : "") +
    `<section id="faq"><h2>${esc(TOC[3].label)}</h2>${faq}</section>` +
    `<section id="about"><h2>${esc(ABOUT.heading)}</h2><ul>${people}</ul><p>${esc(ABOUT.text)}</p></section>` +
    `<section id="next"><h2>${esc(CTA.heading)}</h2><p>${esc(CTA.text)}</p><p>${link(CTA.programPath, CTA.programLabel)} · ${link(CTA.diagnosisPath, CTA.diagnosisLabel)}</p></section>` +
    `</article></main>`
  );
}

// The head tags the pillar page needs, as script tags (the other head tags are replaced in the shell by the build step).
export const pillarJsonLdScripts = (): string => pillarJsonLd().map((ld) => ldScript(ld, `data-rh="true"`)).join("\n    ");
