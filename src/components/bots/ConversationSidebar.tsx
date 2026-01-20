import { Plus, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useLanguage } from '@/contexts/LanguageContext';
import { ConversationItem } from './ConversationItem';
import { BotConversation } from '@/hooks/useBotConversations';

interface ConversationSidebarProps {
  conversations: BotConversation[];
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
  onDeleteConversation: (id: string) => void;
  isLoading?: boolean;
}

export function ConversationSidebar({
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
  isLoading,
}: ConversationSidebarProps) {
  const { t } = useLanguage();

  return (
    <div className="flex flex-col h-full bg-card border-l border-border">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2 text-muted-foreground mb-3">
          <History className="w-4 h-4" />
          <span className="text-sm font-medium">{t('chat.previousConversations')}</span>
        </div>
        <Button
          onClick={onNewConversation}
          variant="outline"
          className="w-full justify-start gap-2"
        >
          <Plus className="w-4 h-4" />
          {t('chat.newConversation')}
        </Button>
      </div>

      {/* Conversations list */}
      <ScrollArea className="flex-1 p-2">
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-14 bg-muted/50 rounded-lg animate-pulse"
              />
            ))}
          </div>
        ) : conversations.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-8">
            {t('chat.noConversations')}
          </p>
        ) : (
          <div className="space-y-1">
            {conversations.map((conv) => (
              <ConversationItem
                key={conv.id}
                id={conv.id}
                title={conv.title}
                updatedAt={conv.last_message_at}
                isActive={conv.id === activeConversationId}
                onClick={() => onSelectConversation(conv.id)}
                onDelete={() => onDeleteConversation(conv.id)}
              />
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
