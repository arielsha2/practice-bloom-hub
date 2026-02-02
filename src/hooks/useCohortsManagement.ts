import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';

interface Cohort {
  id: string;
  name_he: string;
  name_en: string;
  start_date: string | null;
  end_date: string | null;
  is_active: boolean | null;
  created_at: string | null;
}

interface CreateCohortData {
  name_he: string;
  name_en: string;
  start_date?: string | null;
  end_date?: string | null;
}

interface UpdateCohortData {
  id: string;
  name_he?: string;
  name_en?: string;
  start_date?: string | null;
  end_date?: string | null;
  is_active?: boolean;
}

export function useCohortsManagement() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { isRTL } = useLanguage();

  // Fetch all cohorts
  const { data: cohorts = [], isLoading: cohortsLoading } = useQuery({
    queryKey: ['cohorts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cohorts')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Cohort[];
    },
  });

  // Create new cohort
  const createCohort = useMutation({
    mutationFn: async (data: CreateCohortData) => {
      const { error } = await supabase
        .from('cohorts')
        .insert(data);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cohorts'] });
      toast({
        title: isRTL ? 'הצלחה' : 'Success',
        description: isRTL ? 'המחזור נוצר בהצלחה' : 'Cohort created successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: isRTL ? 'שגיאה' : 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Update cohort
  const updateCohort = useMutation({
    mutationFn: async ({ id, ...data }: UpdateCohortData) => {
      const { error } = await supabase
        .from('cohorts')
        .update(data)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cohorts'] });
      toast({
        title: isRTL ? 'הצלחה' : 'Success',
        description: isRTL ? 'המחזור עודכן בהצלחה' : 'Cohort updated successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: isRTL ? 'שגיאה' : 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Deactivate cohort
  const deactivateCohort = useMutation({
    mutationFn: async (cohortId: string) => {
      const { error } = await supabase
        .from('cohorts')
        .update({ is_active: false })
        .eq('id', cohortId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cohorts'] });
      toast({
        title: isRTL ? 'הצלחה' : 'Success',
        description: isRTL ? 'המחזור הושבת' : 'Cohort deactivated',
      });
    },
    onError: (error: Error) => {
      toast({
        title: isRTL ? 'שגיאה' : 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Activate cohort
  const activateCohort = useMutation({
    mutationFn: async (cohortId: string) => {
      const { error } = await supabase
        .from('cohorts')
        .update({ is_active: true })
        .eq('id', cohortId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cohorts'] });
      toast({
        title: isRTL ? 'הצלחה' : 'Success',
        description: isRTL ? 'המחזור הופעל' : 'Cohort activated',
      });
    },
    onError: (error: Error) => {
      toast({
        title: isRTL ? 'שגיאה' : 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    cohorts,
    isLoading: cohortsLoading,
    createCohort,
    updateCohort,
    deactivateCohort,
    activateCohort,
  };
}
