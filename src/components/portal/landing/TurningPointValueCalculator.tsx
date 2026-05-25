import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ArrowDown, TrendingUp } from 'lucide-react';
import { Slider } from '@/components/ui/slider';

const MONTHS_DEFAULT = 6;

function formatILS(n: number) {
  return new Intl.NumberFormat('he-IL').format(Math.round(n));
}

export function TurningPointValueCalculator() {
  const [patients, setPatients] = useState(1);
  const [price, setPrice] = useState(400);

  const monthly = useMemo(() => patients * price * 4, [patients, price]); // ~4 מפגשים בחודש
  const total = useMemo(() => monthly * MONTHS_DEFAULT, [monthly]);

  return (
    <section className="py-16 md:py-20 bg-gradient-to-b from-primary/5 to-background">
      <div className="container mx-auto px-4">
        <motion.div
          className="max-w-3xl mx-auto text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-2xl md:text-3xl font-display text-foreground mb-3">
            מה זה אומר בפועל לקליניקה שלך?
          </h2>
          <p className="text-muted-foreground mb-6">
            גם תוספת של מטופל אחד או שניים בעקבות התוכנית — מחזירה את ההשקעה פי כמה וכמה.
          </p>

          {/* Arrow guiding the eye down */}
          <motion.div
            className="flex justify-center mb-4"
            initial={{ y: -10, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            <ArrowDown className="w-8 h-8 text-accent animate-bounce" />
          </motion.div>

          <motion.div
            className="bg-card rounded-2xl border-2 border-primary/20 p-6 md:p-10 shadow-card text-right"
            initial={{ opacity: 0, scale: 0.97 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <div className="grid md:grid-cols-2 gap-6 md:gap-10 mb-8">
              {/* Patients slider */}
              <div>
                <div className="flex items-baseline justify-between mb-3">
                  <label className="text-sm font-medium text-foreground">
                    מטופלים חדשים בחודש
                  </label>
                  <span className="text-2xl font-bold text-primary">{patients}</span>
                </div>
                <Slider
                  value={[patients]}
                  min={1}
                  max={10}
                  step={1}
                  onValueChange={(v) => setPatients(v[0])}
                  dir="ltr"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-2" dir="ltr">
                  <span>1</span>
                  <span>10</span>
                </div>
              </div>

              {/* Price slider */}
              <div>
                <div className="flex items-baseline justify-between mb-3">
                  <label className="text-sm font-medium text-foreground">
                    מחיר למפגש
                  </label>
                  <span className="text-2xl font-bold text-primary">{formatILS(price)} ₪</span>
                </div>
                <Slider
                  value={[price]}
                  min={250}
                  max={800}
                  step={50}
                  onValueChange={(v) => setPrice(v[0])}
                  dir="ltr"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-2" dir="ltr">
                  <span>250 ₪</span>
                  <span>800 ₪</span>
                </div>
              </div>
            </div>

            {/* Result row */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="bg-secondary/40 rounded-xl p-5 text-center">
                <p className="text-sm text-muted-foreground mb-1">תוספת חודשית להכנסה</p>
                <p className="text-3xl font-bold text-foreground">{formatILS(monthly)} ₪</p>
                <p className="text-xs text-muted-foreground mt-1">
                  ({patients} × {formatILS(price)}₪ × 4 מפגשים)
                </p>
              </div>

              <div className="bg-gradient-to-br from-accent/15 to-primary/10 rounded-xl p-5 text-center border border-accent/30 relative overflow-hidden">
                <div className="absolute top-2 left-2">
                  <TrendingUp className="w-5 h-5 text-accent" />
                </div>
                <p className="text-sm text-accent font-medium mb-1">
                  על פני {MONTHS_DEFAULT} חודשי טיפול
                </p>
                <p className="text-4xl font-bold text-primary">{formatILS(total)} ₪</p>
                <p className="text-xs text-muted-foreground mt-1">
                  תוספת הכנסה שלך מהמטופלים
                </p>
              </div>
            </div>

            <p className="text-xs text-muted-foreground mt-6 text-center leading-relaxed">
              * החישוב מבוסס על ממוצע של 4 מפגשים בחודש לאורך תקופת טיפול ממוצעת של חצי שנה.
              בפועל, מטופלים רבים נשארים בקליניקה הרבה מעבר לכך.
            </p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
