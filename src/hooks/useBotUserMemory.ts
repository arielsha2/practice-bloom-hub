import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Tables } from '@/integrations/supabase/types';

export type BotUserMemory = Tables<'bot_user_memory'>;

export function useBotUserMemory(botKey: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['bot-user-memory', botKey, user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('bot_user_memory')
        .select('*')
        .eq('bot_key', botKey)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user && !!botKey,
  });
}

export function useAddUserMemory() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      botKey,
      memoryContent,
      memoryKey = 'insight',
    }: {
      botKey: string;
      memoryContent: string;
      memoryKey?: string;
    }) => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('bot_user_memory')
        .insert({
          user_id: user.id,
          bot_key: botKey,
          key: memoryKey,
          value: memoryContent,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['bot-user-memory', data.bot_key] });
    },
  });
}

export function useDeleteUserMemory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ memoryId, botKey }: { memoryId: string; botKey: string }) => {
      const { error } = await supabase
        .from('bot_user_memory')
        .delete()
        .eq('id', memoryId);

      if (error) throw error;
      return { memoryId, botKey };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['bot-user-memory', data.botKey] });
    },
  });
}
