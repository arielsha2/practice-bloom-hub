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
    <section id="benefits" className="py-24 bg-background">
      <div className="container mx-auto px-4">
        {/* Section header */}
        <div className={`text-center max-w-3xl mx-auto mb-16 ${isRTL ? 'text-right md:text-center' : ''}`}>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
            {t('benefits.title')}
          </h2>
          <p className="text-lg text-muted-foreground">
            {t('benefits.subtitle')}
          </p>
        </div>

        {/* Benefits grid */}
        <div className="grid md:grid-cols-3 gap-8">
          {benefits.map((benefit, index) => {
            const Icon = benefit.icon;
            return (
              <div
                key={benefit.key}
                className={`group bg-card rounded-2xl p-8 shadow-card hover:shadow-elevated transition-all duration-300 hover:-translate-y-1 border border-border animate-fade-in ${isRTL ? 'text-right' : ''}`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {/* Icon */}
                <div className="w-14 h-14 rounded-xl bg-gradient-warm flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Icon className="w-7 h-7 text-primary-foreground" />
                </div>

                {/* Content */}
                <h3 className="font-display text-xl font-semibold text-foreground mb-3">
                  {t(`benefits.${benefit.key}.title`)}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {t(`benefits.${benefit.key}.desc`)}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
