import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface BotMessage {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export function useBotMessages(conversationId: string | null) {
  return useQuery({
    queryKey: ['bot-messages', conversationId],
    queryFn: async () => {
      if (!conversationId) return [];

      const { data, error } = await supabase
        .from('bot_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as BotMessage[];
    },
    enabled: !!conversationId,
  });
}

export function useAddMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      conversationId,
      role,
      content,
    }: {
      conversationId: string;
      role: 'user' | 'assistant';
      content: string;
    }) => {
      const { data, error } = await supabase
        .from('bot_messages')
        .insert({
          conversation_id: conversationId,
          role,
          content,
        })
        .select()
        .single();

      if (error) throw error;
      return data as BotMessage;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['bot-messages', data.conversation_id] });
    },
  });
}
