import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Tables } from '@/integrations/supabase/types';

export type BotConversation = Tables<'bot_conversations'>;

export function useBotConversations(botKey: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['bot-conversations', botKey, user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('bot_conversations')
        .select('*')
        .eq('bot_key', botKey)
        .eq('user_id', user.id)
        .order('last_message_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user && !!botKey,
  });
}

export function useCreateConversation() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ botKey, title = 'שיחה חדשה' }: { botKey: string; title?: string }) => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('bot_conversations')
        .insert({
          user_id: user.id,
          bot_key: botKey,
          title,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['bot-conversations', data.bot_key] });
    },
  });
}

export function useUpdateConversationTitle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ conversationId, title }: { conversationId: string; title: string }) => {
      const { data, error } = await supabase
        .from('bot_conversations')
        .update({ title })
        .eq('id', conversationId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['bot-conversations', data.bot_key] });
    },
  });
}

export function useDeleteConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ conversationId, botKey }: { conversationId: string; botKey: string }) => {
      // First delete all messages in the conversation
      await supabase
        .from('bot_messages')
        .delete()
        .eq('conversation_id', conversationId);

      // Then delete the conversation
      const { error } = await supabase
        .from('bot_conversations')
        .delete()
        .eq('id', conversationId);

      if (error) throw error;
      return { conversationId, botKey };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['bot-conversations', data.botKey] });
    },
  });
}
