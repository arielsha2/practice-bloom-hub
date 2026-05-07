import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Returns true when the signed-in user has access to the Mentor page.
 * Access is granted to users with role `mentor` or `admin`.
 */
export function useHasMentorAccess() {
  const { user, loading: authLoading } = useAuth();
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (authLoading) return;
    if (!user) {
      setHasAccess(false);
      return;
    }
    (async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .in("role", ["mentor", "admin"]);
      if (cancelled) return;
      if (error) {
        setHasAccess(false);
        return;
      }
      setHasAccess((data?.length ?? 0) > 0);
    })();
    return () => {
      cancelled = true;
    };
  }, [user, authLoading]);

  return { hasAccess, loading: authLoading || hasAccess === null };
}
