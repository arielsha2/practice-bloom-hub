import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { ArrowRight, ArrowLeft } from 'lucide-react';

export function CTABanner() {
  const { t, isRTL } = useLanguage();
  const Arrow = isRTL ? ArrowLeft : ArrowRight;

  return (
    <section className="py-20 bg-primary/5">
      <div className="container mx-auto px-4">
        <div className={`text-center max-w-2xl mx-auto ${isRTL ? 'text-right md:text-center' : ''}`}>
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-6">
            {t('cta.title')}
          </h2>
          <Button 
            variant="cta" 
            size="xl" 
            className="group"
            onClick={() => window.location.href = '/auth'}
          >
            {t('cta.button')}
            <Arrow className="w-5 h-5 transition-transform group-hover:translate-x-1" />
          </Button>
        </div>
      </div>
    </section>
  );
}
