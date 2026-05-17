
# שיפור GEO (Generative Engine Optimization)

מטרה: שמנועים גנרטיביים (ChatGPT, Perplexity, Claude, Google AI Overviews) יזהו את TherapyKeys כסמכות בתחום ליווי מטפלים, יצטטו נכון את ד"ר אריאל שפירא ויסכמו את התוכן באופן מדויק.

הביצוע נעשה בדיוק לפי הסדר שביקשת — תוכן ו-schema בלבד, ללא שינויי עיצוב.

## 1. תיקון קנונים לדומיין `therapykeys.co.il`

- `index.html`: `<link rel="canonical">` ו-`og:url` ו-`og:image` ו-`twitter:image` → כולם על `therapykeys.co.il` (כבר כך). אוודא עקביות.
- `public/sitemap.xml` כבר משתמש ב-`therapykeys.co.il` — אוודא שכל ה-URLs נקיים.
- `public/robots.txt`: `Sitemap:` → `https://therapykeys.co.il/sitemap.xml`.
- `src/components/SEOHead.tsx`: ה-`SITE_URL` כבר `https://therapykeys.co.il` ✓.

## 2. JSON-LD ב-`index.html`

אוסיף לתוך `<head>` חמישה בלוקי `<script type="application/ld+json">`:

1. **Organization** — TherapyKeys, founder ד"ר אריאל שפירא
2. **Person** — ד"ר אריאל שפירא עם `hasCredential` (Ph.D, אוניברסיטת ת"א, 2020-07-16, נושא דוקטורט), `knowsAbout`, `alumniOf`
3. **WebSite** — עם `potentialAction` של `SearchAction` המצביע על `/contents?q={search_term_string}`
4. **Course** — "נקודת המפנה", `timeRequired: P3M`, `provider` עם reference ל-Organization
5. **HowTo** — "כיצד בונים קליניקה פרטית רווחית" עם 5 השלבים המדויקים שציינת

הערה טכנית: כל הציטוטים בעברית בתוך JSON-LD ייכתבו בתוך `<script>` רגיל (לא attribute), כך שאין צורך ב-escaping של מירכאות מעבר ל-JSON תקני.

ה-FAQPage schema נוסף בסעיף 3 דרך הקומפוננטה (לא ב-index.html), כדי שיהיה צמוד לתוכן הנראה.

## 3. רכיב FAQ נראה + FAQPage schema

- חדש: `src/components/landing/FAQ.tsx` — Accordion (משתמש ב-`@/components/ui/accordion` הקיים) עם 5 השאלות־תשובות המדויקות שסיפקת. כותרת סקציה: "שאלות שמטפלים שואלים".
- בתוך הקומפוננטה: `<Helmet>` עם `<script type="application/ld+json">` של `FAQPage` כך ש-Q&A זהים בדיוק לטקסט הגלוי (קריטי לוואלידציה של Google).
- שילוב ב-`src/pages/Index.tsx`: מוסיף `<FAQ />` בתוך `<main>` לפני `<CTABanner />` (כך שה-FAQ ממש מעל ה-CTA הסופי, לפני ה-footer — לפי הבקשה).
- עיצוב: שימוש בטוקנים קיימים (Heebo, Lavender White bg, Deep Purple כותרות). ללא שינוי קומפוננטות אחרות.

## 4. שדרוג `SEOHead` (סעיף 6 בבקשה — מקודם בסדר הביצוע)

`SEOHead` כבר תומך ב-`jsonLd?: object | object[]` ומרנדר מערך של בלוקי JSON-LD. **אין שינוי נדרש** — אאמת רק ואציין במפורש בפלט.

## 5. Article schema דינמי ב-`ContentDetail.tsx`

ה-Article schema כבר קיים בסיסי. אעשיר אותו:
- `datePublished` מהשדה `published_at` מה-DB (כשמכוון לפרסום)
- `inLanguage: "he"`
- `wordCount` מחושב מהתוכן (strip של HTML, ספירת מילים)
- `author` כ-Person מלא עם link ל-Organization
- `publisher` כ-Organization עם `logo`
- `mainEntityOfPage` עם ה-URL הקנוני

**עבור 10 המאמרים שציינת עם תאריכים** — התאריכים כבר נשמרים ב-`published_at` בכל שורה ב-DB. ה-schema יקרא משם אוטומטית. **אם תאריכי הפרסום ב-DB אינם תואמים לרשימה שלך**, אצטרך אישור אם:
  (א) לעדכן את ה-DB דרך migration, או
  (ב) למפות hard-coded לפי כותרת בקובץ, או
  (ג) להשאיר כפי שיש ב-DB. — **המתנה לאישור לפני שאגע ב-DB.**

## 6. SoftwareApplication schema ב-`BotChat.tsx`

לכל בוט, אוסיף JSON-LD דרך ה-`SEOHead jsonLd` prop:
- `@type: "SoftwareApplication"`
- `applicationCategory: "HealthApplication"`
- `name: botName` (לפי שפת המשתמש)
- `creator`: Person ד"ר אריאל שפירא
- `inLanguage: "he"`
- `offers: { @type: "Offer", price: "0", priceCurrency: "ILS" }`
- `operatingSystem: "Web"`

## 7. `public/llms-full.txt`

קובץ חדש בנוסף ל-`llms.txt` הקיים, עם בדיוק המבנה והטקסט שסיפקת (פרופיל ד"ר שפירא, עקרונות מפתח, קהל יעד, FAQ, קישורים). הקיים `llms.txt` נשאר ככיווץ.

## 8. עדכון `public/robots.txt`

אוסיף בלוקים מפורשים מעל `User-agent: *` הקיים:
```
User-agent: GPTBot
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: GoogleOther
Allow: /
```
ה-`Disallow` הקיימים (`/portal`, `/dashboard` וכו') יישמרו תחת `User-agent: *`.

---

## קבצים שיושפעו

```text
edit    index.html                         # 5 בלוקי JSON-LD + ודא קנונים
edit    public/sitemap.xml                 # ודא דומיין
edit    public/robots.txt                  # בלוקי AI crawlers
edit    src/pages/Index.tsx                # שילוב <FAQ /> לפני <CTABanner />
edit    src/pages/ContentDetail.tsx        # Article schema מועשר
edit    src/pages/BotChat.tsx              # SoftwareApplication schema
new     src/components/landing/FAQ.tsx     # accordion + FAQPage schema
new     public/llms-full.txt               # פרופיל מלא למנועי AI
verify  src/components/SEOHead.tsx         # כבר תומך ב-jsonLd; ללא שינוי
```

## שאלה אחת לפני התחלה

**תאריכי הפרסום של 10 המאמרים** — האם אתה רוצה שאוודא/אעדכן את `published_at` ב-DB לפי הרשימה שסיפקת (דורש migration), או רק להשתמש במה שכבר קיים ב-DB עבור ה-`Article` schema?
