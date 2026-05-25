import { motion } from "framer-motion";
import { Target, Sparkles, Megaphone, Handshake, MessageSquare, Wallet, Gift, BookOpen, Bot, ListChecks, MessageCircle, User } from "lucide-react";
import meeting1Img from "@/assets/turning-point/meeting1.jpg";
import meeting2Img from "@/assets/turning-point/meeting2.jpg";
import meeting3Img from "@/assets/turning-point/meeting3.jpg";
import meeting4Img from "@/assets/turning-point/meeting4.jpg";
import meeting5Img from "@/assets/turning-point/meeting5.jpg";
import meeting6Img from "@/assets/turning-point/meeting6.png";

const meetings = [
  {
    num: 1,
    icon: Target,
    title: "מחזון למציאות",
    image: meeting1Img,
    points: [
      "חיבור לשאיפות המקצועיות והכלכליות הגדולות שלך",
      "תרגום השאיפות האישיות למפת דרכים מעשית",
      "ביסוס ביטחון מקצועי ותודעה גבוהה של מטפל עצמאי",
    ],
  },
  {
    num: 2,
    icon: Sparkles,
    title: "הסיבה שיבחרו דווקא בך!",
    image: meeting2Img,
    points: [
      "חיבור לערך הייחודי שיש לך לתת",
      "זיהוי המטופל האידיאלי שהכי טוב לך לעבוד איתו",
      "איך להסביר מה אנחנו עושים באופן שמעורר עניין וסקרנות",
    ],
  },
  {
    num: 3,
    icon: Megaphone,
    title: "מאיפה מביאים מטופלים?",
    image: meeting3Img,
    points: [
      "איפה מוצאים את המטופלים המתאימים ועוזרים להם לגלות אותנו",
      "יצירת מסרים עוצמתיים ואותנטיים שגורמים לך לבלוט",
      "לשדר את הערך שלנו גם אם שיווק מרתיע אותך",
    ],
  },
  {
    num: 4,
    icon: Handshake,
    title: "יוצרים זרם של הפניות מתאימות",
    image: meeting4Img,
    points: [
      "קשרים איכותיים עם אנשי מפתח לקבלת הפניות",
      "משדרים מקצועיות ומבססים אמון בכל פנייה",
      "תסריטים לפנייה משכנעת לאנשי קשר וקולגות",
    ],
  },
  {
    num: 5,
    icon: MessageSquare,
    title: "איך הופכים מתעניין למטופל",
    image: meeting5Img,
    points: [
      "טכניקות לניהול שיחה ראשונה באופן אפקטיבי ונינוח",
      "מבנה מתוזמן של שיחה ראשונה שמובילה להחלטה",
      "צ'ק ליסט לקראת ניהול השיחה",
    ],
  },
  {
    num: 6,
    icon: Wallet,
    title: "תמחור רווחי ורגיש",
    image: meeting6Img,
    points: [
      "תמחור שהוא גם רווחי וגם ערכי ומתחשב",
      "התגברות על מחסומים רגשיים סביב כסף",
      "התמודדות מקצועית עם התנגדויות למחיר",
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
          12 מפגשים שייקחו אותך צעד אחר צעד לקליניקה משגשגת
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
                <div className="bg-card rounded-xl border border-border/50 overflow-hidden h-full hover:shadow-card hover:border-primary/20 transition-all duration-300">
                  {/* Image */}
                  <div className="h-40 overflow-hidden">
                    <img
                      src={meeting.image}
                      alt={meeting.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                  </div>

                  <div className="p-6">
                    {/* Header */}
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm shrink-0">
                        {meeting.num}
                      </div>
                      <div className="flex items-center gap-2">
                        <Icon className="w-5 h-5 text-teal" />
                        <h3 className="font-bold text-foreground text-sm">{meeting.title}</h3>
                      </div>
                    </div>

                    {/* Points */}
                    <ul className="space-y-2">
                      {meeting.points.map((point, i) => (
                        <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-accent mt-1.5 shrink-0" />
                          {point}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Bonuses */}
        <div className="mt-20 max-w-5xl mx-auto">
          <motion.div
            className="text-center mb-10"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="inline-flex items-center gap-2 bg-accent/10 text-accent px-4 py-1.5 rounded-full text-sm font-medium mb-3">
              <Gift className="w-4 h-4" />
              בונוסים שמקבלים בתוכנית
            </div>
            <h3 className="text-xl md:text-2xl font-display text-foreground">
              ומעבר ל-12 המפגשים – מקבלים גם:
            </h3>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              {
                icon: BookOpen,
                title: 'מדריך "נקודת המפנה"',
                desc: "מדריך דיגיטלי מקיף שילווה אותך לאורך כל התוכנית",
              },
              {
                icon: Bot,
                title: '"המנטור" – אפליקציית AI למטפלים',
                desc: "אפליקציית AI שתעזור לך לבנות קליניקה יציבה ומבוקשת, צעד אחרי צעד",
              },
              {
                icon: ListChecks,
                title: "משימות ותרגולים שבועיים",
                desc: "משימות יישומיות בין מפגש למפגש להטמעה אמיתית של הכלים",
              },
              {
                icon: MessageCircle,
                title: "קבוצת ווצאפ סגורה",
                desc: "מרחב קבוצתי להתייעצויות, שאלות ותמיכה הדדית",
              },
              {
                icon: User,
                title: "מפגש 1 על 1 עם אליענה",
                desc: "שיחה אישית להתאמה ספציפית לקליניקה שלך",
                badge: "מוגבל ל-4 הנרשמים הראשונים",
              },
            ].map((bonus, index) => {
              const Icon = bonus.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.08 }}
                  className="relative bg-gradient-to-br from-primary/5 to-accent/5 rounded-xl border border-primary/15 p-5 hover:shadow-card hover:border-primary/30 transition-all"
                >
                  {bonus.badge && (
                    <div className="absolute -top-3 right-4 bg-accent text-accent-foreground text-xs font-bold px-3 py-1 rounded-full shadow-md">
                      {bonus.badge}
                    </div>
                  )}
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-bold text-foreground text-sm mb-1">{bonus.title}</h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">{bonus.desc}</p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
