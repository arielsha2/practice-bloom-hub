import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, FileDown, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'react-router-dom';
import { PaymentOptionsDialog } from '../PaymentOptionsDialog';
import { trackEvent } from '@/lib/analytics';

export function TurningPointCTA() {
  const { user } = useAuth();
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);

  return (
    <>
      {/* Syllabus Download */}
      <section className="py-12 bg-background">
        <div className="container mx-auto px-4">
          <motion.div
            className="max-w-2xl mx-auto text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="bg-card rounded-2xl p-8 md:p-10 border border-border/50 shadow-card">
              <div className="w-14 h-14 rounded-full bg-teal/10 flex items-center justify-center mx-auto mb-5">
                <FileDown className="w-7 h-7 text-teal" />
              </div>
              <h2 className="text-xl md:text-2xl font-display text-foreground mb-3">
                רוצה לדעת בדיוק מה תלמדי?
              </h2>
              <p className="text-muted-foreground font-body mb-6 max-w-md mx-auto text-sm">
                הורידי את הסילבוס המלא וגלי את כל התכנים, המפגשים והבונוסים
              </p>
              <Button
                size="lg"
                variant="cta"
                onClick={() => {
                  trackEvent('contact_button_click', { location: 'turning_point_syllabus_download' });
                  window.open('/syllabus.pdf', '_blank');
                }}
              >
                <FileDown className="w-5 h-5 me-2" />
                הורדת סילבוס התוכנית
              </Button>
              <div className="flex items-center justify-center gap-2 text-muted-foreground text-sm mt-4 flex-row-reverse">
                <Phone className="w-4 h-4" />
                <span>או שלחי לנו הודעה בוואטסאפ:</span>
                <a
                  href="https://wa.me/972544928993"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-teal hover:underline font-medium"
                  onClick={() => {
                    trackEvent('whatsapp_click', { location: 'turning_point_syllabus' });
                    trackEvent('phone_click', { location: 'turning_point_syllabus' });
                  }}
                >
                  054-4928993
                </a>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-12 bg-gradient-to-br from-secondary via-background to-accent/5 relative overflow-hidden">
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            className="text-center max-w-xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            {!user ? (
              <div className="space-y-4">
                <Button
                  size="xl"
                  variant="cta"
                  onClick={() => {
                    trackEvent('contact_button_click', { location: 'turning_point_join' });
                    setShowPaymentDialog(true);
                  }}
                >
                  אני רוצה להצטרף לתוכנית
                  <ArrowLeft className="w-5 h-5 ms-1" />
                </Button>
                <p className="text-muted-foreground text-sm">
                  כבר רשומים?{' '}
                  <Link to="/auth" className="text-teal hover:underline">
                    התחברות
                  </Link>
                </p>
              </div>
            ) : (
              <div className="bg-card rounded-2xl p-8 border border-border/50">
                <p className="text-muted-foreground mb-4">
                  פנה/י למנהל המערכת לקבלת גישה לקורס
                </p>
                <Link to="/">
                  <Button variant="outline">חזרה לדף הבית</Button>
                </Link>
              </div>
            )}
          </motion.div>
        </div>
      </section>

      <PaymentOptionsDialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog} />
    </>
  );
}
