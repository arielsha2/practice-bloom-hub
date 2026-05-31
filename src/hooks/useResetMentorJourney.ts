import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Resets the current user's mentor journey: deletes therapist_journeys row,
 * bot memory, bot conversations + messages, and clears local mentor chat cache.
 * Intended for admins to test the mentor as a brand-new therapist.
 */
export function useResetMentorJourney() {
  const [isResetting, setIsResetting] = useState(false);

  const reset = async (): Promise<boolean> => {
    setIsResetting(true);
    try {
      const { data: auth } = await supabase.auth.getUser();
      const user = auth.user;
      if (!user) {
        toast.error("יש להתחבר תחילה");
        return false;
      }

      // 1. Get all conversation IDs to delete messages first (no FK cascade).
      const { data: convs } = await supabase
        .from("bot_conversations")
        .select("id")
        .eq("user_id", user.id);

      const convIds = (convs ?? []).map((c) => c.id);

      if (convIds.length > 0) {
        await supabase.from("bot_messages").delete().in("conversation_id", convIds);
      }

      // 2. Delete conversations, memory, and journey row in parallel.
      const [convRes, memRes, journeyRes] = await Promise.all([
        supabase.from("bot_conversations").delete().eq("user_id", user.id),
        supabase.from("bot_user_memory").delete().eq("user_id", user.id),
        supabase.from("therapist_journeys").delete().eq("user_id", user.id),
      ]);

      const err = convRes.error || memRes.error || journeyRes.error;
      if (err) {
        console.error("Reset mentor error:", err);
        toast.error("שגיאה באיפוס: " + err.message);
        return false;
      }

      // 3. Clear local mentor chat cache (both languages).
      try {
        localStorage.removeItem("mentor-chat:he");
        localStorage.removeItem("mentor-chat:en");
      } catch {
        // ignore
      }

      // 4. Notify listeners (e.g. useTherapistJourney) to refresh.
      window.dispatchEvent(new CustomEvent("therapist-journey-updated"));

      toast.success("המסע אופס בהצלחה — אפשר להתחיל מחדש");
      return true;
    } catch (e) {
      console.error(e);
      toast.error("שגיאה לא צפויה באיפוס");
      return false;
    } finally {
      setIsResetting(false);
    }
  };

  return { reset, isResetting };
}
