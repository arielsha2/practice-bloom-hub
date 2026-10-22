import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { RotateCcw } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useResetMentorJourney } from "@/hooks/useResetMentorJourney";
import { trackEvent } from "@/lib/analytics";

// "Start over" for any signed-in user: the Mentor and the AI tools forget everything they know about the
// person and begin as if they had never met. It runs the same deletion as the admin-only reset
// (conversations, summaries, memory, professional details, tool results, the latest diagnosis result).
// Their account, purchases, access and the history of diagnosis scores stay. The deletions go through the
// user's own session and row-level policies (each table only lets the owner delete their own rows).
export function StartFreshButton() {
  const { isRTL } = useLanguage();
  const { reset, isResetting } = useResetMentorJourney();
  const [open, setOpen] = useState(false);

  const handleConfirm = async () => {
    trackEvent("mentor_start_fresh_confirmed");
    const ok = await reset();
    setOpen(false);
    // Reload so every part of the UI re-fetches from a clean state.
    if (ok) setTimeout(() => window.location.reload(), 400);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => {
          trackEvent("mentor_start_fresh_opened");
          setOpen(true);
        }}
        disabled={isResetting}
        className="mt-3 flex w-full items-center justify-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
      >
        <RotateCcw className="w-3 h-3" />
        {isRTL ? "להתחיל מחדש עם המנטור" : "Start over with the Mentor"}
      </button>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent dir={isRTL ? "rtl" : "ltr"}>
          <AlertDialogHeader>
            <AlertDialogTitle>{isRTL ? "להתחיל מחדש" : "Start over"}</AlertDialogTitle>
            <AlertDialogDescription className={`space-y-2 ${isRTL ? "text-right" : "text-left"}`}>
              <span className="block">
                {isRTL
                  ? "המנטור וכלי ה-AI ימחקו את כל מה שהם יודעים עליך ויתחילו מחדש, כאילו לא הכירו אותך."
                  : "The Mentor and the AI tools will erase everything they know about you and start fresh, as if they had never met you."}
              </span>
              <span className="block font-medium text-foreground">
                {isRTL
                  ? "יימחקו: כל השיחות, הסיכומים והזיכרון, הפרטים המקצועיים שנשמרו, מה שנוצר בכלים (נישה, תמחור, הצגה עצמית ועוד) ותוצאת האבחון האחרונה."
                  : "Erased: all conversations, summaries and memory, the professional details saved about you, what you created in the tools (niche, pricing, self-presentation and more) and your latest diagnosis result."}
              </span>
              <span className="block">
                {isRTL
                  ? "נשארים: החשבון, הרכישות והגישה שלך, והיסטוריית הציונים של האבחונים."
                  : "Kept: your account, purchases and access, and the history of your diagnosis scores."}
              </span>
              <span className="block font-medium text-foreground">
                {isRTL ? "אי אפשר לשחזר." : "This cannot be undone."}
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isResetting}>{isRTL ? "ביטול" : "Cancel"}</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm} disabled={isResetting}>
              {isResetting ? (isRTL ? "מוחק..." : "Erasing...") : isRTL ? "כן, למחוק ולהתחיל מחדש" : "Yes, erase and start over"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
