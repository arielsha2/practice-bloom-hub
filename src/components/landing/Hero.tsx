import { motion } from "framer-motion";
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { ArrowRight, ArrowLeft } from 'lucide-react';

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
};

export function Hero() {
  const { t, isRTL } = useLanguage();
  const Arrow = isRTL ? ArrowLeft : ArrowRight;

  return (
    <section 
      id="home" 
      className="min-h-screen flex items-center justify-center bg-secondary relative overflow-hidden"
    >
      {/* Subtle background blur circles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-primary/15 rounded-full blur-[120px]" />
        <div className="absolute -bottom-40 -right-40 w-[600px] h-[600px] bg-accent/10 rounded-full blur-[150px]" />
      </div>
      
      <div className="container mx-auto px-4 py-20 relative z-10">
        <div className={`flex flex-col items-center text-center max-w-3xl mx-auto ${isRTL ? 'text-right' : ''}`}>
          {/* Main heading */}
          <motion.h1 
            className="text-4xl md:text-5xl lg:text-6xl font-serif font-medium text-foreground mb-8 leading-tight tracking-wide"
            {...fadeUp}
            transition={{ duration: 0.7, ease: "easeOut" }}
          >
            {t('hero.title')}
          </motion.h1>

          {/* Subheading */}
          <motion.p 
            className="text-lg md:text-xl text-muted-foreground mb-12 max-w-2xl leading-relaxed"
            {...fadeUp}
            transition={{ duration: 0.7, ease: "easeOut", delay: 0.15 }}
          >
            {t('hero.subtitle')}
          </motion.p>

          {/* Single CTA Button */}
          <motion.div 
            {...fadeUp}
            transition={{ duration: 0.7, ease: "easeOut", delay: 0.3 }}
          >
            <Button 
              variant="cta" 
              size="xl" 
              className="group"
              onClick={() => document.getElementById('signup')?.scrollIntoView({ behavior: 'smooth' })}
            >
              {t('hero.cta')}
              <Arrow className={`w-5 h-5 transition-transform ${isRTL ? 'group-hover:-translate-x-1' : 'group-hover:translate-x-1'}`} />
            </Button>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
