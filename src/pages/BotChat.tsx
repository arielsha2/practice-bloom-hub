import { useState, useEffect, useRef } from 'react';
import { useParams, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { Compass, Map, PenTool, Handshake, Users, Phone, Stethoscope } from 'lucide-react';
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
import { ToolIntroBanner } from '@/components/bots/ToolIntroBanner';
import { ConversationSidebar } from '@/components/bots/ConversationSidebar';
import { ConnectionBridgeStepper } from '@/components/bots/ConnectionBridgeStepper';
import { FirstCallStepper } from '@/components/bots/FirstCallStepper';
import { DiagnosisStepper } from '@/components/bots/DiagnosisStepper';
import { DifficultySelector } from '@/components/bots/DifficultySelector';
import { InsightButton } from '@/components/bots/InsightButton';
import { InsightDialog } from '@/components/bots/InsightDialog';
import { DiagnosisResultDialog, type DiagnosisResult } from '@/components/bots/DiagnosisResultDialog';
import { diagnosisFromOutput } from '@/lib/diagnosisOutput';
import { trackEvent } from '@/lib/analytics';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Menu, Loader2, FileText, Download } from 'lucide-react';
import { downloadDiagnosisReportPdf } from '@/lib/diagnosisReportPdf';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { SEOHead } from '@/components/SEOHead';
import { useBotAccess } from '@/hooks/useUserPlan';
import { UpgradeGate } from '@/components/access/UpgradeGate';

// First word of a registered name, for greeting by name. Titles are skipped, and anything that is not plain letters
// (initials, an e-mail address) counts as no name.
function firstNameOf(raw: string): string {
  const words = raw.trim().split(/\s+/).filter((w) => !['ד״ר', 'ד"ר', 'דר', 'Dr', 'Dr.'].includes(w));
  const w = words[0] ?? '';
  return w.length >= 2 && /^[\u0590-\u05FFA-Za-z'"-]+$/.test(w) ? w : '';
}

const botIcons: Record<string, React.ReactNode> = {
  'niche-finder': <Compass className="w-5 h-5 text-primary" />,
  'strategy-planner': <Map className="w-5 h-5 text-primary" />,
  'content-creator': <PenTool className="w-5 h-5 text-primary" />,
  'connection-bridge': <Handshake className="w-5 h-5 text-primary" />,
  'contact-finder': <Users className="w-5 h-5 text-primary" />,
  'first-call-practice': <Phone className="w-5 h-5 text-primary" />,
  'practice-diagnosis': <Stethoscope className="w-5 h-5 text-primary" />,
};

// Bots that use the [STAGE:N] marker mechanic + stage stepper UI + stage-gated voice.
const STAGE_MARKER_BOTS = new Set(['connection-bridge', 'first-call-practice', 'practice-diagnosis']);

// Subset of STAGE_MARKER_BOTS that also offer a roleplay-difficulty selector.
// practice-diagnosis is a diagnostic interview, not a difficulty-adjustable
// simulation, so it's deliberately excluded here even though it shares the
// stage-marker mechanic above.
const DIFFICULTY_SELECTOR_BOTS = new Set(['connection-bridge', 'first-call-practice']);

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
  const [diagnosisResult, setDiagnosisResult] = useState<DiagnosisResult | null>(null);
  const [showDiagnosisDialog, setShowDiagnosisDialog] = useState(false);
  const [downloadingReport, setDownloadingReport] = useState(false);
  const diagnosisConversationCompletedRef = useRef(false);

  // Data fetching
  const { data: botConfig, isLoading: botLoading } = useBotConfiguration(botKey || '');
  const { data: conversations = [], isLoading: conversationsLoading } = useBotConversations(botKey || '');
  const { data: savedMessages = [], isLoading: messagesLoading } = useBotMessages(activeConversationId);
  const deleteConversation = useDeleteConversation();
  const addUserMemory = useAddUserMemory();
  const { access: planAccess, loading: planLoading, plan } = useBotAccess(botKey);

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
    language,
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

  // Parse stage markers from messages for stage-marker bots
  useEffect(() => {
    if (!STAGE_MARKER_BOTS.has(botKey || '')) return;
    // Find the last assistant message with a stage marker
    for (let i = messages.length - 1; i >= 0; i--) {
      const msg = messages[i];
      if (msg.role === 'assistant') {
        // A message can carry several markers ("[STAGE:3] ... [STAGE:4]" when the model merges the summary and the
        // recommendation), and the highest one is where the conversation actually is.
        const markers = [...msg.content.matchAll(/\[STAGE:(\d)\]/g)].map((m) => parseInt(m[1], 10));
        if (markers.length) {
          const stage = Math.max(...markers);
          setCurrentStage(stage);
          if (
            botKey === 'practice-diagnosis' &&
            stage >= 4 &&
            !diagnosisConversationCompletedRef.current
          ) {
            diagnosisConversationCompletedRef.current = true;
            trackEvent('diagnosis_conversation_completed', {});
          }
          break;
        }
      }
    }
  }, [messages, botKey]);

  // Auto-advance to mentor when the bot signals completion via [ADVANCE] marker.
  // The bot includes this when it concludes the therapist reached sufficient progress
  // OR when the therapist explicitly asks to move on.
  const autoAdvancedRef = useRef(false);
  // True once a reply has streamed in during THIS visit, so reopening an old, finished conversation never
  // re-runs the extraction by itself (the manual button is still there).
  const streamedThisVisitRef = useRef(false);
  useEffect(() => {
    if (chatLoading) streamedThisVisitRef.current = true;
  }, [chatLoading]);
  const isDiagnosisBot = botKey === 'practice-diagnosis';
  // ?report=1 (from the follow-up e-mail) opens the therapist's STORED diagnosis report, without running anything.
  const wantsStoredReport = isDiagnosisBot && searchParams.get('report') === '1';
  const storedReportOpenedRef = useRef(false);
  useEffect(() => {
    if (!wantsStoredReport || !user || storedReportOpenedRef.current) return;
    storedReportOpenedRef.current = true;
    void (async () => {
      const { data: journey } = await supabase
        .from('therapist_journeys')
        .select('diagnosis_output')
        .eq('user_id', user.id)
        .maybeSingle();
      const d = (journey as any)?.diagnosis_output as Record<string, unknown> | null | undefined;
      if (d && d.recommended_tool) {
        setDiagnosisResult(diagnosisFromOutput(d));
        setShowDiagnosisDialog(true);
        trackEvent('diagnosis_report_link_opened', { recommended_tool: String(d.recommended_tool) });
      } else {
        toast.info(isRTL ? 'לא מצאנו אבחון שמור. אפשר להתחיל אבחון חדש כאן.' : 'No saved diagnosis was found. You can start a new one here.');
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wantsStoredReport, user]);
  // A name for the report header. Some accounts store the email as the "name", and a report that gets forwarded
  // should not print an email address, so anything containing "@" counts as no name.
  const rawName = (user?.user_metadata as { full_name?: string } | undefined)?.full_name?.trim() ?? '';
  const reportName = rawName && !rawName.includes('@') ? rawName : null;
  useEffect(() => {
    if (autoAdvancedRef.current) return;
    if (!user || !activeConversationId || returningToMentor) return;
    const last = messages[messages.length - 1];
    if (!last || last.role !== 'assistant' || last.isStreaming) return;
    // The diagnosis conversation ends at its stage-4 message. The model's [ADVANCE] marker is not relied on
    // there: it has fired at stage 2 (the report appeared mid-conversation) and has also been left out at
    // stage 4 (no report at the end), and one early firing used up this one-shot guard.
    const shouldAdvance = isDiagnosisBot ? /\[STAGE:4\]/.test(last.content) : /\[ADVANCE\]/i.test(last.content);
    if (!shouldAdvance) return;
    if (isDiagnosisBot && !streamedThisVisitRef.current) return;
    autoAdvancedRef.current = true;
    // For the diagnosis this starts the report right away (it takes about half a minute); the card below says so,
    // and the therapist reads the closing message while it is prepared.
    const timer = setTimeout(() => {
      toast.success(
        isDiagnosisBot
          ? (isRTL ? 'מכין את הדו״ח שלך…' : 'Preparing your report…')
          : (isRTL ? 'מעביר אותך חזרה למנטור עם הסיכום…' : 'Sending the summary back to your mentor…'),
      );
      // The diagnosis prepares its report in the background and does NOT open it: the dialog used to jump up over
      // the closing message before it was read. The card below turns into "the report is ready" instead.
      if (isDiagnosisBot) void prepareDiagnosisReport(false);
      else handleReturnToMentor();
    }, 1500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, user, activeConversationId, returningToMentor, isRTL, isDiagnosisBot]);

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
    // Don't kickoff stage-marker bots until a difficulty is picked
    if (STAGE_MARKER_BOTS.has(botKey || '')) return;
    kickoffSentRef.current = true;
    const kickoffPrompt = isRTL
      ? '[KICKOFF] המנטור הפנתה אותי אליך עכשיו. אל תציג/י את עצמך מחדש, אל תזכיר/י את אליענה ואל תפתח/י בברכת שלום בשמה. פתח/י ישירות בשאלה הראשונה הממוקדת שלך כדי להתחיל לעבוד יחד. אל תזכיר/י את ההודעה הזו.'
      : "[KICKOFF] The mentor just sent me over to you. Do not re-introduce yourself, do not mention Eliana, and do not greet on her behalf. Open directly with your first focused question to start working together. Don't reference this message.";
    sendMessage(kickoffPrompt, undefined, { hideUserMessage: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isKickoff, authLoading, botLoading, user, activeConversationId, messages.length, chatLoading, botKey, isRTL]);

  // Scroll to bottom on new messages.
  // IMPORTANT: do not use Element.scrollIntoView here — when BotChat runs inside
  // an iframe (the Mentor embeds it), scrollIntoView bubbles to the parent
  // document and scrolls the Mentor page on every message. Instead, scroll the
  // Radix ScrollArea viewport directly so the effect is contained.
  useEffect(() => {
    const end = messagesEndRef.current;
    if (!end) return;
    const viewport = end.closest('[data-radix-scroll-area-viewport]') as HTMLElement | null;
    requestAnimationFrame(() => {
      if (viewport) {
        viewport.scrollTop = viewport.scrollHeight;
      } else {
        // Fallback: keep scroll local to this element's nearest scrollable
        // ancestor and avoid propagating to the parent frame.
        end.scrollIntoView({ block: 'nearest', inline: 'nearest' });
      }
    });
  }, [messages]);

  // Show error toast
  useEffect(() => {
    if (chatError) {
      toast.error(chatError, { duration: 9000 });
    }
  }, [chatError]);

  // Redirect if not authenticated (unless it's a public bot)
  if (!authLoading && !user && !isPublicBot(botKey)) {
    // Someone who opens the diagnosis link signed out (e.g. from a WhatsApp invitation) must come back to the
    // diagnosis after signing up. A bare /auth sends new accounts to the Mentor chat, and the Mentor then has to
    // hand them over to the diagnosis (three real visitors went through exactly that).
    const authBase = language === 'en' ? '/en/auth' : '/auth';
    const authPath = botKey === 'practice-diagnosis'
      ? (searchParams.get('report') === '1' ? `${authBase}?next=report&mode=login` : `${authBase}?next=diagnosis&mode=signup`)
      : `${authBase}?next=bot:${botKey}`;
    return <Navigate to={authPath} replace />;
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

  // Plan-based access gate (skip for public bots / unauthenticated public flow)
  if (user && !isPublicBot(botKey) && !planLoading && planAccess !== 'allowed') {
    return <UpgradeGate />;
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
  const rawWelcome = language === 'he' ? botConfig.welcome_message_he : botConfig.welcome_message_en;
  const greetName = isDiagnosisBot && reportName ? firstNameOf(reportName) : '';
  // A welcome may hold {{askName}}: when the registered name is unknown it becomes a question about what to call them.
  const askName = language === 'he' ? '\n\n**מה שמך?**' : "\n\n**What's your name?**";
  const welcomeMessage = rawWelcome
    ? (greetName ? rawWelcome.replace(/^(היי|Hi),?/, (_m: string, hi: string) => `${hi} ${greetName},`) : rawWelcome)
        .replace('{{askName}}', greetName ? '' : askName)
    : rawWelcome;
  const showWelcome = messages.length === 0 && welcomeMessage;
  const showDifficultySelector = DIFFICULTY_SELECTOR_BOTS.has(botKey || '') && messages.length === 0 && !activeConversationId;

  const handleReturnToMentor = () => prepareDiagnosisReport(true);

  // Opens the finished report on demand (the card and the header button); prepares it first if it does not exist yet.
  const openDiagnosisReport = () => {
    if (diagnosisResult) setShowDiagnosisDialog(true);
    else void prepareDiagnosisReport(true);
  };

  const handleDownloadReportFromChat = async () => {
    const report = diagnosisResult?.report;
    if (!report) {
      openDiagnosisReport();
      return;
    }
    setDownloadingReport(true);
    try {
      await downloadDiagnosisReportPdf(report, { isRTL, displayName: reportName });
      trackEvent('diagnosis_pdf_downloaded', { recommended_tool: diagnosisResult?.recommendedTool ?? '', from: 'chat_card' });
    } catch (e) {
      console.error(e);
      toast.error(isRTL ? 'ההורדה נכשלה' : 'Download failed');
    } finally {
      setDownloadingReport(false);
    }
  };

  const prepareDiagnosisReport = async (openDialog: boolean) => {
    if (!user || !botKey) {
      navigate(isRTL ? '/mentor' : '/en/mentor');
      return;
    }
    setReturningToMentor(true);
    try {
      // If we have a conversation with at least one assistant reply, extract a summary
      const hasContent = messages.filter((m) => m.role === 'assistant').length >= 1 && activeConversationId;
      let extractSucceeded = false;
      if (hasContent) {
        try {
          // supabase-js does NOT throw for a non-2xx function response — it
          // resolves with { data, error } — so this needs an explicit check.
          // Without it, extractSucceeded was true even when extraction had
          // actually failed (e.g. the LLM returning malformed JSON), which
          // for practice-diagnosis meant silently showing a stale diagnosis
          // from a previous run instead of surfacing the failure.
          const { error } = await supabase.functions.invoke('bot-extract-output', {
            body: { botKey, conversationId: activeConversationId, language },
          });
          if (error) throw error;
          extractSucceeded = true;
        } catch (e) {
          console.warn('extract failed, continuing to mentor', e);
        }
      }

      // practice-diagnosis gets a result dialog instead of an immediate
      // navigate — re-fetch the just-written diagnosis_output from the DB
      // rather than trusting bot-extract-output's HTTP response, since that
      // response returns the raw pre-normalization values.
      if (botKey === 'practice-diagnosis' && extractSucceeded) {
        const { data: journey } = await supabase
          .from('therapist_journeys')
          .select('diagnosis_output')
          .eq('user_id', user.id)
          .maybeSingle();
        const d = (journey as any)?.diagnosis_output as Record<string, unknown> | null | undefined;
        if (d) {
          setDiagnosisResult(diagnosisFromOutput(d));
          trackEvent('diagnosis_completed', { recommended_tool: String(d.recommended_tool ?? '') });
          if (openDialog) setShowDiagnosisDialog(true);
          return;
        }
      }

      // A failed background preparation of the report keeps the therapist in the chat (the card offers a retry)
      // instead of sending them away from the closing message.
      if (botKey === 'practice-diagnosis' && !openDialog) {
        toast.error(isRTL ? 'הדו״ח לא הצליח להיווצר. אפשר ללחוץ על הכפתור כדי לנסות שוב.' : 'The report could not be prepared. Press the button to try again.');
        return;
      }
      navigate(`${isRTL ? '/mentor' : '/en/mentor'}?from=${encodeURIComponent(botKey)}`);
    } finally {
      setReturningToMentor(false);
    }
  };

  const handleSend = (content: string) => {
    // Stop any playing TTS before sending new message
    window.dispatchEvent(new Event('stopAllTTS'));
    if (botKey === 'practice-diagnosis' && messages.length === 0) {
      trackEvent('diagnosis_started', {});
    }
    if (DIFFICULTY_SELECTOR_BOTS.has(botKey || '') && messages.length === 0 && selectedDifficulty) {
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
          onReturnToMentor={
            user && (isEmbedded || (botKey === 'practice-diagnosis' && currentStage >= 4))
              ? (isDiagnosisBot ? openDiagnosisReport : handleReturnToMentor)
              : undefined
          }
          isReturningToMentor={returningToMentor}
          returnLabel={
            isDiagnosisBot
              ? (isRTL ? 'לצפייה בדו״ח האבחון' : 'View my diagnosis report')
              : undefined
          }
          isToolMode={isEmbedded}
        />

        {/* Tool intro banner — only when arriving from the mentor */}
        {isEmbedded && (
          <ToolIntroBanner botKey={botKey || ''} botName={botName} isRTL={isRTL} />
        )}

        {/* Stage stepper */}
        {botKey === 'connection-bridge' && (
          <ConnectionBridgeStepper currentStage={currentStage} />
        )}
        {botKey === 'first-call-practice' && (
          <FirstCallStepper currentStage={currentStage} />
        )}
        {botKey === 'practice-diagnosis' && (
          <DiagnosisStepper currentStage={currentStage} />
        )}

        {/* Messages Area */}
        <ScrollArea className="flex-1 p-4">
          <div className="max-w-3xl mx-auto space-y-4">
            {/* Difficulty selector for stage-marker bots */}
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
                variant="tool"
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
                    enableVoice={STAGE_MARKER_BOTS.has(botKey || '') && currentStage >= 3}
                    isLatestAssistant={isLatestAssistant}
                    variant="tool"
                  />
                );
              })}

            {/* Typing indicator */}
            {chatLoading && messages[messages.length - 1]?.role === 'user' && (
              <TypingIndicator />
            )}

            {/* End of the diagnosis: a card that cannot be missed (the header button alone was) */}
            {isDiagnosisBot && user && currentStage >= 4 && !chatLoading && (
              <div className="rounded-xl border-2 border-accent/50 bg-accent/5 p-5 text-center space-y-3">
                <p className="text-base font-semibold text-foreground">
                  {returningToMentor && !diagnosisResult
                    ? (isRTL ? 'האבחון הסתיים. מכינים את הדו״ח הכתוב שלך, זה לוקח כחצי דקה. כאן תופיע הודעה כשהוא מוכן, ואפשר להמשיך לקרוא בינתיים.' : 'The diagnosis is done. Your written report is being prepared, which takes about half a minute. This card will update when it is ready, and you can keep reading meanwhile.')
                    : diagnosisResult
                      ? (isRTL ? 'הדו״ח הכתוב שלך מוכן.' : 'Your written report is ready.')
                      : (isRTL ? 'האבחון הסתיים. אפשר לצפות בדו״ח הכתוב שלך.' : 'The diagnosis is done. You can view your written report.')}
                </p>
                <Button
                  size="lg"
                  onClick={openDiagnosisReport}
                  disabled={returningToMentor && !diagnosisResult}
                  className="w-full sm:w-auto gap-2 px-8 text-base"
                >
                  {returningToMentor && !diagnosisResult ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileText className="w-5 h-5" />}
                  {isRTL ? 'לצפייה בדו״ח האבחון' : 'View my diagnosis report'}
                </Button>
                {diagnosisResult?.report && (
                  <div>
                    <Button variant="outline" onClick={handleDownloadReportFromChat} disabled={downloadingReport} className="gap-2">
                      <Download className="w-4 h-4" />
                      {downloadingReport
                        ? (isRTL ? 'מכין את הקובץ...' : 'Preparing the file...')
                        : (isRTL ? 'הורדת הדו״ח (PDF)' : 'Download the report (PDF)')}
                    </Button>
                  </div>
                )}
              </div>
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
                            { body: { botKey, conversationId: activeConversationId, language } }
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

      {diagnosisResult && (
        <DiagnosisResultDialog
          open={showDiagnosisDialog}
          onOpenChange={setShowDiagnosisDialog}
          result={diagnosisResult}
          isRTL={isRTL}
          displayName={reportName}
          hasPaidAccess={plan.hasPaidAccess}
          onContinue={() => {
            setShowDiagnosisDialog(false);
            navigate(`${isRTL ? '/mentor' : '/en/mentor'}?from=${encodeURIComponent(botKey || '')}`);
          }}
        />
      )}
    </div>
  );
};

export default BotChat;
