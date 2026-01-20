import { Button } from '@/components/ui/button';
import { Lightbulb } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface InsightButtonProps {
  onClick: () => void;
  disabled?: boolean;
}

export function InsightButton({ onClick, disabled }: InsightButtonProps) {
  const { t } = useLanguage();

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onClick}
      disabled={disabled}
      className="text-muted-foreground hover:text-accent gap-2"
    >
      <Lightbulb className="w-4 h-4" />
      {t('chat.insight.button')}
    </Button>
  );
}
