import { motion } from "framer-motion";
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { ArrowRight, ArrowLeft, Sparkles, Star } from 'lucide-react';

export function CTABanner() {
  const { t, isRTL } = useLanguage();
  const Arrow = isRTL ? ArrowLeft : ArrowRight;

  return (
    <section className="py-24 bg-primary relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-accent/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/4 w-32 h-32 bg-white/5 rounded-full blur-2xl" />
      </div>

      {/* Floating decorative stars */}
      <motion.div 
        className="absolute top-12 right-[15%] text-white/20"
        animate={{ rotate: 360, scale: [1, 1.2, 1] }}
        transition={{ duration: 8, repeat: Infinity }}
      >
        <Star className="w-8 h-8 fill-current" />
      </motion.div>
      <motion.div 
        className="absolute bottom-16 left-[20%] text-white/10"
        animate={{ rotate: -360, scale: [1, 1.3, 1] }}
        transition={{ duration: 10, repeat: Infinity }}
      >
        <Star className="w-12 h-12 fill-current" />
      </motion.div>
      
      <div className="container mx-auto px-4 relative z-10">
        <motion.div 
          className={`text-center max-w-3xl mx-auto ${isRTL ? 'text-right md:text-center' : ''}`}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-5 py-2.5 mb-8">
            <Sparkles className="w-4 h-4 text-accent" />
            <span className="text-primary-foreground/90 text-sm font-medium">
              {isRTL ? 'הצטרפו עכשיו' : 'Join Now'}
            </span>
          </div>

          {/* Main heading */}
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif font-medium text-primary-foreground mb-6 tracking-wide leading-tight">
            {t('cta.title')}
          </h2>

          {/* Subtext */}
          <p className="text-lg text-primary-foreground/80 mb-10 max-w-xl mx-auto">
            {t('cta.subtitle')}
          </p>

          {/* Buttons */}
          <div className={`flex flex-col sm:flex-row gap-4 justify-center ${isRTL ? 'sm:flex-row-reverse' : ''}`}>
            <Button 
              variant="secondary" 
              size="xl" 
              className="group shadow-elevated hover:shadow-card bg-white text-primary hover:bg-white/90"
              onClick={() => window.location.href = '/auth'}
            >
              {t('cta.button')}
              <Arrow className={`w-5 h-5 transition-transform ${isRTL ? 'group-hover:-translate-x-1' : 'group-hover:translate-x-1'}`} />
            </Button>
            <Button 
              variant="ghost" 
              size="xl" 
              className="text-primary-foreground border-2 border-white/30 hover:bg-white/10 hover:text-primary-foreground"
              onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
            >
              {t('cta.secondaryButton')}
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
