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
    <section id="benefits" className="py-16 bg-background">
      <div className="container mx-auto px-4">
        <div className={`flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16 ${isRTL ? 'md:flex-row-reverse' : ''}`}>
          {benefits.map((benefit, index) => {
            const Icon = benefit.icon;
            return (
              <div
                key={benefit.key}
                className={`flex items-center gap-3 animate-fade-in ${isRTL ? 'flex-row-reverse' : ''}`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <span className="text-foreground font-medium">
                  {t(`benefits.${benefit.key}.title`)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
