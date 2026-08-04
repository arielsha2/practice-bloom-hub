import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Bot, User, Volume2, VolumeX, Loader2 } from 'lucide-react';
import { useTTS } from '@/hooks/useTTS';
import { useLanguage } from '@/contexts/LanguageContext';

// Simple markdown parser for bold and italic text
function parseMarkdown(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let key = 0;

  while (remaining.length > 0) {
    const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
    
    if (boldMatch && boldMatch.index !== undefined) {
      if (boldMatch.index > 0) {
        parts.push(remaining.slice(0, boldMatch.index));
      }
      parts.push(<strong key={key++} className="font-semibold">{boldMatch[1]}</strong>);
      remaining = remaining.slice(boldMatch.index + boldMatch[0].length);
    } else {
      parts.push(remaining);
      break;
    }
  }

  return parts;
}

interface ChatMessageProps {
  role: 'user' | 'assistant';
  content: string;
  isStreaming?: boolean;
  enableVoice?: boolean;
  isLatestAssistant?: boolean;
  variant?: 'mentor' | 'tool';
}

export function ChatMessage({ role, content, isStreaming, enableVoice, isLatestAssistant, variant = 'mentor' }: ChatMessageProps) {
  const isUser = role === 'user';
  const { t } = useLanguage();
  const [displayedContent, setDisplayedContent] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const hasCompletedRef = useRef(false);
  const wasStreamingRef = useRef(false);
  const hasAutoPlayedRef = useRef(false);
  const typingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // For buffered typing during streaming
  const targetContentRef = useRef('');
  const revealIndexRef = useRef(0);
  const revealTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const tts = useTTS();
  const showVoiceButton = enableVoice && !isUser && tts.isSupported;
  const isVoiceBusy = tts.isLoading || tts.isPlaying;

  // Voice-enabled latest assistant message: audio auto-plays in the background,
  // but text always displays immediately via the normal reveal below — text
  // visibility is never gated on TTS fetch/playback, so a slow or failed TTS
  // call can't make the reply look stuck.
  const isAutoVoiceMessage = enableVoice && isLatestAssistant && !isUser;

  // Clear typing interval helper
  const clearTypingInterval = () => {
    if (typingIntervalRef.current) {
      clearInterval(typingIntervalRef.current);
      typingIntervalRef.current = null;
    }
  };

  const clearRevealTimer = () => {
    if (revealTimerRef.current) {
      clearInterval(revealTimerRef.current);
      revealTimerRef.current = null;
    }
  };

  // Auto-play voice when streaming finishes (only for latest assistant message with voice).
  // Purely a background side effect — does not touch displayedContent.
  useEffect(() => {
    if (
      isAutoVoiceMessage &&
      wasStreamingRef.current &&
      !isStreaming &&
      !hasAutoPlayedRef.current &&
      content.trim()
    ) {
      hasAutoPlayedRef.current = true;
      tts.speak(content);
    }
  }, [isStreaming, isAutoVoiceMessage, content]);

  const handleVoiceToggle = () => {
    if (tts.isPlaying || tts.isLoading) {
      tts.stop();
    } else {
      tts.speak(content);
    }
  };

  // Buffered character-by-character reveal during streaming
  useEffect(() => {
    if (!isStreaming || isUser) return;

    wasStreamingRef.current = true;
    targetContentRef.current = content;

    // Start reveal timer if not already running
    if (!revealTimerRef.current) {
      const TYPING_SPEED = 20; // ms per character
      revealTimerRef.current = setInterval(() => {
        const target = targetContentRef.current;
        if (revealIndexRef.current < target.length) {
          revealIndexRef.current++;
          setDisplayedContent(target.slice(0, revealIndexRef.current));
        }
      }, TYPING_SPEED);
    }

    return () => {}; // Don't clear on every content update, only on unmount or stream end
  }, [content, isStreaming, isUser]);

  // When streaming ends, let the reveal timer catch up then clean up
  useEffect(() => {
    if (!isUser && wasStreamingRef.current && !isStreaming) {
      targetContentRef.current = content;
      
      // Let the reveal timer finish catching up, then clean up
      const checkInterval = setInterval(() => {
        if (revealIndexRef.current >= content.length) {
          clearInterval(checkInterval);
          clearRevealTimer();
          setDisplayedContent(content);
          setIsTyping(false);
          hasCompletedRef.current = true;
        }
      }, 50);
      
      // Safety timeout: show full content after 3 seconds max
      const safetyTimeout = setTimeout(() => {
        clearInterval(checkInterval);
        clearRevealTimer();
        revealIndexRef.current = content.length;
        setDisplayedContent(content);
        setIsTyping(false);
        hasCompletedRef.current = true;
      }, 3000);
      
      return () => {
        clearInterval(checkInterval);
        clearTimeout(safetyTimeout);
      };
    }
  }, [isStreaming, isUser, content]);

  // Cleanup reveal timer on unmount
  useEffect(() => {
    return () => {
      clearRevealTimer();
      clearTypingInterval();
    };
  }, []);

  // Main content display logic (for non-streaming cases)
  useEffect(() => {
    if (isUser) {
      setDisplayedContent(content);
      return;
    }

    // Streaming is handled by the buffered reveal above
    if (isStreaming) {
      wasStreamingRef.current = true;
      return;
    }

    // Post-streaming catch-up is handled above
    if (wasStreamingRef.current && !hasCompletedRef.current) {
      return;
    }

    if (hasCompletedRef.current) {
      setDisplayedContent(content);
      return;
    }

    // Initial load: typing animation for historical messages
    if (content && !hasCompletedRef.current) {
      setIsTyping(true);
      setDisplayedContent('');
      let index = 0;
      const typingSpeed = 20;

      const typeNextChar = () => {
        if (index < content.length) {
          setDisplayedContent(content.slice(0, index + 1));
          index++;
          setTimeout(typeNextChar, typingSpeed);
        } else {
          setIsTyping(false);
          hasCompletedRef.current = true;
        }
      };

      typeNextChar();
    } else {
      setDisplayedContent(content);
    }
  }, [content, isStreaming, isUser]);

  const isRevealing = isStreaming && revealIndexRef.current < targetContentRef.current.length;
  const showCursor = isRevealing || isTyping;

  const isTool = variant === 'tool';

  return (
    <div
      className={cn(
        'flex gap-3 p-4 rounded-lg transition-all animate-fade-in',
        isUser
          ? isTool
            ? 'bg-accent/10 mr-0 ml-8'
            : 'bg-primary/10 mr-0 ml-8'
          : 'bg-card border border-border/50 ml-0 mr-8'
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
          isUser
            ? isTool ? 'bg-accent/20' : 'bg-primary/20'
            : 'bg-accent/20'
        )}
      >
        {isUser ? (
          <User className={cn('w-4 h-4', isTool ? 'text-accent' : 'text-primary')} />
        ) : (
          <Bot className="w-4 h-4 text-accent" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className="text-foreground leading-relaxed whitespace-pre-wrap break-words text-right flex-1" dir="rtl">
            {parseMarkdown(displayedContent)}
            {showCursor && (
              <span className="inline-block w-2 h-4 bg-primary/60 animate-pulse ml-1" />
            )}
          </p>

          {/* Voice button */}
          {showVoiceButton && !isStreaming && displayedContent && (
            <button
              onClick={handleVoiceToggle}
              disabled={tts.isLoading}
              className={cn(
                'flex-shrink-0 p-1.5 rounded-full transition-all',
                isVoiceBusy
                  ? 'bg-primary/20 text-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted',
                tts.isPlaying && 'animate-pulse'
              )}
              title={tts.isLoading ? t('voice.loading') : tts.isPlaying ? t('voice.stop') : t('voice.play')}
            >
              {tts.isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : tts.isPlaying ? (
                <VolumeX className="w-4 h-4" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
