import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, Menu, Settings, Sparkles, Loader2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useIsAdmin } from '@/hooks/useIsAdmin';

interface ChatHeaderProps {
  botName: string;
  botIcon: React.ReactNode;
  onToggleSidebar?: () => void;
  showMenuButton?: boolean;
  onReturnToMentor?: () => void;
  isReturningToMentor?: boolean;
}

export function ChatHeader({
  botName,
  botIcon,
  onToggleSidebar,
  showMenuButton,
  onReturnToMentor,
  isReturningToMentor,
}: ChatHeaderProps) {
  const { t, isRTL } = useLanguage();
  const { isAdmin } = useIsAdmin();

  return (
    <header className="flex items-center justify-between p-4 border-b border-border bg-card">
      <div className="flex items-center gap-3">
        {showMenuButton && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleSidebar}
            className="md:hidden"
          >
            <Menu className="w-5 h-5" />
          </Button>
        )}
        
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          {botIcon}
        </div>
        
        <h1 className="text-lg font-serif font-semibold text-foreground">
          {botName}
        </h1>
      </div>

      <div className="flex items-center gap-2">
        {isAdmin && (
          <Link to="/admin/bots">
            <Button variant="ghost" size="icon" className="text-muted-foreground">
              <Settings className="w-5 h-5" />
            </Button>
          </Link>
        )}
        
        <Link to="/ai-assistants">
          <Button variant="ghost" size="sm" className="gap-2">
            {t('chat.back')}
            {isRTL ? (
              <ArrowRight className="w-4 h-4 rotate-180" />
            ) : (
              <ArrowRight className="w-4 h-4" />
            )}
          </Button>
        </Link>
      </div>
    </header>
  );
}
