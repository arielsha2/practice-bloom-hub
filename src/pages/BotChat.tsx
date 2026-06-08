import { useState, useEffect, useRef } from 'react';
import { useParams, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { Compass, Map, PenTool, Handshake, Users } from 'lucide-react';
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
import { supabase } from '@/integrations/supabase/client';
import { SEOHead } from '@/components/SEOHead';

const botIcons: Record<string, React.ReactNode> = {
  'niche-finder': <Compass className="w-5 h-5 text-primary" />,
  'strategy-planner': <Map className="w-5 h-5 text-primary" />,
  'content-creator': <PenTool className="w-5 h-5 text-primary" />,
  'connection-bridge': <Handshake className="w-5 h-5 text-primary" />,
  'contact-finder': <Users className="w-5 h-5 text-primary" />,
};

// Bots that are publicly accessible without authentication (with expiry dates)
const PUBLIC_BOTS: Record<string, string> = {
  'contact-finder': '2026-03-22', // accessible until March 22, 2026
};

const isPublicBot = (key: string | undefined): boolean => {
  if (!key || !PUBLIC_BOTS[key]) return false;
  return new Date() < new Date(PUBLIC_BOTS[key]);
};

const BotChat = () => {
  const { botKey: paramBotKey } = useParams<{ botKey: string }>();
  // Support /contact-finder as a direct route (no param)
  const botKey = paramBotKey || 'contact-finder';
  const { user, loading: authLoading } = useAuth();
  const { t, isRTL, language } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isKickoff = searchParams.get('kickoff') === '1';
  const isEmbedded = searchParams.get('from') === 'mentor' || isKickoff;
  
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [insightDialogOpen, setInsightDialogOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [returningToMentor, setReturningToMentor] = useState(false);
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

  // Auto-advance to mentor when the bot signals completion via [ADVANCE] marker.
  // The bot includes this when it concludes the therapist reached sufficient progress
  // OR when the therapist explicitly asks to move on.
  const autoAdvancedRef = useRef(false);
  useEffect(() => {
    if (autoAdvancedRef.current) return;
    if (!user || !activeConversationId || returningToMentor) return;
    const last = messages[messages.length - 1];
    if (!last || last.role !== 'assistant' || last.isStreaming) return;
    if (!/\[ADVANCE\]/i.test(last.content)) return;
    autoAdvancedRef.current = true;
    const timer = setTimeout(() => {
      toast.success(isRTL ? 'מעביר אותך חזרה למנטור עם הסיכום…' : 'Sending the summary back to your mentor…');
      handleReturnToMentor();
    }, 1500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, user, activeConversationId, returningToMentor, isRTL]);

  // Helper to strip stage markers from content (including the ADVANCE completion marker
  // and the silent KICKOFF marker we prepend to the first auto-greeting prompt).
  const stripStageMarker = (content: string) =>
    content
      .replace(/\[STAGE:\d\]\s*/g, '')
      .replace(/\[ADVANCE\]\s*/gi, '')
      .replace(/^\[KICKOFF\]\s*/i, '');

  // Auto-kickoff: when opened from mentor with ?kickoff=1 and no existing
  // conversation/messages, send a silent prompt so the bot greets first.
  const kickoffSentRef = useRef(false);
  useEffect(() => {
    if (!isKickoff || kickoffSentRef.current) return;
    if (authLoading || botLoading) return;
    if (!user && !isPublicBot(botKey)) return;
    if (activeConversationId) return;
    if (messages.length > 0 || chatLoading) return;
    // Don't kickoff connection-bridge until a difficulty is picked
    if (botKey === 'connection-bridge') return;
    kickoffSentRef.current = true;
    const kickoffPrompt = isRTL
      ? '[KICKOFF] המנטור אליענה הפנתה אותי אליך עכשיו. תציג/י את עצמך בקצרה במשפט אחד (מי את/ה ובמה הכלי הזה עוזר), ואז שאל/י אותי את השאלה הראשונה שלך כדי להתחיל. אל תזכיר/י את ההודעה הזו.'
      : "[KICKOFF] The mentor Eliana just sent me over to you. Please introduce yourself briefly in one sentence (who you are and what this tool helps with), then ask me your first question to get started. Don't reference this message.";
    sendMessage(kickoffPrompt, undefined, { hideUserMessage: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isKickoff, authLoading, botLoading, user, activeConversationId, messages.length, chatLoading, botKey, isRTL]);

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

  // Redirect if not authenticated (unless it's a public bot)
  if (!authLoading && !user && !isPublicBot(botKey)) {
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

  const handleReturnToMentor = async () => {
    if (!user || !botKey) {
      navigate('/mentor');
      return;
    }
    setReturningToMentor(true);
    try {
      // If we have a conversation with at least one assistant reply, extract a summary
      const hasContent = messages.filter((m) => m.role === 'assistant').length >= 1 && activeConversationId;
      if (hasContent) {
        try {
          await supabase.functions.invoke('bot-extract-output', {
            body: { botKey, conversationId: activeConversationId },
          });
        } catch (e) {
          console.warn('extract failed, continuing to mentor', e);
        }
      }
      navigate(`/mentor?from=${encodeURIComponent(botKey)}`);
    } finally {
      setReturningToMentor(false);
    }
  };

  const handleSend = (content: string) => {
    // Stop any playing TTS before sending new message
    window.dispatchEvent(new Event('stopAllTTS'));
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
    <div
      dir={isRTL ? 'rtl' : 'ltr'}
      className={`min-h-screen bg-secondary flex ${isEmbedded ? 'font-body' : ''}`}
    >
      <SEOHead
        title={`${botName} | עוזרי AI למטפלים | TherapyKeys`}
        description={`${botName} — עוזר AI ייעודי למטפלים בשיטת "על שפת הקליניקה" של ד"ר אריאל שפירא. שיחה ממוקדת לבניית קליניקה פרטית מצליחה.`}
        canonicalUrl={`/ai-assistants/${botKey}`}
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          name: botName,
          applicationCategory: "HealthApplication",
          operatingSystem: "Web",
          inLanguage: "he",
          url: `https://therapykeys.co.il/ai-assistants/${botKey}`,
          creator: {
            "@type": "Person",
            "@id": "https://therapykeys.co.il/#ariel-shapira",
            name: 'ד"ר אריאל שפירא',
          },
          publisher: {
            "@type": "Organization",
            "@id": "https://therapykeys.co.il/#organization",
            name: "TherapyKeys",
          },
          offers: {
            "@type": "Offer",
            price: "0",
            priceCurrency: "ILS",
            availability: "https://schema.org/InStock",
          },
        }}
      />
      {/* Desktop Sidebar - hidden for anonymous users */}
      {user && (
        <div className="hidden md:block w-72 flex-shrink-0">
          {sidebarContent}
        </div>
      )}

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <ChatHeader
          botName={botName}
          botIcon={botIcon}
          onToggleSidebar={() => setSidebarOpen(true)}
          showMenuButton
          onReturnToMentor={user && isEmbedded ? handleReturnToMentor : undefined}
          isReturningToMentor={returningToMentor}
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

            {/* Chat messages — hide silent kickoff prompts from the transcript */}
            {messages
              .filter((msg) => !(msg.role === 'user' && /^\[KICKOFF\]/i.test(msg.content)))
              .map((msg, index, arr) => {
                const isLatestAssistant = msg.role === 'assistant' &&
                  index === arr.map(m => m.role).lastIndexOf('assistant');
                return (
                  <ChatMessage
                    key={msg.id}
                    role={msg.role}
                    content={stripStageMarker(msg.content)}
                    isStreaming={msg.isStreaming}
                    enableVoice={botKey === 'connection-bridge' && currentStage >= 3}
                    isLatestAssistant={isLatestAssistant}
                  />
                );
              })}

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
            {user && (
              <div className="flex justify-between items-center gap-2 flex-wrap">
                <InsightButton
                  onClick={() => setInsightDialogOpen(true)}
                  disabled={chatLoading}
                />
                {(botKey === "niche-finder" || botKey === "self-presentation") &&
                  activeConversationId &&
                  messages.filter((m) => m.role === "assistant").length >= 3 && (
                    <Button
                      size="sm"
                      variant="default"
                      disabled={chatLoading}
                      onClick={async () => {
                        try {
                          const { data, error } = await supabase.functions.invoke(
                            "bot-extract-output",
                            { body: { botKey, conversationId: activeConversationId } }
                          );
                          if (error) throw error;
                          toast.success("הניסוח נשמר במסע שלך");
                          window.dispatchEvent(new Event("therapist-journey-updated"));
                        } catch (e) {
                          console.error(e);
                          toast.error("שמירה נכשלה");
                        }
                      }}
                    >
                      ✓ אשר ושמור את הניסוח
                    </Button>
                  )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Sidebar Sheet - hidden for anonymous users */}
      {user && (
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetContent side={isRTL ? 'right' : 'left'} className="w-72 p-0">
            {sidebarContent}
          </SheetContent>
        </Sheet>
      )}

      {/* Insight Dialog - hidden for anonymous users */}
      {user && (
        <InsightDialog
          open={insightDialogOpen}
          onOpenChange={setInsightDialogOpen}
          onSave={handleSaveInsight}
          isLoading={addUserMemory.isPending}
        />
      )}
    </div>
  );
};

export default BotChat;
