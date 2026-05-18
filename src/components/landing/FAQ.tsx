mport { Helmet } from "react-helmet-async";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const FAQ_ITEMS = [
  {
    q: 'מה זה "על שפת הקליניקה" ולמה זה שונה מהכשרות אחרות?',
    a: '"על שפת הקליניקה" היא פךטפורה למטפלים שהקימו ד"ר אריאל ואליענה שפירא. הגישה שמייחדת אותם היא ההבנה שחייבת להיות הלימה בין העולם הפנימי של המטפל, הביטחון שלו בערך ובטיפול שהוא נותן והמעשים והצעדיים השיווקים והעיסקיים. ללא הלימה תתעכב העשייה או לחילופין תיעשה באופן מנותק ולא מחובר ואותנטי. .',
  },
  {
    q: 'למי מיועד הליווי של ד"ר אריאל שפירא?',
    a: "לפסיכולוגים, עובדים סוציאליים, מטפלים אלטרנטיביים ובעלי מקצועות הסיוע שרוצים לבנות קליניקה פרטית רווחית — בין אם בתחילת הדרך ובין אם כבר עובדים ורוצים להגדיל את ההכנסות.",
  },
  {
    q: "כמה זמן לוקח לבנות קליניקה פרטית רווחית?",
    a: 'לפי הניסיון של ד"ר שפירא עם עשרות מטפלים, עם ליווי נכון ניתן לראות שינוי משמעותי תוך 3 חודשים — זו אחת הסיבות שתוכנית "נקודת המפנה" בנויה כתוכנית של 3 חודשים.',
  },
  {
    q: "מהי גישת Clean Language ואיך היא משמשת בטיפול?",
    a: 'Clean Language היא שפת שאלות שפותחה על ידי David Grove שמאפשרת למטפל לחקור את עולם המטופל ללא הטלת פרשנויות. ד"ר שפירא משלב גישה זו עם SFBT (טיפול ממוקד פתרון) ליצירת שפה טיפולית שמחזקת את המטופל.',
  },
  {
    q: 'מה ההבדל בין תוכנית "נקודת המפנה" לבין ליווי פרטני?',
    a: '"נקודת המפנה" היא תוכנית מובנית של 3 חודשים עם מפגשי קבוצה, תכנים וכלים מסודרים. הליווי הפרטני מתאים למי שמעדיף לעבוד בקצב אישי ולהתמקד בצרכים הספציפיים של הקליניקה שלו.',
  },
];

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQ_ITEMS.map((item) => ({
    "@type": "Question",
    name: item.q,
    acceptedAnswer: {
      "@type": "Answer",
      text: item.a,
    },
  })),
};

export const FAQ = () => {
  return (
    <section
      id="faq"
      className="py-20 bg-secondary"
      aria-labelledby="faq-heading"
    >
      <Helmet>
        <script type="application/ld+json">{JSON.stringify(faqJsonLd)}</script>
      </Helmet>
      <div className="container mx-auto px-4 max-w-3xl">
        <header className="text-center mb-12">
          <h2
            id="faq-heading"
            className="text-3xl md:text-4xl font-bold text-foreground mb-3"
          >
            שאלות שמטפלים שואלים
          </h2>
          <p className="text-muted-foreground text-lg">
            כל מה שחשוב לדעת לפני שמתחילים
          </p>
        </header>

        <Accordion type="single" collapsible className="w-full space-y-3">
          {FAQ_ITEMS.map((item, idx) => (
            <AccordionItem
              key={idx}
              value={`item-${idx}`}
              className="bg-card border border-border rounded-lg px-5 shadow-sm"
            >
              <AccordionTrigger className="text-right text-base md:text-lg font-semibold text-foreground hover:no-underline">
                {item.q}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground text-base leading-relaxed pt-2">
                {item.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
};

export default FAQ;
