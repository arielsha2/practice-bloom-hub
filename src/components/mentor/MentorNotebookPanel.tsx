import { useEffect, useState } from "react";
import { Notebook, X, Check, Loader2, AlertCircle } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { useMentorNotebook } from "@/hooks/useMentorNotebook";

const COPY = {
  he: {
    tab: "הפנקס שלי",
    title: "הפנקס האישי שלך",
    description: "הערות, תובנות, מסקנות וצעדים מעשיים מהמסע. נשמר אוטומטית.",
    placeholder:
      "כתוב/י כאן הערות, תובנות וצעדים מעשיים שאתה לוקח/ת מהשיחה עם המנטור...\n\nאפשר גם להוסיף הודעות ישירות מהצ'אט בלחיצה על אייקון הפנקס שלצד כל הודעה.",
    saving: "שומר…",
    saved: "נשמר",
    error: "שגיאת שמירה",
    lastUpdated: "עודכן לאחרונה:",
    close: "סגירה",
    hint: "טיפ: הפנקס נשאר זמין גם אחרי שתסיים/י את השיחה.",
  },
  en: {
    tab: "My Notebook",
    title: "Your Personal Notebook",
    description: "Notes, insights, conclusions and action items from your journey. Auto-saved.",
    placeholder:
      "Write here notes, insights and action items you're taking from the conversation with the mentor...\n\nYou can also send messages directly from chat using the notebook icon next to each message.",
    saving: "Saving…",
    saved: "Saved",
    error: "Save error",
    lastUpdated: "Last updated:",
    close: "Close",
    hint: "Tip: your notebook stays available after the conversation ends.",
  },
};

export function MentorNotebookPanel() {
  const { language, isRTL } = useLanguage();
  const t = COPY[language === "en" ? "en" : "he"];
  const side: "left" | "right" = isRTL ? "left" : "right";
  const [open, setOpen] = useState(false);
  const { content, setContent, loaded, status, updatedAt } = useMentorNotebook();

  // Open panel briefly when an entry is appended from the chat
  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener("mentor-notebook:open", handler);
    return () => window.removeEventListener("mentor-notebook:open", handler);
  }, []);

  const formattedDate =
    updatedAt &&
    new Date(updatedAt).toLocaleString(language === "en" ? "en-US" : "he-IL", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <>
      {/* Floating pull-out tab */}
      <button
        onClick={() => setOpen(true)}
        aria-label={t.tab}
        className={`fixed top-1/2 -translate-y-1/2 z-40 group ${
          side === "left" ? "left-0" : "right-0"
        }`}
      >
        <div
          className={`bg-mentor-accent text-mentor-accent-foreground shadow-lg flex items-center gap-2 px-3 py-3 transition-all hover:px-4 ${
            side === "left" ? "rounded-e-2xl" : "rounded-s-2xl"
          }`}
        >
          <Notebook className="w-5 h-5" />
          <span className="text-sm font-semibold whitespace-nowrap">{t.tab}</span>
        </div>
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side={side}
          className="w-full sm:max-w-md md:max-w-lg flex flex-col p-0"
          dir={isRTL ? "rtl" : "ltr"}
        >
          <SheetHeader className="p-6 pb-3 border-b border-border">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-mentor-accent/15 flex items-center justify-center">
                  <Notebook className="w-4 h-4 text-mentor-accent" />
                </div>
                <div className={isRTL ? "text-right" : "text-left"}>
                  <SheetTitle className="text-base font-serif">{t.title}</SheetTitle>
                  <SheetDescription className="text-xs mt-0.5">{t.description}</SheetDescription>
                </div>
              </div>
            </div>
          </SheetHeader>

          <div className="flex-1 flex flex-col p-4 gap-3 min-h-0">
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={t.placeholder}
              disabled={!loaded}
              dir={isRTL ? "rtl" : "ltr"}
              className={`flex-1 min-h-0 resize-none text-sm leading-relaxed font-body ${
                isRTL ? "text-right" : "text-left"
              }`}
            />

            <div className="flex items-center justify-between text-xs text-muted-foreground gap-2 flex-wrap">
              <div className="flex items-center gap-1.5">
                {status === "saving" && (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>{t.saving}</span>
                  </>
                )}
                {status === "saved" && (
                  <>
                    <Check className="w-3 h-3 text-green-600" />
                    <span>{t.saved}</span>
                  </>
                )}
                {status === "error" && (
                  <>
                    <AlertCircle className="w-3 h-3 text-destructive" />
                    <span className="text-destructive">{t.error}</span>
                  </>
                )}
              </div>
              {formattedDate && (
                <span>
                  {t.lastUpdated} {formattedDate}
                </span>
              )}
            </div>

            <p className="text-xs text-muted-foreground/80 italic">{t.hint}</p>

            <Button variant="outline" size="sm" onClick={() => setOpen(false)} className="self-stretch">
              <X className="w-4 h-4 me-1" />
              {t.close}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
