import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { playTypewriterClick } from '@/lib/typewriterSound';
import { Bot, User } from 'lucide-react';

// Simple markdown parser for bold and italic text
function parseMarkdown(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let key = 0;

  while (remaining.length > 0) {
    // Match bold (**text**)
    const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
    
    if (boldMatch && boldMatch.index !== undefined) {
      // Add text before the match
      if (boldMatch.index > 0) {
        parts.push(remaining.slice(0, boldMatch.index));
      }
      // Add bold text
      parts.push(<strong key={key++} className="font-semibold">{boldMatch[1]}</strong>);
      remaining = remaining.slice(boldMatch.index + boldMatch[0].length);
    } else {
      // No more matches, add remaining text
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
      const typingSpeed = 35;

      const typeNextChar = () => {
        if (index < content.length) {
          setDisplayedContent(content.slice(0, index + 1));
          // Play click every few characters for subtlety
          // Sound removed
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
          {parseMarkdown(displayedContent)}
          {showCursor && (
            <span className="inline-block w-2 h-4 bg-primary/60 animate-pulse ml-1" />
          )}
        </p>
      </div>
    </div>
  );
}