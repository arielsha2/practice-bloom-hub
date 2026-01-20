import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface BotConfiguration {
  id: string;
  bot_key: string;
  name_he: string;
  name_en: string;
  description_he: string | null;
  description_en: string | null;
  system_prompt: string;
  welcome_message_he: string | null;
  welcome_message_en: string | null;
  model: string;
  temperature: number;
  max_tokens: number;
  is_active: boolean;
  icon: string;
  color: string;
  created_at: string;
  updated_at: string;
}

export type BotConfigurationInsert = Omit<BotConfiguration, 'id' | 'created_at' | 'updated_at'>;
export type BotConfigurationUpdate = Partial<BotConfigurationInsert>;

export function useBotConfigurations() {
  return useQuery({
    queryKey: ['bot-configurations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bot_configurations')
        .select('*')
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return data as BotConfiguration[];
    },
  });
}

export function useBotConfiguration(botKey: string) {
  return useQuery({
    queryKey: ['bot-configuration', botKey],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bot_configurations')
        .select('*')
        .eq('bot_key', botKey)
        .maybeSingle();
      
      if (error) throw error;
      return data as BotConfiguration | null;
    },
    enabled: !!botKey,
  });
}

export function useCreateBotConfiguration() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (config: BotConfigurationInsert) => {
      const { data, error } = await supabase
        .from('bot_configurations')
        .insert(config)
        .select()
        .single();
      
      if (error) throw error;
      return data as BotConfiguration;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bot-configurations'] });
    },
  });
}

export function useUpdateBotConfiguration() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: BotConfigurationUpdate }) => {
      const { data, error } = await supabase
        .from('bot_configurations')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data as BotConfiguration;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bot-configurations'] });
    },
  });
}

export function useDeleteBotConfiguration() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('bot_configurations')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bot-configurations'] });
    },
  });
}
