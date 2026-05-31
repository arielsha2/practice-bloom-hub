import { useState } from "react";
import { Button } from "@/components/ui/button";
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
import { RotateCcw, Loader2 } from "lucide-react";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useResetMentorJourney } from "@/hooks/useResetMentorJourney";

interface Props {
  variant?: "compact" | "card";
  onResetDone?: () => void;
}

export function ResetMentorButton({ variant = "compact", onResetDone }: Props) {
  const { isAdmin, isLoading } = useIsAdmin();
  const { reset, isResetting } = useResetMentorJourney();
  const [open, setOpen] = useState(false);

  if (isLoading || !isAdmin) return null;

  const handleConfirm = async () => {
    const ok = await reset();
    setOpen(false);
    if (ok) {
      onResetDone?.();
      // Reload so all UI re-fetches from a clean state.
      setTimeout(() => window.location.reload(), 400);
    }
  };

  const trigger =
    variant === "card" ? (
      <Button variant="outline" onClick={() => setOpen(true)} disabled={isResetting}>
        {isResetting ? <Loader2 className="w-4 h-4 me-2 animate-spin" /> : <RotateCcw className="w-4 h-4 me-2" />}
        איפוס המסע והתחלה מחדש
      </Button>
    ) : (
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        disabled={isResetting}
        className="gap-2"
        title="כפתור אדמין — איפוס המסע לבדיקת חוויית מטפל חדש"
      >
        {isResetting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
        איפוס מסע (אדמין)
      </Button>
    );

  return (
    <>
      {trigger}
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>איפוס המסע במנטור</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2 text-right">
              <span className="block">
                פעולה זו תמחק את כל ההתקדמות שלך במנטור: שלבים שהושלמו, פלטי הנישה וההצגה
                העצמית, זיכרון הבוטים, היסטוריית השיחות וכל הצ׳אטים.
              </span>
              <span className="block font-medium text-foreground">
                אחרי האיפוס תחווה את המנטור כמטפל חדש לחלוטין. הפעולה לא הפיכה.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isResetting}>ביטול</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm} disabled={isResetting}>
              {isResetting ? "מאפס..." : "כן, אפס והתחל מחדש"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
