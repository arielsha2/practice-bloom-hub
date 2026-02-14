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
}

export function ChatMessage({ role, content, isStreaming, enableVoice, isLatestAssistant }: ChatMessageProps) {
  const isUser = role === 'user';
  const { t } = useLanguage();
  const [displayedContent, setDisplayedContent] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const hasCompletedRef = useRef(false);
  const wasStreamingRef = useRef(false);
  const hasAutoPlayedRef = useRef(false);

  const tts = useTTS();
  const showVoiceButton = enableVoice && !isUser && tts.isSupported;

  // Auto-play voice when streaming finishes (only for latest assistant message)
  useEffect(() => {
    if (
      enableVoice &&
      isLatestAssistant &&
      !isUser &&
      wasStreamingRef.current &&
      !isStreaming &&
      !hasAutoPlayedRef.current &&
      content.trim()
    ) {
      hasAutoPlayedRef.current = true;
      tts.speak(content);
    }
  }, [isStreaming, enableVoice, isLatestAssistant, isUser, content]);

  const handleVoiceToggle = () => {
    if (tts.isPlaying) {
      tts.stop();
    } else {
      tts.speak(content);
    }
  };

  useEffect(() => {
    if (isUser) {
      setDisplayedContent(content);
      return;
    }

    if (isStreaming) {
      setDisplayedContent(content);
      wasStreamingRef.current = true;
      return;
    }

    if (wasStreamingRef.current) {
      setDisplayedContent(content);
      hasCompletedRef.current = true;
      return;
    }

    if (hasCompletedRef.current) {
      setDisplayedContent(content);
      return;
    }

    if (content && !hasCompletedRef.current) {
      setIsTyping(true);
      setDisplayedContent('');
      let index = 0;
      const typingSpeed = 35;

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

  const showCursor = isStreaming || isTyping;

  return (
    <div
      className={cn(
        'flex gap-3 p-4 rounded-lg transition-all animate-fade-in',
        isUser
          ? 'bg-primary/10 mr-0 ml-8'
          : 'bg-card border border-border/50 ml-0 mr-8'
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
          isUser ? 'bg-primary/20' : 'bg-accent/20'
        )}
      >
        {isUser ? (
          <User className="w-4 h-4 text-primary" />
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
              className={cn(
                'flex-shrink-0 p-1.5 rounded-full transition-all',
                tts.isPlaying
                  ? 'bg-primary/20 text-primary animate-pulse'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              )}
              title={tts.isPlaying ? t('voice.stop') : t('voice.play')}
            >
              {tts.isPlaying ? (
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
