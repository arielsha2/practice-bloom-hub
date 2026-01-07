import { motion } from "framer-motion";
import { useLanguage } from '@/contexts/LanguageContext';
import { Video, FileText, Users, Bot, Headphones, Smartphone } from 'lucide-react';

const features = [
  { key: 'videos', icon: Video },
  { key: 'exercises', icon: FileText },
  { key: 'community', icon: Users },
  { key: 'ai', icon: Bot },
  { key: 'support', icon: Headphones },
  { key: 'mobile', icon: Smartphone },
];

export function Features() {
  const { t, isRTL } = useLanguage();

  return (
    <section className="py-24 bg-secondary relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute bottom-0 left-1/3 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px]" />
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
            {t('features.label')}
          </span>
          <h2 className="text-3xl md:text-4xl font-serif font-medium text-foreground mb-4 tracking-wide">
            {t('features.title')}
          </h2>
          <p className="text-lg text-muted-foreground">
            {t('features.subtitle')}
          </p>
        </motion.div>

        {/* Features grid */}
        <div className={`grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto ${isRTL ? 'text-right' : ''}`}>
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.key}
                className="group"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.08 }}
              >
                <div className={`flex items-center gap-4 p-5 rounded-xl bg-card border border-border/50 hover:border-primary/20 hover:shadow-card transition-all duration-300 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-0.5">
                      {t(`features.${feature.key}.title`)}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {t(`features.${feature.key}.desc`)}
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
