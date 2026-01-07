import { motion } from "framer-motion";
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Compass, Map, PenTool, Bot, Sparkles } from 'lucide-react';

const botData = [
  { key: 'niche', icon: Compass, gradient: 'from-primary to-primary/70' },
  { key: 'strategy', icon: Map, gradient: 'from-accent to-accent/70' },
  { key: 'content', icon: PenTool, gradient: 'from-primary to-accent' },
];

export function Bots() {
  const { t, isRTL } = useLanguage();

  return (
    <section id="bots" className="py-24 bg-background relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-accent/5 rounded-full blur-[100px]" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Section header */}
        <motion.div 
          className={`text-center max-w-3xl mx-auto mb-16 ${isRTL ? 'text-right md:text-center' : ''}`}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 bg-primary/10 rounded-full px-4 py-2 mb-6">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-primary font-medium text-sm">AI-Powered</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-serif font-medium text-foreground mb-4 tracking-wide">
            {t('bots.title')}
          </h2>
          <p className="text-lg text-muted-foreground">
            {t('bots.subtitle')}
          </p>
        </motion.div>

        {/* Bots grid */}
        <div className={`grid md:grid-cols-3 gap-8 max-w-6xl mx-auto ${isRTL ? 'text-right' : ''}`}>
          {botData.map((bot, index) => {
            const Icon = bot.icon;
            return (
              <motion.div
                key={bot.key}
                className="group relative"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.15 }}
              >
                <div className="bg-card rounded-2xl overflow-hidden border border-border/50 shadow-card hover:shadow-elevated transition-all duration-300 h-full group-hover:-translate-y-1">
                  {/* Header gradient stripe */}
                  <div className={`h-2 bg-gradient-to-r ${bot.gradient}`} />

                  {/* Content */}
                  <div className="p-8">
                    {/* Icon */}
                    <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${bot.gradient} flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className="w-7 h-7 text-white" />
                    </div>

                    <h3 className="text-xl font-semibold text-foreground mb-3">
                      {t(`bots.${bot.key}.title`)}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed mb-6">
                      {t(`bots.${bot.key}.desc`)}
                    </p>
                    <Button variant="outline" className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      {t('bots.cta')}
                    </Button>
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
