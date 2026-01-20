import { format } from 'date-fns';
import { MessageSquare, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';

interface ConversationItemProps {
  id: string;
  title: string;
  updatedAt: string;
  isActive: boolean;
  onClick: () => void;
  onDelete: () => void;
}

export function ConversationItem({
  title,
  updatedAt,
  isActive,
  onClick,
  onDelete,
}: ConversationItemProps) {
  const formattedDate = format(new Date(updatedAt), 'dd/MM');

  return (
    <div
      className={cn(
        'group flex items-center gap-2 p-3 rounded-lg cursor-pointer transition-all',
        isActive
          ? 'bg-primary/15 border border-primary/30'
          : 'hover:bg-muted/50 border border-transparent'
      )}
      onClick={onClick}
    >
      <MessageSquare className={cn(
        'w-4 h-4 flex-shrink-0',
        isActive ? 'text-primary' : 'text-muted-foreground'
      )} />
      
      <div className="flex-1 min-w-0">
        <p className={cn(
          'text-sm font-medium truncate',
          isActive ? 'text-primary' : 'text-foreground'
        )}>
          {title}
        </p>
        <p className="text-xs text-muted-foreground">{formattedDate}</p>
      </div>

      <Button
        variant="ghost"
        size="icon"
        className="w-7 h-7 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
      >
        <Trash2 className="w-3.5 h-3.5 text-muted-foreground hover:text-destructive" />
      </Button>
    </div>
  );
}
