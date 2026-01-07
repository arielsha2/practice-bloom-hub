import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { ArrowRight, ArrowLeft, Sparkles } from 'lucide-react';

export function CTABanner() {
  const { t, isRTL } = useLanguage();
  const Arrow = isRTL ? ArrowLeft : ArrowRight;

  return (
    <section className="py-24 bg-primary relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-accent/20 rounded-full blur-3xl" />
      </div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className={`text-center max-w-2xl mx-auto ${isRTL ? 'text-right md:text-center' : ''}`}>
          <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-2 mb-6">
            <Sparkles className="w-4 h-4 text-accent" />
            <span className="text-primary-foreground/90 text-sm font-medium">
              {isRTL ? 'הצטרפו עכשיו' : 'Join Now'}
            </span>
          </div>
          <h2 className="text-2xl md:text-4xl font-serif font-medium text-primary-foreground mb-8 tracking-wide">
            {t('cta.title')}
          </h2>
          <Button 
            variant="secondary" 
            size="xl" 
            className="group shadow-elevated hover:shadow-card bg-white text-primary hover:bg-white/90"
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
