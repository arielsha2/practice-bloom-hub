import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

// The "המומחים" tab in the header is for the admin only (while the sales page is being finalised, and later as a
// shortcut). Everyone else gets the page by its direct link (/hamumchim), not from the navigation. This only hides
// the tab: the page itself is deliberately reachable by URL.
//
// The admin check is cached for ten minutes per user, so the header does not call the check-admin function on
// every page view of every signed-in visitor.
export const EXPERTS_PATH = "/hamumchim";

export function useShowExpertsTab(): boolean {
  const { user } = useAuth();
  const q = useQuery({
    queryKey: ["is-admin-nav", user?.id],
    enabled: !!user,
    staleTime: 10 * 60 * 1000,
    retry: false,
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("check-admin");
      if (error) return false;
      return data?.isAdmin === true;
    },
  });
  return q.data === true;
}
