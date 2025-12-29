import { useLanguage } from '@/contexts/LanguageContext';
import { Link } from 'react-router-dom';
import { Bot, ArrowRight, ArrowLeft } from 'lucide-react';

export function BotsTeaser() {
  const { t, isRTL } = useLanguage();
  const Arrow = isRTL ? ArrowLeft : ArrowRight;

  return (
    <section className="py-12 bg-secondary">
      <div className="container mx-auto px-4">
        <div className={`flex items-center justify-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <Bot className="w-5 h-5 text-primary" />
          <span className="text-muted-foreground">
            {t('bots.teaser')}
          </span>
          <Link 
            to="/ai-assistants" 
            className={`inline-flex items-center gap-1 text-primary font-medium hover:underline ${isRTL ? 'flex-row-reverse' : ''}`}
          >
            {t('bots.teaserLink')}
            <Arrow className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
