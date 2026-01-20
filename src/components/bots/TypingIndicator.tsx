import { useLanguage } from '@/contexts/LanguageContext';
import { Bot } from 'lucide-react';

export function TypingIndicator() {
  const { t } = useLanguage();

  return (
    <div className="flex gap-3 p-4 rounded-lg bg-card border border-border/50 ml-0 mr-8 animate-fade-in">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center">
        <Bot className="w-4 h-4 text-accent" />
      </div>
      <div className="flex items-center gap-2">
        <div className="flex gap-1">
          <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
        <span className="text-sm text-muted-foreground">{t('chat.typing')}</span>
      </div>
    </div>
  );
}
