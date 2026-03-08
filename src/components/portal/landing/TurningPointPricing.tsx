import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, CheckCircle, Shield, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { PaymentOptionsDialog } from '../PaymentOptionsDialog';

export function TurningPointPricing() {
  const { user } = useAuth();
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);

  if (user) return null;

  const greenTextClass = "text-[hsl(142,71%,45%)] font-medium";

  return (
    <>
      <section className="py-16 md:py-20 bg-gradient-to-b from-secondary/30 to-background">
        <div className="container mx-auto px-4">
          <motion.div
            className="max-w-2xl mx-auto text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-2xl md:text-3xl font-display text-foreground mb-8">
              ההשקעה בתוכנית
            </h2>

            <div className="bg-card rounded-2xl border-2 border-primary/20 p-8 md:p-10 shadow-card relative overflow-hidden">
              {/* Decorative corner */}
              <div className="absolute top-0 left-0 w-20 h-20 bg-accent/10 rounded-br-full" />

              {/* Original price */}
              <p className="text-muted-foreground mb-2">
                מחיר מלא: <span className="line-through">6,500 ₪</span>
              </p>

              {/* Special offer */}
              <div className="mb-6">
                <div className="inline-block bg-accent/10 text-accent px-4 py-1 rounded-full text-sm font-medium mb-4">
                  עכשיו בהזדמנות מיוחדת
                </div>

                <div className="flex flex-col gap-3 items-center">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-1">בתשלומים</p>
                    <p className="text-3xl font-bold text-foreground">
                      10 × 495 ₪
                    </p>
                    <p className="text-lg text-muted-foreground">(4,950 ₪ סה״כ)</p>
                  </div>

                  <div className="text-muted-foreground text-sm">או</div>

                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-1">
                      בתשלום אחד + הנחה
                    </p>
                    <p className="text-3xl font-bold text-primary">4,650 ₪</p>
                    <p className="text-sm text-teal font-medium">חיסכון של 300 ₪</p>
                  </div>
                </div>
              </div>

              {/* Includes */}
              <div className="space-y-2 mb-8 text-sm text-right max-w-sm mx-auto">
                {[
                  '12 מפגשים (6 למידה + 6 הטמעה)',
                  'גישה פתוחה לתכנים לתמיד',
                  'חוברות תרגול + תסריטים',
                  'מדריך דיגיטלי במתנה (שווי 497 ₪)',
                  'בוטים ייחודיים לעזרה בשיווק',
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-teal shrink-0" />
                    <span className="text-muted-foreground">{item}</span>
                  </div>
                ))}
              </div>

              <Button
                size="xl"
                variant="cta"
                className="w-full max-w-sm"
                onClick={() => setShowPaymentDialog(true)}
              >
                אני רוצה להצטרף
                <ArrowLeft className="w-5 h-5 ms-1" />
              </Button>

              {/* Schedule info */}
              <div className="mt-6 flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Calendar className="w-4 h-4" />
                <span>מתחילים ביום חמישי 12.3.26 | ימי חמישי 11:00-13:00</span>
              </div>
            </div>

            {/* Guarantee */}
            <motion.div
              className="mt-8 bg-card rounded-xl border border-border/50 p-6 flex items-start gap-4 text-right"
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              <Shield className="w-10 h-10 text-teal shrink-0 mt-1" />
              <div>
                <h3 className="font-bold text-foreground mb-2">100% אחריות – בלי אותיות קטנות</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  אנחנו כל כך מאמינים בערך שטמון בקורס, שהחלטנו לקחת את כל הסיכון עלינו.
                  יש לך אפשרות להצטרף ולהתנסות, ואם הרגשת שהקורס הוא לא מה שחיפשת – ניתן
                  ליצור איתנו קשר עד לפני המפגש השני ולקבל החזר כספי מלא.
                </p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <PaymentOptionsDialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog} />
    </>
  );
}
