import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Compass, Map, PenTool, Bot } from 'lucide-react';

const botData = [
  { key: 'niche', icon: Compass },
  { key: 'strategy', icon: Map },
  { key: 'content', icon: PenTool },
];

export function Bots() {
  const { t, isRTL } = useLanguage();

  return (
    <section id="bots" className="py-24 bg-secondary">
      <div className="container mx-auto px-4">
        {/* Section header */}
        <div className={`text-center max-w-3xl mx-auto mb-16 ${isRTL ? 'text-right md:text-center' : ''}`}>
          <div className="inline-flex items-center gap-2 bg-primary/10 rounded-full px-4 py-2 mb-4">
            <Bot className="w-5 h-5 text-primary" />
            <span className="text-primary font-medium text-sm">AI-Powered</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4 tracking-tight">
            {t('bots.title')}
          </h2>
          <p className="text-lg text-muted-foreground">
            {t('bots.subtitle')}
          </p>
        </div>

        {/* Bots grid */}
        <div className="grid md:grid-cols-3 gap-8">
          {botData.map((bot, index) => {
            const Icon = bot.icon;
            return (
              <div
                key={bot.key}
                className={`group bg-card rounded-xl overflow-hidden border border-border transition-all duration-200 hover:shadow-card animate-fade-in ${isRTL ? 'text-right' : ''}`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {/* Header stripe */}
                <div className="h-2 bg-primary" />

                {/* Content */}
                <div className="p-6">
                  {/* Icon */}
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>

                  <h3 className="text-xl font-semibold text-foreground mb-3">
                    {t(`bots.${bot.key}.title`)}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed mb-6">
                    {t(`bots.${bot.key}.desc`)}
                  </p>
                  <Button variant="outline" className="w-full">
                    {t('bots.cta')}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
