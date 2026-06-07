import { motion } from "framer-motion";
import { useLanguage } from '@/contexts/LanguageContext';

// Import custom icons
import step1Icon from '@/assets/how-it-works/step1-positioning.png';
import step2Icon from '@/assets/how-it-works/step2-referrals.png';
import step3Icon from '@/assets/how-it-works/step3-conversation.png';
import step4Icon from '@/assets/how-it-works/step4-pricing.png';

const steps = [
  { key: 'step1', image: step1Icon },
  { key: 'step2', image: step2Icon },
  { key: 'step3', image: step3Icon },
  { key: 'step4', image: step4Icon },
];

export function HowItWorks() {
  const { t, isRTL } = useLanguage();

  return (
    <section id="how-it-works" className="band band-cream py-24 md:py-32 relative overflow-hidden">
      <div className="container mx-auto px-4 relative z-10">
        {/* Section header */}
        <motion.div
          className={`text-center max-w-2xl mx-auto mb-16 ${isRTL ? 'text-right md:text-center' : ''}`}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="section-eyebrow justify-center">
            {t('howItWorks.label')}
          </div>
          <h2 className="font-display text-4xl md:text-5xl lg:text-6xl text-foreground mb-4 tracking-tight leading-tight">
            {t('howItWorks.title')}
          </h2>
          <div className="section-divider" aria-hidden="true"><span className="dot" /></div>
          <p className="text-lg text-muted-foreground">
            {t('howItWorks.subtitle')}
          </p>
        </motion.div>


        {/* Steps */}
        <div className="relative">
          {/* Connecting line - desktop only */}
          <div className="hidden lg:block absolute top-16 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-border to-transparent" />
          
          <div className={`grid md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6 ${isRTL ? 'lg:flex-row-reverse' : ''}`}>
            {steps.map((step, index) => {
              return (
                <motion.div
                  key={step.key}
                  className={`relative ${isRTL ? 'text-right' : ''}`}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.15 }}
                >
                  {/* Step icon with image */}
                  <div className={`flex items-center gap-4 mb-6 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <div className="relative group">
                      {/* Glow effect on hover */}
                      <div className="absolute -inset-2 bg-gradient-to-br from-primary/20 to-accent/20 rounded-3xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      
                      {/* Icon container */}
                      <div className="relative w-24 h-24 rounded-2xl overflow-hidden shadow-lg border-2 border-primary/10 bg-gradient-to-br from-background to-muted/30 p-2 transition-transform duration-300 group-hover:scale-105">
                        <img 
                          src={step.image} 
                          alt={t(`howItWorks.${step.key}.title`)}
                          className="w-full h-full object-contain"
                        />
                      </div>
                      
                      {/* Step number badge */}
                      <div className={`absolute -top-2 ${isRTL ? '-left-2' : '-right-2'} w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold flex items-center justify-center shadow-md border-2 border-background`}>
                        {index + 1}
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="lg:pt-2">
                    <h3 className="text-xl font-semibold text-foreground mb-3">
                      {t(`howItWorks.${step.key}.title`)}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed text-sm">
                      {t(`howItWorks.${step.key}.desc`)}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
