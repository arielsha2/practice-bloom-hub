import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Bot, User } from 'lucide-react';

interface ChatMessageProps {
  role: 'user' | 'assistant';
  content: string;
  isStreaming?: boolean;
}

export function ChatMessage({ role, content, isStreaming }: ChatMessageProps) {
  const isUser = role === 'user';
  const [displayedContent, setDisplayedContent] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const hasCompletedRef = useRef(false);
  const wasStreamingRef = useRef(false);

  useEffect(() => {
    // User messages - show immediately
    if (isUser) {
      setDisplayedContent(content);
      return;
    }

    // During streaming - show content as it arrives
    if (isStreaming) {
      setDisplayedContent(content);
      wasStreamingRef.current = true;
      return;
    }

    // Just finished streaming - keep the content, don't re-animate
    if (wasStreamingRef.current) {
      setDisplayedContent(content);
      hasCompletedRef.current = true;
      return;
    }

    // Already completed (e.g., re-render) - show immediately
    if (hasCompletedRef.current) {
      setDisplayedContent(content);
      return;
    }

    // New message from history - animate typing
    if (content && !hasCompletedRef.current) {
      setIsTyping(true);
      setDisplayedContent('');
      let index = 0;
      const typingSpeed = 12;

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
        <p className="text-foreground leading-relaxed whitespace-pre-wrap break-words text-right" dir="rtl">
          {displayedContent}
          {showCursor && (
            <span className="inline-block w-2 h-4 bg-primary/60 animate-pulse ml-1" />
          )}
        </p>
      </div>
    </div>
  );
}