import { motion } from 'framer-motion';
import foundersImg from '@/assets/founders/founders.jpg';

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

          <div className="grid md:grid-cols-2 gap-8 items-start">
            {/* Image */}
            <motion.div
              className="flex justify-center"
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
            >
              <img
                src={foundersImg}
                alt="ד״ר אריאל ואליענה שפירא"
                className="rounded-xl shadow-lg w-full max-w-sm object-cover"
              />
            </motion.div>

            {/* Bios */}
            <div className="space-y-6 text-right">
              <div>
                <h3 className="text-lg font-bold text-foreground mb-2">
                  ד"ר אריאל שפירא
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  פסיכולוג קליני מומחה. מטפל מזה 12 שנה במסגרות ציבוריות ובקליניקה הפרטית שלו.
                  במסגרת עבודתו כמדריך קליני נחשף לקושי של המטפלים לבסס קליניקה פרטית כמקור
                  הכנסה יציב. מתוך כך צמח מודל "ממריאים לקליניקה" – תוכנית קבוצתית ליצירת
                  קליניקה רווחית בשפה טיפולית.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-bold text-foreground mb-2">
                  אליענה שפירא
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  פסיכותרפיסטית ויוצרת תוכן. בעלת הסמכה בינלאומית כמדריכת מודעות עצמית עם
                  הכשרה מעמיקה בשיווק אמפתי ומומחיות בכלי בינה מלאכותית ליצירת תוכן שיווקי
                  ויצירתי. עבדה במשך 12 שנה כיועצת חינוכית במגוון בתי ספר.
                </p>
              </div>

              <p className="text-sm text-muted-foreground leading-relaxed border-t border-border/50 pt-4">
                אנחנו ד"ר אריאל ואליענה שפירא – זוג מטפלים שאחרי שלמדנו איך משווקים קליניקה
                באופן אמפתי ומזמין, רצינו להביא את הבשורה הזו לקהל המטפלים, כדי שאנשי מקצוע
                מוכשרים כמוך יגשימו את חלום הקליניקה ויבססו מקור הכנסה רווחי ומתגמל.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
