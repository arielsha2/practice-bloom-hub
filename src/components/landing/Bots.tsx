import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Compass, Map, PenTool, Bot } from 'lucide-react';

const botData = [
  { key: 'niche', icon: Compass, color: 'from-primary to-terracotta-dark' },
  { key: 'strategy', icon: Map, color: 'from-accent to-gold' },
  { key: 'content', icon: PenTool, color: 'from-terracotta-light to-primary' },
];

export function Bots() {
  const { t, isRTL } = useLanguage();

  return (
    <section id="bots" className="py-24 bg-secondary/50">
      <div className="container mx-auto px-4">
        {/* Section header */}
        <div className={`text-center max-w-3xl mx-auto mb-16 ${isRTL ? 'text-right md:text-center' : ''}`}>
          <div className="inline-flex items-center gap-2 bg-primary/10 rounded-full px-4 py-2 mb-4">
            <Bot className="w-5 h-5 text-primary" />
            <span className="text-primary font-medium text-sm">AI-Powered</span>
          </div>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
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
                className={`group relative bg-card rounded-2xl overflow-hidden shadow-card hover:shadow-elevated transition-all duration-300 hover:-translate-y-2 border border-border animate-scale-in ${isRTL ? 'text-right' : ''}`}
                style={{ animationDelay: `${index * 0.15}s` }}
              >
                {/* Gradient header */}
                <div className={`h-32 bg-gradient-to-br ${bot.color} flex items-center justify-center relative`}>
                  <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIyIi8+PC9nPjwvZz48L3N2Zz4=')] opacity-50" />
                  <div className="w-16 h-16 rounded-2xl bg-primary-foreground/20 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Icon className="w-8 h-8 text-primary-foreground" />
                  </div>
                </div>

                {/* Content */}
                <div className="p-6">
                  <h3 className="font-display text-xl font-semibold text-foreground mb-3">
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
