import { motion } from "framer-motion";
import { Quote } from "lucide-react";

const testimonials = [
  {
    name: "מרים",
    role: 'עו"סית קלינית',
    quote:
      "הייתי במקום אחר לגמרי, מדשדשת במחשבות של איך ואיפה. היום אני עם הרבה פחות פחד, עם הרבה ידע איך לעשות את זה נכון, איך לשווק ולתמחר נכון. התהליך היה מאוד משמעותי - היום מגיעים לקליניקה מטופלים שאני רוצה לעבוד איתם. ההדרכה נותנת הרבה מעבר לרק ידע, היא נותנת גם תודעה אחרת ושונה.",
    initials: "מ",
  },
  {
    name: "ל.פ",
    role: "פסיכולוגית קלינית",
    quote:
      'נרשמתי ל"על שפת הקליניקה" בתקופה של קליניקה בתחילת דרכה, בה היו מעט פניות. במהלך הקורס חידדתי את החשיבה על מי אני כפסיכולוגית, ומה אני מעוניינת לתת למטופלים שלי. העברתי זאת החוצה ללא התנצלות ועם הבנה של מה אני יכולה לתת בטיפול. די מהר הקליניקה החלה לפרוח.',
    initials: "ל.פ",
  },
  {
    name: "פרופ' יוני גז",
    role: "ראש המגמה לפסיכולוגיה קלינית, מכללת אחווה",
    quote:
      'הקורס שבנו ד"ר אריאל שפירא ואליענה שפירא "על שפת הקליניקה" נותן מקום לשאלות שכל מטפל מכיר על הצד העסקי של הקליניקה, ומצמיח את כולנו להיות אנשי מקצוע טובים יותר.',
    initials: "י.ג",
  },
  {
    name: "רחל",
    role: 'עו"סית קלינית',
    quote:
      "קיבלתי תקווה, אופטימיות והכוונה שיש דרך ברורה להקים קליניקה - עם לקיחת צעדים קונקרטיים ומעשיים. יש תוכנית שמאפשרת למטפל להשיג את המטרות, לבנות את הקליניקה בשלבים.",
    initials: "ר",
  },
  {
    name: "שירה",
    role: "פסיכולוגית קלינית",
    quote:
      "הרגשתי שבניתם תכנית מאוד מושקעת, רצינית ומקיפה, עם הרבה מחשבה ולב מאחוריה. התכנים היו בנויים ומוצגים באופן מסקרן ונעים לעין, וכללו שילוב חשוב ורלוונטי של תוכן פרקטי ותוכן רגשי. שמחתי מאוד להכיר אתכם וללמוד מכם.",
    initials: "ש",
  },
];

export function Testimonials() {
  return (
    <section className="py-24 bg-background relative overflow-hidden" dir="rtl">
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-0 w-[400px] h-[400px] bg-accent/5 rounded-full blur-[100px] -translate-y-1/2" />
        <div className="absolute top-1/2 right-0 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[100px] -translate-y-1/2" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Section header */}
        <motion.div
          className="text-center max-w-2xl mx-auto mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <span className="inline-block text-primary font-medium text-sm mb-4 tracking-wider">המלצות</span>
          <h2 className="text-3xl md:text-4xl font-serif font-medium text-foreground mb-4 tracking-wide">
            מה אומרים עלינו
          </h2>
          <p className="text-lg text-muted-foreground">מטפלים ומטפלות שעברו את התוכנית משתפים את החוויה שלהם</p>
        </motion.div>

        {/* Testimonials grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.name}
              className="relative"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <div className="bg-card rounded-2xl p-6 border border-border/50 shadow-card h-full relative flex flex-col">
                {/* Quote icon */}
                <Quote className="absolute top-4 left-4 w-8 h-8 text-primary/10" />

                {/* Quote text */}
                <blockquote className="text-foreground leading-relaxed mb-6 relative z-10 flex-1 text-sm md:text-base">
                  "{testimonial.quote}"
                </blockquote>

                {/* Author */}
                <div className="flex items-center gap-3">
                  {/* Avatar */}
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium text-sm shrink-0"
                    style={{
                      background: `linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary) / 0.7))`,
                    }}
                  >
                    {testimonial.initials}
                  </div>
                  <div>
                    <p className="font-medium text-foreground text-sm">{testimonial.name}</p>
                    <p className="text-xs text-muted-foreground">{testimonial.role}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
