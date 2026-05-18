mport { Helmet } from "react-helmet-async";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const FAQ_ITEMS = [
  {
    q: 'איך משווקים את הקליניקה?',
    a: "שיווק קליניקה שונה מהותית משיווק מוצרים או שרות. שיווק הקליניקה לא צריך רק שלא יהיה אגרסיבי ומניפולטיבי באופן שסותר את המהות הטיפולית אלא חשוב שיהיה ממש חלק מהמעטפת הטיפולית שמציע המטפל.",
  },
  {
    q: 'האם כדאי לפנות לאנשי שיווק כדי לבנות את הקליניקה?',
    a: "אנשי שיווק מכירים היטב את הכלים השיווקים. כדי להפוך את השיווק להזמנה שהיא חלק בלתי נפרד מהתהליך הטיפולי עצמו יש צורך דווקא באנשי טיפול שמכירים גם את עולם השיווק",
  },
  {
    q: 'למי מיועד הליווי של ד"ר אריאל ואליענה שפירא?',
    a: "לפסיכולוגים, עובדים סוציאליים, מטפלים אלטרנטיביים ובעלי מקצועות הסיוע שרוצים לבנות קליניקה פרטית רווחית — בין אם בתחילת הדרך ובין אם כבר עובדים ורוצים להגדיל את ההכנסות. הליווי מיועד למטפלים שמבינים שכדי ששינוי מהותי יתרחש יש צורך בשינוי פנימי במקביל, חיזוק הביחטון העצמי המקצועי .",
  },
  {
    q: "איפה כדאי לי לפרסם?",
    a: 'פרסום ושיווק הם הזמנה לטיפול. חשוב לפרסם איפה שהמטופלים שמתאימים לך נמצאים',
  },
  {
    q: "איך אני יודע איפה הם נמצאים?",
    a: 'פה נדרשת היכולת האמפטית שלנו כמטפלים, להבין באופן מאוד מדויק, מי הם המטופלים שלנו, מה בדיוק קשה להם ואיפה הם מחפשים היום פתרונות לקשיים הללו',
  },
  {
    q: 'האם כדאי לבנות אתר אינטרנט ואם כן איפה ? ',
    a: 'אתר אינטרנט עשוי להגדיל את הניראות שלך ומתוך כך את הביטחון של המטופל הפוטנציאלי בך ובהחלטה להתחיל טיפול איתך. מיקום האתר תלוי, שוב, במי המטופל שלך',
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
