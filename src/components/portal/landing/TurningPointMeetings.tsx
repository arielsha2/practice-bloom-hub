import { motion } from 'framer-motion';
import { Target, Sparkles, Megaphone, Handshake, MessageSquare, Wallet } from 'lucide-react';

const meetings = [
  {
    num: 1,
    icon: Target,
    title: 'מחזון למציאות',
    points: [
      'חיבור לשאיפות המקצועיות והכלכליות הגדולות שלך',
      'תרגום השאיפות האישיות למפת דרכים מעשית',
      'ביסוס ביטחון מקצועי ותודעה גבוהה של מטפל עצמאי',
    ],
  },
  {
    num: 2,
    icon: Sparkles,
    title: 'הסיבה שיבחרו דווקא בך!',
    points: [
      'חיבור לערך הייחודי שיש לך לתת',
      'זיהוי המטופל האידיאלי שהכי טוב לך לעבוד איתו',
      'איך להסביר מה אנחנו עושים באופן שמעורר עניין וסקרנות',
    ],
  },
  {
    num: 3,
    icon: Megaphone,
    title: 'מאיפה מביאים מטופלים?',
    points: [
      'איפה מוצאים את המטופלים המתאימים ועוזרים להם לגלות אותנו',
      'יצירת מסרים עוצמתיים ואותנטיים שגורמים לך לבלוט',
      'לשדר את הערך שלנו גם אם שיווק מרתיע אותך',
    ],
  },
  {
    num: 4,
    icon: Handshake,
    title: 'יוצרים זרם של הפניות מתאימות',
    points: [
      'קשרים איכותיים עם אנשי מפתח לקבלת הפניות',
      'משדרים מקצועיות ומבססים אמון בכל פנייה',
      'תסריטים לפנייה משכנעת לאנשי קשר וקולגות',
    ],
  },
  {
    num: 5,
    icon: MessageSquare,
    title: 'איך הופכים מתעניין למטופל',
    points: [
      'טכניקות לניהול שיחה ראשונה באופן אפקטיבי ונינוח',
      'מבנה מתוזמן של שיחה ראשונה שמובילה להחלטה',
      'צ\'ק ליסט לקראת ניהול השיחה',
    ],
  },
  {
    num: 6,
    icon: Wallet,
    title: 'תמחור רווחי ורגיש',
    points: [
      'תמחור שהוא גם רווחי וגם ערכי ומתחשב',
      'התגברות על מחסומים רגשיים סביב כסף',
      'התמודדות מקצועית עם התנגדויות למחיר',
    ],
  },
];

export function TurningPointMeetings() {
  return (
    <section className="py-16 md:py-20 bg-background">
      <div className="container mx-auto px-4">
        <motion.h2
          className="text-2xl md:text-3xl font-display text-foreground mb-4 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          מה נעבור יחד במהלך התוכנית?
        </motion.h2>
        <motion.p
          className="text-muted-foreground text-center mb-12 max-w-lg mx-auto"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
        >
          6 מפגשים שייקחו אותך צעד אחר צעד לקליניקה משגשגת
        </motion.p>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {meetings.map((meeting, index) => {
            const Icon = meeting.icon;
            return (
              <motion.div
                key={meeting.num}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.08 }}
                className="group"
              >
                <div className="bg-card rounded-xl border border-border/50 p-6 h-full hover:shadow-card hover:border-primary/20 transition-all duration-300">
                  {/* Header */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm shrink-0">
                      {meeting.num}
                    </div>
                    <div className="flex items-center gap-2">
                      <Icon className="w-5 h-5 text-teal" />
                      <h3 className="font-bold text-foreground text-sm">
                        {meeting.title}
                      </h3>
                    </div>
                  </div>

                  {/* Points */}
                  <ul className="space-y-2">
                    {meeting.points.map((point, i) => (
                      <li
                        key={i}
                        className="text-sm text-muted-foreground flex items-start gap-2"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-accent mt-1.5 shrink-0" />
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
