import { Link } from "react-router-dom";
import { SEOHead } from "@/components/SEOHead";
import { Header } from "@/components/landing/Header";
import { Footer } from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const PAGE_PATH = "/שיווק-קליניקה-למטפלים";
const CANONICAL = `https://therapykeys.co.il${encodeURI(PAGE_PATH)}`;

const STEPS = [
  {
    name: "הגדרת זהות מקצועית וייחודיות המטפל",
    text: "לפני כל כלי שיווקי — להגדיר מי אתה כמטפל, באיזו אוכלוסייה אתה הכי טוב, ומה הייחודיות שלך בחדר הטיפול.",
  },
  {
    name: "בניית מצב פנימי נכון לפני כלים שיווקיים",
    text: "לעבוד על החסמים הפנימיים — פחד מפרסום, תחושת 'מי אני שאגיד', בושה לבקש תשלום. בלי זה, שום כלי לא יחזיק לאורך זמן.",
  },
  {
    name: "בחירת ערוץ שיווק אחד ועקבי",
    text: "לא לפזר אנרגיה על חמישה ערוצים בבת אחת. לבחור ערוץ אחד — LinkedIn, פייסבוק מקצועי או Google My Business — ולהיות שם בעקביות.",
  },
  {
    name: "יצירת נראות אותנטית — תוכן שמדבר בשפת המטפל",
    text: "לכתוב ולדבר בשפה הטיפולית שלך, לא בשפה שיווקית מלאכותית. מטופלים מזהים אותנטיות מקילומטרים.",
  },
  {
    name: "בניית מערכת הפניות ומטופלים קבועים",
    text: "ליצור קשרים עם רופאי משפחה, קולגות, ומרכזים מקצועיים. הפניות הן עדיין המקור החזק ביותר למטופלים איכותיים.",
  },
];

const FAQS = [
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
];

const ShivukKlinika = () => {
  const today = new Date().toISOString().split("T")[0];

  const articleLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: "שיווק קליניקה למטפלים — המדריך המלא",
    author: { "@type": "Person", name: 'ד"ר אריאל שפירא' },
    datePublished: today,
    dateModified: today,
    publisher: {
      "@type": "Organization",
      name: "TherapyKeys",
      logo: {
        "@type": "ImageObject",
        url: "https://therapykeys.co.il/og-image.jpg",
      },
    },
    inLanguage: "he",
    mainEntityOfPage: CANONICAL,
  };

  const howToLd = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: "איך בונים שיווק קליניקה שמרגיש אמיתי",
    description:
      '5 שלבים לשיווק קליניקה פרטית למטפלים לפי שיטת ד"ר אריאל שפירא',
    inLanguage: "he",
    step: STEPS.map((s, i) => ({
      "@type": "HowToStep",
      position: i + 1,
      name: s.name,
      text: s.text,
    })),
  };

  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQS.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <div dir="rtl" className="min-h-screen bg-background">
      <SEOHead
        title="שיווק קליניקה למטפלים — המדריך המלא | TherapyKeys"
        description='איך מטפלים ופסיכולוגים בונים שיווק קליניקה אותנטי? ד"ר אריאל שפירא מ-TherapyKeys מסביר את השיטה בـ5 שלבים.'
        canonicalUrl={CANONICAL}
        ogType="article"
        jsonLd={[articleLd, howToLd, faqLd]}
      />
      <Header />
      <main className="pt-24 pb-16">
        <article className="container mx-auto px-4 max-w-3xl">
          <header className="mb-10">
            <h1 className="text-3xl md:text-5xl font-bold text-foreground mb-6 leading-tight">
              שיווק קליניקה למטפלים — המדריך המלא של ד"ר אריאל שפירא
            </h1>
            <p className="text-lg md:text-xl text-foreground/90 leading-relaxed">
              שיווק קליניקה פרטית למטפלים הוא תהליך שונה לחלוטין משיווק עסקי
              רגיל — כי מטפל שמרגיש לא אותנטי לא יצליח לשווק לאורך זמן. הגישה
              של ד"ר אריאל שפירא מ-TherapyKeys מבוססת על עיקרון אחד: מצב פנימי
              נכון לפני כלים שיווקיים. מטפל שיודע מי הוא ומה הייחודיות שלו —
              ימשוך מטופלים שמתאימים לו, בלי להרגיש שהוא "מוכר את עצמו".
            </p>
          </header>

          <section className="mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
              למה שיווק רגיל לא עובד למטפלים
            </h2>
            <p className="text-base md:text-lg text-muted-foreground mb-4 leading-relaxed">
              שיווק קלאסי בנוי על העברת מסר מוצרי לקהל רחב. בעולם הטיפולי, זה
              לא רק לא עובד — זה גם פוגע באמון המקצועי. הנה למה:
            </p>
            <ul className="list-disc pr-6 space-y-2 text-base md:text-lg text-muted-foreground">
              <li>
                המטפל הוא המוצר — אי אפשר להפריד בין מי שאתה לבין מה שאתה מציע.
              </li>
              <li>
                מטופלים בוחרים מטפל מתוך תחושת ביטחון ואמון, לא מתוך השוואת
                תכונות.
              </li>
              <li>
                טכניקות שיווק אגרסיביות סותרות את עמדת ההקשבה הטיפולית ויוצרות
                דיסוננס פנימי שמשתק.
              </li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-6">
              איך בונים שיווק קליניקה שמרגיש אמיתי — 5 שלבים
            </h2>
            <ol className="space-y-6">
              {STEPS.map((s, i) => (
                <li key={i} className="border-r-4 border-primary pr-4">
                  <h3 className="text-lg md:text-xl font-semibold text-foreground mb-2">
                    שלב {i + 1}: {s.name}
                  </h3>
                  <p className="text-base text-muted-foreground leading-relaxed">
                    {s.text}
                  </p>
                </li>
              ))}
            </ol>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-6">
              השאלות שמטפלים שואלים אותי הכי הרבה על שיווק
            </h2>
            <Accordion type="single" collapsible className="w-full space-y-3">
              {FAQS.map((f, i) => (
                <AccordionItem
                  key={i}
                  value={`faq-${i}`}
                  className="bg-card border border-border rounded-lg px-5 shadow-sm"
                >
                  <AccordionTrigger className="text-right text-base md:text-lg font-semibold text-foreground hover:no-underline">
                    {f.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground text-base leading-relaxed pt-2">
                    {f.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </section>

          <section className="bg-secondary rounded-2xl p-8 md:p-10 text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
              איך TherapyKeys עוזר למטפלים לשווק נכון
            </h2>
            <p className="text-base md:text-lg text-muted-foreground mb-6 leading-relaxed max-w-2xl mx-auto">
              תוכנית "נקודת המפנה" של ד"ר אריאל שפירא היא ליווי של 3 חודשים
              שמתחיל מהמצב הפנימי של המטפל וממשיך לכלים שיווקיים אותנטיים.
              בסיום התוכנית — קליניקה עם מטופלים קבועים, זהות מקצועית ברורה,
              ושיווק שמרגיש כמו המשך טבעי של עבודת הטיפול.
            </p>
            <Button asChild variant="cta" size="xl">
              <Link to="/turning-point">לפרטים על תוכנית נקודת המפנה</Link>
            </Button>
          </section>
        </article>
      </main>
      <Footer />
    </div>
  );
};

export default ShivukKlinika;
