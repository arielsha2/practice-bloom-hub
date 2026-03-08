import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'react-router-dom';
import { PaymentOptionsDialog } from '../PaymentOptionsDialog';
import foundersImg from '@/assets/founders/founders.jpg';

export function TurningPointHero() {
  const { user } = useAuth();
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);

  return (
    <>
      <section className="bg-primary pt-24 pb-16 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-20 -right-20 w-[400px] h-[400px] bg-primary-foreground/5 rounded-full blur-[100px]" />
          <div className="absolute -bottom-20 -left-20 w-[350px] h-[350px] bg-accent/10 rounded-full blur-[80px]" />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            className="text-center max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Founders image */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1, duration: 0.5 }}
              className="mb-8"
            >
              <img
                src={foundersImg}
                alt="ד״ר אריאל ואליענה שפירא"
                className="w-48 h-32 md:w-64 md:h-40 object-cover rounded-xl mx-auto shadow-lg border-2 border-primary-foreground/10"
              />
            </motion.div>

            {user && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                className="mb-6"
              >
                <div className="w-16 h-16 mx-auto rounded-full bg-primary-foreground/10 flex items-center justify-center">
                  <Lock className="w-8 h-8 text-accent" />
                </div>
              </motion.div>
            )}

            <span className="inline-block text-accent font-medium text-sm mb-4 tracking-wider uppercase">
              תוכנית "נקודת המפנה"
            </span>

            <h1 className="text-3xl md:text-5xl font-display text-primary-foreground mb-6 tracking-wide leading-tight">
              {user
                ? 'אין לך גישה לקורס זה'
                : '3 השלבים לקליניקה מלאה ומטופלים שממתינים בתור'}
            </h1>

            <p className="text-lg md:text-xl text-primary-foreground/80 max-w-2xl mx-auto">
              {user
                ? 'נראה שאינך רשום/ה לקורס זה. פנה/י למנהל המערכת לקבלת גישה.'
                : 'הכשרה מעשית למטפלים שמוכנים ליצור קליניקה יציבה ומשגשגת'}
            </p>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="mt-8 flex flex-col sm:flex-row gap-3 justify-center"
            >
              {!user ? (
                <>
                  <Button
                    size="xl"
                    variant="cta"
                    onClick={() => setShowPaymentDialog(true)}
                  >
                    אני רוצה להצטרף לתוכנית
                    <ArrowLeft className="w-5 h-5 ms-1" />
                  </Button>
                </>
              ) : (
                <Link to="/">
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10"
                  >
                    חזרה לדף הבית
                  </Button>
                </Link>
              )}
            </motion.div>
          </motion.div>
        </div>
      </section>

      <PaymentOptionsDialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog} />
    </>
  );
}
