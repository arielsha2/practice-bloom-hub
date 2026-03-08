import { motion } from 'framer-motion';
import { CheckCircle } from 'lucide-react';

const outcomes = [
  'איך מביאים מטופלים פוטנציאליים להתעניין ולהתקשר אליך',
  'איך עונים באופן מרשים ומעורר סקרנות לשאלה "מה את/ה עושה?"',
  'מה אומרים בשיחת הטלפון הראשונה כדי שיותר מטופלים יתחילו טיפול אצלך',
  'איך מתמחרים את הקליניקה באופן רווחי אבל גם רגיש ונאמן לערכי הטיפול',
  'חיזוק תחושת הערך המקצועי שלך',
  'איך מתמודדים עם אמירות שיפוטיות ומצבים מאתגרים',
];

export function TurningPointOutcomes() {
  return (
    <section className="py-16 bg-primary/5">
      <div className="container mx-auto px-4">
        <motion.div
          className="max-w-3xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-2xl md:text-3xl font-display text-foreground mb-8 text-center">
            מה יצא לך מהתוכנית?
          </h2>

          <div className="grid sm:grid-cols-2 gap-4">
            {outcomes.map((outcome, i) => (
              <motion.div
                key={i}
                className="flex items-start gap-3 bg-card rounded-lg p-4 border border-border/50"
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
              >
                <CheckCircle className="w-5 h-5 text-teal shrink-0 mt-0.5" />
                <p className="text-sm text-foreground">{outcome}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
