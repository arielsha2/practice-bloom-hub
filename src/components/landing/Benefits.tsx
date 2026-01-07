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
    <section id="benefits" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className={`grid md:grid-cols-3 gap-6 max-w-5xl mx-auto ${isRTL ? 'text-right' : ''}`}>
          {benefits.map((benefit, index) => {
            const Icon = benefit.icon;
            return (
              <div
                key={benefit.key}
                className={`group bg-card rounded-xl p-6 border border-border/50 shadow-card hover:shadow-elevated transition-all duration-300 animate-fade-in ${isRTL ? 'text-right' : ''}`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className={`flex items-start gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/15 transition-colors">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      {t(`benefits.${benefit.key}.title`)}
                    </h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {t(`benefits.${benefit.key}.desc`)}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
