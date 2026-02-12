import { useLanguage } from '@/contexts/LanguageContext';
import { Header } from '@/components/landing/Header';
import { Footer } from '@/components/landing/Footer';
import { Button } from '@/components/ui/button';
import { Compass, Map, PenTool, Calculator, Bot, Handshake } from 'lucide-react';
import { Link } from 'react-router-dom';

const botData = [
  { key: 'niche', icon: Compass },
  { key: 'strategy', icon: Map },
  { key: 'content', icon: PenTool },
  { key: 'pricing', icon: Calculator },
  { key: 'connection', icon: Handshake },
];

const botKeyMapping: Record<string, string> = {
  'niche': 'niche-finder',
  'strategy': 'strategy-planner',
  'content': 'content-creator',
  'pricing': 'pricing-calculator',
  'connection': 'connection-bridge',
};

const AIAssistants = () => {
  const { t, isRTL } = useLanguage();

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'} className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 pt-16">
        <section className="py-24 bg-secondary relative overflow-hidden">
          {/* Decorative background */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-10 left-10 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
            <div className="absolute bottom-10 right-10 w-80 h-80 bg-accent/10 rounded-full blur-3xl" />
          </div>
          
          <div className="container mx-auto px-4 relative z-10">
            {/* Section header */}
            <div className={`text-center max-w-3xl mx-auto mb-16 ${isRTL ? 'text-right md:text-center' : ''}`}>
              <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-2 mb-6">
                <Bot className="w-5 h-5 text-primary" />
                <span className="text-primary font-medium text-sm">AI-Powered</span>
              </div>
              <h1 className="text-3xl md:text-5xl font-serif font-medium text-foreground mb-6 tracking-tight">
                {t('bots.title')}
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                {t('bots.subtitle')}
              </p>
            </div>

            {/* Bots grid */}
            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {botData.map((bot, index) => {
                const Icon = bot.icon;
                return (
                  <div
                    key={bot.key}
                    className={`group bg-card rounded-xl overflow-hidden border border-border/50 shadow-card hover:shadow-elevated transition-all duration-300 animate-fade-in ${isRTL ? 'text-right' : ''}`}
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    {/* Header stripe */}
                    <div className="h-1.5 bg-gradient-to-r from-primary to-primary/70" />

                    {/* Content */}
                    <div className="p-8">
                      {/* Icon */}
                      <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary/15 transition-colors">
                        <Icon className="w-7 h-7 text-primary" />
                      </div>

                      <h2 className="text-xl font-serif font-semibold text-foreground mb-3">
                        {t(`bots.${bot.key}.title`)}
                      </h2>
                      <p className="text-muted-foreground leading-relaxed mb-8">
                        {t(`bots.${bot.key}.desc`)}
                      </p>
                      <Link to={`/ai-assistants/${botKeyMapping[bot.key]}`}>
                        <Button variant="cta" className="w-full">
                          {t('bots.cta')}
                        </Button>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default AIAssistants;
