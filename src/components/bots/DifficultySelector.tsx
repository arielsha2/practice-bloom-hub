import { Smile, Meh, ShieldAlert } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

type Difficulty = 'easy' | 'medium' | 'hard';

interface DifficultySelectorProps {
  selected: Difficulty | null;
  onSelect: (difficulty: Difficulty) => void;
}

const difficulties: { key: Difficulty; icon: typeof Smile; colorClass: string }[] = [
  { key: 'easy', icon: Smile, colorClass: 'text-green-500' },
  { key: 'medium', icon: Meh, colorClass: 'text-amber-500' },
  { key: 'hard', icon: ShieldAlert, colorClass: 'text-red-500' },
];

export function DifficultySelector({ selected, onSelect }: DifficultySelectorProps) {
  const { t } = useLanguage();

  return (
    <div className="w-full max-w-md mx-auto space-y-2 py-3">
      <p className="text-sm font-medium text-muted-foreground text-center mb-3">
        {t('difficulty.title')}
      </p>
      {difficulties.map(({ key, icon: Icon, colorClass }) => {
        const isSelected = selected === key;
        return (
          <button
            key={key}
            onClick={() => onSelect(key)}
            className={cn(
              'w-full flex items-center gap-3 p-4 rounded-lg border-2 transition-all duration-200 text-start min-h-[60px]',
              'hover:border-primary/50 hover:bg-primary/5',
              'active:scale-[0.98]',
              isSelected
                ? 'border-primary bg-primary/10 shadow-sm'
                : 'border-border bg-card'
            )}
          >
            <Icon className={cn('w-6 h-6 flex-shrink-0', colorClass)} />
            <div className="flex-1 min-w-0">
              <span className="font-semibold text-foreground block">
                {t(`difficulty.${key}`)}
              </span>
              <span className="text-xs text-muted-foreground block mt-0.5">
                {t(`difficulty.${key}Desc`)}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
