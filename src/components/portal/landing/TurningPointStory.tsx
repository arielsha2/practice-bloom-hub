import { motion } from 'framer-motion';

export function TurningPointStory() {
  return (
    <section className="py-16 md:py-20 bg-background relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-secondary/20 to-transparent pointer-events-none" />

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          className="max-w-3xl mx-auto space-y-8 text-right"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <motion.h2
            className="text-2xl md:text-3xl font-display text-primary leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            אם את או אתה כמונו, אתם מאוד אוהבים לעזור לאנשים.
          </motion.h2>

          <motion.p
            className="text-muted-foreground leading-relaxed text-lg"
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            אחד הדברים שהכי מרגשים אותנו, זה לראות את המטופל יושב אצלנו בחדר, ואיך אנחנו
            מצליחים לגעת בדיוק בנקודה המשמעותית בתוך סיפור הכאב או התקיעות וליצור שם תנועה
            ושינוי. וזה הופך אותם ליותר בטוחים ומסוגלים.
          </motion.p>

          <motion.div
            className="bg-primary/5 border-r-4 border-primary rounded-lg p-6"
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            <h3 className="text-xl font-bold text-foreground mb-3">אבל יש בעיה.</h3>
            <p className="text-muted-foreground leading-relaxed">
              אנחנו יודעים שיש לנו יכולת מדהימה ליצור שינוי בחיים של אנשים, רק שהאנשים האלה
              לא יושבים אצלינו בכסא בקליניקה.
            </p>
          </motion.div>

          <motion.h3
            className="text-xl md:text-2xl font-bold text-foreground text-center"
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
          >
            הם נמצאים בחוץ, הם בחיפוש והם אפילו לא יודעים על קיומנו.
          </motion.h3>

          <motion.p
            className="text-muted-foreground leading-relaxed"
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
          >
            חשבנו שאם נשקיע המון בהכשרה, בהתמחות, ברכישת כלים וניסיון – הם ישמעו עלינו
            ויבואו בהמוניהם. אבל ככל שמשקיעים יותר בלמידה, כך רואים את הפער העצום שנוצר, בין
            כל מה שיש לנו לתת לבין מה שקורה בפועל.
          </motion.p>

          <motion.p
            className="text-muted-foreground leading-relaxed"
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5 }}
          >
            ואפילו מי שכבר מגיע ועובר איתנו תהליך משמעותי – לרוב, בגלל שזה טיפול, לא ימליצו
            לחברים שלהם. זה דיסקרטי, וחלק מעדיפים לשמור אותנו לעצמם...
          </motion.p>

          <motion.p
            className="text-lg font-medium text-foreground text-center"
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.6 }}
          >
            מרגיש כאילו אנחנו יודעים כל כך טוב לעזור לאחרים.. אבל לעצמנו – אנחנו לא יודעים
            לעזור!
          </motion.p>
        </motion.div>
      </div>
    </section>
  );
}
