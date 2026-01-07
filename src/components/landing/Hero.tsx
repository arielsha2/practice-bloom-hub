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
      className="min-h-screen flex items-center pt-16 bg-secondary relative overflow-hidden"
    >
      {/* Simplified background - just 2 soft blurred circles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[100px]" />
        <div className="absolute -bottom-40 -right-40 w-[600px] h-[600px] bg-accent/15 rounded-full blur-[120px]" />
      </div>
      
      <div className="container mx-auto px-4 py-20 relative z-10">
        <div className={`grid md:grid-cols-2 gap-12 items-center ${isRTL ? 'md:grid-flow-dense' : ''}`}>
          {/* Text Column */}
          <div className={`flex flex-col ${isRTL ? 'text-right md:col-start-2' : 'text-left'}`}>
            {/* Badge */}
            <motion.div 
              className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-2 mb-8 w-fit"
              {...fadeUp}
              transition={{ duration: 0.6, ease: "easeOut", delay: 0 }}
            >
              <span className="text-primary text-sm font-medium">
                {isRTL ? 'לפסיכותרפיסטים בפרקטיקה פרטית' : 'For Private Practice Psychotherapists'}
              </span>
            </motion.div>

            {/* Main heading */}
            <motion.h1 
              className="text-4xl md:text-5xl lg:text-6xl font-serif font-medium text-foreground mb-6 leading-tight tracking-wide"
              {...fadeUp}
              transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
            >
              {t('hero.title')}
            </motion.h1>

            {/* Subheading */}
            <motion.p 
              className="text-lg md:text-xl text-muted-foreground mb-10 max-w-xl leading-relaxed"
              {...fadeUp}
              transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
            >
              {t('hero.subtitle')}
            </motion.p>

            {/* CTA Buttons */}
            <motion.div 
              className={`flex flex-col sm:flex-row gap-4 ${isRTL ? 'sm:flex-row-reverse' : ''}`}
              {...fadeUp}
              transition={{ duration: 0.6, ease: "easeOut", delay: 0.3 }}
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
              
              <Button 
                variant="outline" 
                size="xl"
                onClick={() => document.getElementById('benefits')?.scrollIntoView({ behavior: 'smooth' })}
              >
                {t('hero.secondary_cta')}
              </Button>
            </motion.div>
          </div>

          {/* Visual Column */}
          <motion.div 
            className={`relative ${isRTL ? 'md:col-start-1 md:row-start-1' : ''}`}
            {...fadeUp}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.4 }}
          >
            <div className="relative bg-card rounded-2xl shadow-2xl overflow-hidden aspect-[4/3]">
              {/* Placeholder visual - gradient with subtle pattern */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-accent/5 to-secondary" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center p-8">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-primary/20 flex items-center justify-center">
                    <span className="text-4xl">✨</span>
                  </div>
                  <p className="text-muted-foreground text-sm">
                    {isRTL ? 'מערכת חכמה לניהול הקליניקה' : 'Smart Practice Management'}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
