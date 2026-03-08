import { motion } from 'framer-motion';
import arielImg from '@/assets/turning-point/ariel.webp';
import elianaImg from '@/assets/turning-point/eliana.webp';

export function TurningPointFounders() {
  return (
    <section className="py-16 md:py-20 bg-background">
      <div className="container mx-auto px-4">
        <motion.div
          className="max-w-4xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-2xl md:text-3xl font-display text-foreground mb-10 text-center">
            נעים להכיר
          </h2>

          <div className="grid md:grid-cols-2 gap-10">
            {/* Ariel */}
            <motion.div
              className="text-center"
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
            >
              <img
                src={arielImg}
                alt="ד״ר אריאל שפירא"
                className="w-48 h-64 object-cover object-top rounded-xl shadow-lg mx-auto mb-4 border-2 border-border/30"
              />
              <h3 className="text-lg font-bold text-foreground mb-2">
                ד"ר אריאל שפירא
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed text-right">
                פסיכולוג קליני מומחה. מטפל מזה 12 שנה במסגרות ציבוריות ובקליניקה הפרטית שלו.
                במסגרת עבודתו כמדריך קליני נחשף לקושי של המטפלים לבסס קליניקה פרטית כמקור
                הכנסה יציב. מתוך כך צמח מודל "ממריאים לקליניקה" – תוכנית קבוצתית ליצירת
                קליניקה רווחית בשפה טיפולית.
              </p>
            </motion.div>

            {/* Eliana */}
            <motion.div
              className="text-center"
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              <img
                src={elianaImg}
                alt="אליענה שפירא"
                className="w-48 h-64 object-cover object-top rounded-xl shadow-lg mx-auto mb-4 border-2 border-border/30"
              />
              <h3 className="text-lg font-bold text-foreground mb-2">
                אליענה שפירא
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed text-right">
                פסיכותרפיסטית ויוצרת תוכן. בעלת הסמכה בינלאומית כמדריכת מודעות עצמית עם
                הכשרה מעמיקה בשיווק אמפתי ומומחיות בכלי בינה מלאכותית ליצירת תוכן שיווקי
                ויצירתי. עבדה במשך 12 שנה כיועצת חינוכית במגוון בתי ספר.
              </p>
            </motion.div>
          </div>

          <motion.p
            className="text-sm text-muted-foreground leading-relaxed text-center mt-8 max-w-2xl mx-auto border-t border-border/50 pt-6"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
          >
            אנחנו ד"ר אריאל ואליענה שפירא – זוג מטפלים שאחרי שלמדנו איך משווקים קליניקה
            באופן אמפתי ומזמין, רצינו להביא את הבשורה הזו לקהל המטפלים, כדי שאנשי מקצוע
            מוכשרים כמוך יגשימו את חלום הקליניקה ויבססו מקור הכנסה רווחי ומתגמל.
          </motion.p>
        </motion.div>
      </div>
    </section>
  );
}
