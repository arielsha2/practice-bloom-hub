import { motion } from "framer-motion";
import { useLanguage } from '@/contexts/LanguageContext';
import { Target, Heart, TrendingUp } from 'lucide-react';

const icons = [Target, Heart, TrendingUp];

export function Benefits() {
  const { t, isRTL } = useLanguage();

  const benefits = [
    { key: 'item1', icon: icons[0] },
    { key: 'item2', icon: icons[1] },
    { key: 'item3', icon: icons[2] },
  ];

  return (
    <section id="benefits" className="py-24 bg-secondary relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-20 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px]" />
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
            {t('benefits.label')}
          </span>
          <h2 className="text-3xl md:text-4xl font-serif font-medium text-foreground mb-4 tracking-wide">
            {t('benefits.title')}
          </h2>
          <p className="text-lg text-muted-foreground">
            {t('benefits.subtitle')}
          </p>
        </motion.div>

        {/* Benefits cards */}
        <div className={`grid md:grid-cols-3 gap-8 max-w-6xl mx-auto ${isRTL ? 'text-right' : ''}`}>
          {benefits.map((benefit, index) => {
            const Icon = benefit.icon;
            return (
              <motion.div
                key={benefit.key}
                className="group relative"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <div className="bg-card rounded-2xl p-8 border border-border/50 shadow-card hover:shadow-elevated transition-all duration-300 h-full relative overflow-hidden group-hover:-translate-y-1">
                  {/* Gradient overlay on hover */}
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  
                  <div className="relative z-10">
                    {/* Icon */}
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                      <Icon className="w-7 h-7 text-primary" />
                    </div>

                    {/* Content */}
                    <h3 className="text-xl font-semibold text-foreground mb-3">
                      {t(`benefits.${benefit.key}.title`)}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {t(`benefits.${benefit.key}.desc`)}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
