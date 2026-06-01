import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface TherapistJourney {
  step_number: number;
  stuck_points: string[];
  completed_stages: string[];
  reflection: Record<string, unknown>;
  niche_output: Record<string, unknown> | null;
  self_presentation_output: Record<string, unknown> | null;
  updated_at: string | null;
  health_score: number;
  checkin_due: boolean;
  checkin_question: string;
  checkin_stage: string;
}

export function useTherapistJourney() {
  const { user } = useAuth();
  const [journey, setJourney] = useState<TherapistJourney | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) {
      setJourney(null);
      setLoading(false);
      return;
    }
    const { data } = await supabase
      .from("therapist_journeys")
      .select("step_number, stuck_points, reflection, updated_at, completed_stages, niche_output, self_presentation_output, health_score, checkin_due, checkin_question, checkin_stage")
      .eq("user_id", user.id)
      .maybeSingle();
    setJourney(
      data
        ? {
            step_number: data.step_number ?? 1,
            stuck_points: (data.stuck_points as string[] | null) ?? [],
            completed_stages: ((data as any).completed_stages as string[] | null) ?? [],
            reflection: (data.reflection as Record<string, unknown>) ?? {},
            niche_output: ((data as any).niche_output as Record<string, unknown> | null) ?? null,
            self_presentation_output: ((data as any).self_presentation_output as Record<string, unknown> | null) ?? null,
            updated_at: data.updated_at ?? null,
            health_score: (data as any).health_score ?? 0,
            checkin_due: (data as any).checkin_due ?? false,
            checkin_question: (data as any).checkin_question ?? "",
            checkin_stage: (data as any).checkin_stage ?? "",
          }
        : null
    );
    setLoading(false);
  }, [user]);

  useEffect(() => {
    refresh();

    if (!user) return;
    // Listen for cross-component updates (e.g., after mentor-analyze writes).
    const handler = () => refresh();
    window.addEventListener("therapist-journey-updated", handler);
    return () => window.removeEventListener("therapist-journey-updated", handler);
  }, [user, refresh]);

  return { journey, loading, refresh };
}
