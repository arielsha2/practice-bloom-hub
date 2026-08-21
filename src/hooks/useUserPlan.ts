import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface UserPlanInfo {
  plan: "free" | "paid";
  trialActive: boolean;
  trialDaysLeft: number;
  hasPaidAccess: boolean;
  trialEndsAt: Date | null;
}

const DEFAULT: UserPlanInfo = {
  plan: "free",
  trialActive: false,
  trialDaysLeft: 0,
  hasPaidAccess: false,
  trialEndsAt: null,
};

export function useUserPlan() {
  const { user, loading: authLoading } = useAuth();

  const q = useQuery<UserPlanInfo>({
    queryKey: ["user-plan", user?.id],
    enabled: !!user?.id,
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_user_access", { _user_id: user!.id });
      if (error) throw error;
      const row = Array.isArray(data) ? data[0] : data;
      if (!row) return DEFAULT;
      const trialEndsAt = row.trial_ends_at ? new Date(row.trial_ends_at) : null;
      const trialDaysLeft = trialEndsAt
        ? Math.max(0, Math.ceil((trialEndsAt.getTime() - Date.now()) / (24 * 3600 * 1000)))
        : 0;
      return {
        plan: (row.plan as "free" | "paid") ?? "free",
        trialActive: !!row.trial_active,
        trialDaysLeft,
        hasPaidAccess: !!row.has_paid,
        trialEndsAt,
      };
    },
  });

  return {
    ...(q.data ?? DEFAULT),
    loading: authLoading || q.isLoading,
  };
}

// Was ["pricing-calculator"] — replaced per the 2026-08-12 decision that the
// free trial's entry point is the diagnostic conversation, not a standalone
// tool.
//
// 2026-08-13: no longer gated on trialActive at all. The diagnosis is the
// top-of-funnel lead magnet — any signed-up user should be able to try it
// without needing a trial granted first (the trial toggle only governs the
// other 6 paid tools). See useBotAccess below.
const FREE_TIER_ALLOWED = new Set(["practice-diagnosis"]);

export type BotAccess = "allowed" | "locked" | "mentor-only";

export function useBotAccess(botKey: string | undefined): {
  access: BotAccess;
  loading: boolean;
  plan: UserPlanInfo;
} {
  const plan = useUserPlan();
  if (!botKey) return { access: "locked", loading: plan.loading, plan };
  if (plan.hasPaidAccess) return { access: "allowed", loading: plan.loading, plan };
  if (FREE_TIER_ALLOWED.has(botKey)) return { access: "allowed", loading: plan.loading, plan };
  if (plan.trialActive) return { access: "mentor-only", loading: plan.loading, plan };
  return { access: "locked", loading: plan.loading, plan };
}
