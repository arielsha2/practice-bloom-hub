import { useState, useEffect, useRef } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { Compass, Map, PenTool, Handshake } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useBotConfiguration } from '@/hooks/useBotConfigurations';
import { useBotConversations, useDeleteConversation } from '@/hooks/useBotConversations';
import { useBotMessages } from '@/hooks/useBotMessages';
import { useAddUserMemory } from '@/hooks/useBotUserMemory';
import { useBotChat, ChatMessage as ChatMessageType } from '@/hooks/useBotChat';
import { ChatHeader } from '@/components/bots/ChatHeader';
import { ChatMessage } from '@/components/bots/ChatMessage';
import { ChatInput } from '@/components/bots/ChatInput';
import { TypingIndicator } from '@/components/bots/TypingIndicator';
import { ConversationSidebar } from '@/components/bots/ConversationSidebar';
import { ConnectionBridgeStepper } from '@/components/bots/ConnectionBridgeStepper';
import { DifficultySelector } from '@/components/bots/DifficultySelector';
import { InsightButton } from '@/components/bots/InsightButton';
import { InsightDialog } from '@/components/bots/InsightDialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';
import { toast } from 'sonner';

const botIcons: Record<string, React.ReactNode> = {
  'niche-finder': <Compass className="w-5 h-5 text-primary" />,
  'strategy-planner': <Map className="w-5 h-5 text-primary" />,
  'content-creator': <PenTool className="w-5 h-5 text-primary" />,
  'connection-bridge': <Handshake className="w-5 h-5 text-primary" />,
};

const BotChat = () => {
  const { botKey } = useParams<{ botKey: string }>();
  const { user, loading: authLoading } = useAuth();
  const { t, isRTL, language } = useLanguage();
  
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [insightDialogOpen, setInsightDialogOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isStreamingRef = useRef(false);
  const [currentStage, setCurrentStage] = useState(1);
  const [selectedDifficulty, setSelectedDifficulty] = useState<'easy' | 'medium' | 'hard' | null>(null);

  // Data fetching
  const { data: botConfig, isLoading: botLoading } = useBotConfiguration(botKey || '');
  const { data: conversations = [], isLoading: conversationsLoading } = useBotConversations(botKey || '');
  const { data: savedMessages = [], isLoading: messagesLoading } = useBotMessages(activeConversationId);
  const deleteConversation = useDeleteConversation();
  const addUserMemory = useAddUserMemory();

  // Chat hook
  const {
    messages,
    isLoading: chatLoading,
    error: chatError,
    sendMessage,
    clearMessages,
    loadMessages,
  } = useBotChat({
    botKey: botKey || '',
    conversationId: activeConversationId,
    onConversationCreated: (newId) => {
      setActiveConversationId(newId);
    },
  });

  // Track streaming state in ref
  useEffect(() => {
    isStreamingRef.current = chatLoading || messages.some(m => m.isStreaming);
  }, [chatLoading, messages]);

  // Load saved messages when conversation changes
  // Don't sync during streaming to prevent overwriting local streaming state
  useEffect(() => {
    if (isStreamingRef.current || chatLoading) {
      return;
    }

    // Small delay to ensure DB has updated after streaming ends
    const timeoutId = setTimeout(() => {
      if (isStreamingRef.current) return;
      
      if (savedMessages.length > 0) {
        // Don't overwrite local state if it has more messages (DB hasn't caught up yet)
        if (messages.length > savedMessages.length) {
          return;
        }
        // Compare content to avoid unnecessary re-renders that restart animations
        const savedContents = savedMessages.map(m => m.content);
        const localContents = messages.map(m => m.content);
        const isSameContent = savedContents.length === localContents.length &&
          savedContents[savedContents.length - 1] === localContents[localContents.length - 1];
        
        if (!isSameContent) {
          const formattedMessages: ChatMessageType[] = savedMessages.map((msg) => ({
            id: msg.id,
            role: msg.role,
            content: msg.content,
          }));
          loadMessages(formattedMessages);
        }
      }
      // Removed auto-clear: clearing is only done via handleNewConversation
    }, 150);

    return () => clearTimeout(timeoutId);
  }, [savedMessages, activeConversationId, loadMessages, clearMessages, messages]);

  // Parse stage markers from messages for connection-bridge bot
  useEffect(() => {
    if (botKey !== 'connection-bridge') return;
    // Find the last assistant message with a stage marker
    for (let i = messages.length - 1; i >= 0; i--) {
      const msg = messages[i];
      if (msg.role === 'assistant') {
        const match = msg.content.match(/\[STAGE:(\d)\]/);
        if (match) {
          setCurrentStage(parseInt(match[1], 10));
          break;
        }
      }
    }
  }, [messages, botKey]);

  // Helper to strip stage markers from content
  const stripStageMarker = (content: string) => content.replace(/\[STAGE:\d\]\s*/g, '');

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Show error toast
  useEffect(() => {
    if (chatError) {
      toast.error(chatError);
    }
  }, [chatError]);

  // Redirect if not authenticated
  if (!authLoading && !user) {
    return <Navigate to="/auth" replace />;
  }

  // Loading state
  if (authLoading || botLoading) {
    return (
      <div className="min-h-screen bg-secondary flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  // Bot not found
  if (!botConfig) {
    return <Navigate to="/ai-assistants" replace />;
  }

  const botName = language === 'he' ? botConfig.name_he : botConfig.name_en;
  const botIcon = botIcons[botKey || ''] || <Compass className="w-5 h-5 text-primary" />;

  const handleNewConversation = () => {
    setActiveConversationId(null);
    clearMessages();
    setCurrentStage(1);
    setSelectedDifficulty(null);
    setSidebarOpen(false);
  };

  const handleSelectConversation = (id: string) => {
    setActiveConversationId(id);
    setSidebarOpen(false);
  };

  const handleDeleteConversation = (id: string) => {
    deleteConversation.mutate(
      { conversationId: id, botKey: botKey || '' },
      {
        onSuccess: () => {
          if (activeConversationId === id) {
            setActiveConversationId(null);
            clearMessages();
          }
          toast.success(t('chat.conversationDeleted'));
        },
        onError: () => {
          toast.error(t('chat.deleteError'));
        },
      }
    );
  };

  const handleSaveInsight = (content: string) => {
    addUserMemory.mutate(
      { botKey: botKey || '', memoryContent: content },
      {
        onSuccess: () => {
          toast.success(t('chat.insight.saved'));
        },
        onError: () => {
          toast.error(t('chat.insight.error'));
        },
      }
    );
  };

  // Show welcome message if no messages and bot has welcome message
  const welcomeMessage = language === 'he' ? botConfig.welcome_message_he : botConfig.welcome_message_en;
  const showWelcome = messages.length === 0 && welcomeMessage;
  const showDifficultySelector = botKey === 'connection-bridge' && messages.length === 0 && !activeConversationId;

  const handleSend = (content: string) => {
    if (botKey === 'connection-bridge' && messages.length === 0 && selectedDifficulty) {
      sendMessage(content, `[DIFFICULTY:${selectedDifficulty}]`);
    } else {
      sendMessage(content);
    }
  };

  const sidebarContent = (
    <ConversationSidebar
      conversations={conversations}
      activeConversationId={activeConversationId}
      onSelectConversation={handleSelectConversation}
      onNewConversation={handleNewConversation}
      onDeleteConversation={handleDeleteConversation}
      isLoading={conversationsLoading}
    />
  );

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'} className="min-h-screen bg-secondary flex">
      {/* Desktop Sidebar */}
      <div className="hidden md:block w-72 flex-shrink-0">
        {sidebarContent}
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <ChatHeader
          botName={botName}
          botIcon={botIcon}
          onToggleSidebar={() => setSidebarOpen(true)}
          showMenuButton
        />

        {/* Connection Bridge Stepper */}
        {botKey === 'connection-bridge' && (
          <ConnectionBridgeStepper currentStage={currentStage} />
        )}

        {/* Messages Area */}
        <ScrollArea className="flex-1 p-4">
          <div className="max-w-3xl mx-auto space-y-4">
            {/* Difficulty selector for connection-bridge */}
            {showDifficultySelector && (
              <DifficultySelector
                selected={selectedDifficulty}
                onSelect={setSelectedDifficulty}
              />
            )}

            {/* Welcome message */}
            {showWelcome && welcomeMessage && (
              <ChatMessage
                role="assistant"
                content={welcomeMessage}
              />
            )}

            {/* Chat messages */}
            {messages.map((msg) => (
              <ChatMessage
                key={msg.id}
                role={msg.role}
                content={botKey === 'connection-bridge' ? stripStageMarker(msg.content) : msg.content}
                isStreaming={msg.isStreaming}
              />
            ))}

            {/* Typing indicator */}
            {chatLoading && messages[messages.length - 1]?.role === 'user' && (
              <TypingIndicator />
            )}

            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="border-t border-border bg-card p-4">
          <div className="max-w-3xl mx-auto space-y-3">
            <ChatInput
              onSend={handleSend}
              isLoading={chatLoading}
            />
            <div className="flex justify-start">
              <InsightButton
                onClick={() => setInsightDialogOpen(true)}
                disabled={chatLoading}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sidebar Sheet */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side={isRTL ? 'right' : 'left'} className="w-72 p-0">
          {sidebarContent}
        </SheetContent>
      </Sheet>

      {/* Insight Dialog */}
      <InsightDialog
        open={insightDialogOpen}
        onOpenChange={setInsightDialogOpen}
        onSave={handleSaveInsight}
        isLoading={addUserMemory.isPending}
      />
    </div>
  );
};

export default BotChat;
