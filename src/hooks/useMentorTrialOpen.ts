import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Whether the 24h mentor trial is currently open to all new signups.
 * Controlled by app_settings.mentor_trial_open_to_all (admin toggle).
 */
export function useMentorTrialOpen() {
  const q = useQuery<boolean>({
    queryKey: ["mentor-trial-open"],
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("is_mentor_trial_open");
      if (error) throw error;
      return !!data;
    },
  });
  return { trialOpen: q.data ?? false, loading: q.isLoading };
}
