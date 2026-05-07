import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface TherapistJourney {
  step_number: number;
  stuck_points: string[];
  reflection: Record<string, unknown>;
  updated_at: string | null;
}

export function useTherapistJourney() {
  const { user } = useAuth();
  const [journey, setJourney] = useState<TherapistJourney | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function load() {
      if (!user) {
        setJourney(null);
        setLoading(false);
        return;
      }
      const { data } = await supabase
        .from("therapist_journeys")
        .select("step_number, stuck_points, reflection, updated_at")
        .eq("user_id", user.id)
        .maybeSingle();
      if (!active) return;
      setJourney(
        data
          ? {
              step_number: data.step_number ?? 1,
              stuck_points: (data.stuck_points as string[] | null) ?? [],
              reflection: (data.reflection as Record<string, unknown>) ?? {},
              updated_at: data.updated_at ?? null,
            }
          : null
      );
      setLoading(false);
    }
    load();
    return () => {
      active = false;
    };
  }, [user]);

  return { journey, loading };
}
