import { motion } from "framer-motion";
import { useLanguage } from '@/contexts/LanguageContext';
import { UserPlus, BookOpen, MessageCircle, Award } from 'lucide-react';

const steps = [
  { key: 'step1', icon: UserPlus },
  { key: 'step2', icon: BookOpen },
  { key: 'step3', icon: MessageCircle },
  { key: 'step4', icon: Award },
];

export function HowItWorks() {
  const { t, isRTL } = useLanguage();

  return (
    <section id="how-it-works" className="py-24 bg-background relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 right-1/4 w-[300px] h-[300px] bg-accent/5 rounded-full blur-[80px]" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Section header */}
        <motion.div 
          className={`text-center max-w-2xl mx-auto mb-16 ${isRTL ? 'text-right md:text-center' : ''}`}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <span className="inline-block text-primary font-medium text-sm mb-4 tracking-wider uppercase">
            {t('howItWorks.label')}
          </span>
          <h2 className="text-3xl md:text-4xl font-serif font-medium text-foreground mb-4 tracking-wide">
            {t('howItWorks.title')}
          </h2>
          <p className="text-lg text-muted-foreground">
            {t('howItWorks.subtitle')}
          </p>
        </motion.div>

        {/* Steps */}
        <div className="relative">
          {/* Connecting line - desktop only */}
          <div className="hidden lg:block absolute top-24 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-border to-transparent" />
          
          <div className={`grid md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6 ${isRTL ? 'lg:flex-row-reverse' : ''}`}>
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={step.key}
                  className={`relative ${isRTL ? 'text-right' : ''}`}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.15 }}
                >
                  {/* Step number */}
                  <div className={`flex items-center gap-4 mb-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <div className="relative">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg">
                        <Icon className="w-7 h-7 text-primary-foreground" />
                      </div>
                      {/* Step number badge */}
                      <div className={`absolute -top-2 ${isRTL ? '-left-2' : '-right-2'} w-7 h-7 rounded-full bg-accent text-accent-foreground text-sm font-bold flex items-center justify-center shadow-md`}>
                        {index + 1}
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="lg:pt-4">
                    <h3 className="text-xl font-semibold text-foreground mb-2">
                      {t(`howItWorks.${step.key}.title`)}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed">
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
