import { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  isStreaming?: boolean;
}

interface UseBotChatOptions {
  botKey: string;
  conversationId: string | null;
  onConversationCreated?: (conversationId: string) => void;
}

export function useBotChat({ botKey, conversationId, onConversationCreated }: UseBotChatOptions) {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(async (content: string) => {
    if (!session?.access_token || !content.trim() || isLoading) return;

    setError(null);
    setIsLoading(true);

    // Store new conversation ID locally, only notify after streaming ends
    let pendingConversationId: string | null = null;

    // Add user message immediately
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: content.trim(),
    };
    setMessages((prev) => [...prev, userMessage]);

    // Add placeholder for assistant response
    const assistantId = `assistant-${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      { id: assistantId, role: 'assistant', content: '', isStreaming: true },
    ]);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/bot-chat`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            botKey,
            conversationId,
            message: content.trim(),
          }),
        }
      );

      // Check for new conversation ID in header - store but don't notify yet
      const headerConversationId = response.headers.get('X-Conversation-Id');
      if (headerConversationId && headerConversationId !== conversationId) {
        pendingConversationId = headerConversationId;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error ${response.status}`);
      }

      if (!response.body) {
        throw new Error('No response body');
      }

      // Stream the response
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantContent = '';
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Process line by line
        let newlineIndex: number;
        while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
          let line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);

          // Handle CRLF
          if (line.endsWith('\r')) {
            line = line.slice(0, -1);
          }

          // Skip empty lines and SSE comments
          if (line.trim() === '' || line.startsWith(':')) continue;
          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') continue;

          try {
            const parsed = JSON.parse(jsonStr);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) {
              assistantContent += delta;
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === assistantId
                    ? { ...msg, content: assistantContent }
                    : msg
                )
              );
            }
          } catch {
            // Incomplete JSON, put line back and wait for more data
            buffer = line + '\n' + buffer;
            break;
          }
        }
      }

      // Mark as complete
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantId
            ? { ...msg, isStreaming: false }
            : msg
        )
      );

      // Notify about new conversation AFTER streaming is complete
      if (pendingConversationId) {
        onConversationCreated?.(pendingConversationId);
      }

      // Invalidate conversation list only - local state already has the messages
      queryClient.invalidateQueries({ queryKey: ['bot-conversations', botKey] });
    } catch (err) {
      console.error('Chat error:', err);
      setError(err instanceof Error ? err.message : 'שגיאה בשליחת ההודעה');
      
      // Remove the failed assistant message
      setMessages((prev) => prev.filter((msg) => msg.id !== assistantId));
    } finally {
      setIsLoading(false);
    }
  }, [session, botKey, conversationId, onConversationCreated, queryClient]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  const loadMessages = useCallback((loadedMessages: ChatMessage[]) => {
    setMessages(loadedMessages);
  }, []);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    clearMessages,
    loadMessages,
  };
}
