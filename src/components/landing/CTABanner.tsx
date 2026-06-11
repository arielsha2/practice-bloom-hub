import { motion } from "framer-motion";
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Mail, MessageCircle, Star } from 'lucide-react';
import { trackEvent } from '@/lib/analytics';

export function CTABanner() {
  const { t, isRTL } = useLanguage();

  return (
    <section className="band band-burgundy band-grain py-24 md:py-32 relative overflow-hidden">
      {/* Decorative glows */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute top-0 left-0 w-96 h-96 rounded-full blur-3xl"
          style={{ background: "hsl(var(--accent) / 0.2)" }}
        />
        <div
          className="absolute bottom-0 right-0 w-[500px] h-[500px] rounded-full blur-3xl"
          style={{ background: "hsl(var(--terracotta) / 0.18)" }}
        />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          className={`text-center max-w-3xl mx-auto ${isRTL ? 'text-right md:text-center' : ''}`}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="section-eyebrow justify-center">
            <Star className="w-3.5 h-3.5 fill-current" />
            {isRTL ? "הצעד הבא" : "Next step"}
          </div>
          <h2 className="font-display text-4xl md:text-5xl lg:text-6xl text-primary-foreground mb-4 tracking-tight leading-tight">
            {t('cta.title')}
          </h2>
          <div className="section-divider" aria-hidden="true"><span className="dot" /></div>
          <p className="text-lg text-primary-foreground/80 mb-10 max-w-xl mx-auto leading-relaxed">
            {t('cta.subtitle')}
          </p>

          <div className={`flex flex-col sm:flex-row gap-4 justify-center ${isRTL ? 'sm:flex-row-reverse' : ''}`}>
            <Button
              variant="cta"
              size="xl"
              data-track="cta_newsletter_click"
              data-track-label="cta_banner_newsletter"
              onClick={() => window.open('https://sfat.myflodesk.com/c6d2334e-ea5d-4f2a-bc16-0fb3fc548d93', '_blank')}
            >
              <Mail className="w-5 h-5" />
              {t('cta.newsletter')}
            </Button>

            <Button
              variant="ghost-cream"
              size="xl"
              data-track="cta_whatsapp_click"
              data-track-label="cta_banner_whatsapp"
              onClick={() => {
                trackEvent('whatsapp_click', { location: 'cta_banner' });
                window.open('https://chat.whatsapp.com/LBKVYVc4aoaGnsBVqFNJEb', '_blank');
              }}
            >
              <MessageCircle className="w-5 h-5" />
              {t('cta.whatsapp')}
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

