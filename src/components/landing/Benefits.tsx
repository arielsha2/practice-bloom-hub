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
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4 tracking-tight">
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
                className={`group bg-card rounded-xl p-8 border border-border transition-all duration-200 hover:shadow-card animate-fade-in ${isRTL ? 'text-right' : ''}`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {/* Icon */}
                <div className="w-12 h-12 rounded-lg bg-primary flex items-center justify-center mb-6">
                  <Icon className="w-6 h-6 text-primary-foreground" />
                </div>

                {/* Content */}
                <h3 className="text-xl font-semibold text-foreground mb-3">
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
