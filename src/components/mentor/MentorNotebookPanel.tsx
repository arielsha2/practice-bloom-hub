import { useEffect, useRef, useState } from "react";
import { Notebook, X, Check, Loader2, AlertCircle, Trash2 } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
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
import { Button } from "@/components/ui/button";

import { useLanguage } from "@/contexts/LanguageContext";
import { useMentorNotebook } from "@/hooks/useMentorNotebook";
import { MentorNotebookEditor, type NotebookEditorHandle } from "./MentorNotebookEditor";

const COPY = {
  he: {
    tab: "הפנקס שלי",
    title: "הפנקס האישי שלך",
    description: "הערות, תובנות, מסקנות וצעדים מעשיים מהמסע. נשמר אוטומטית.",
    placeholder:
      "כתוב/י כאן הערות, תובנות וצעדים מעשיים שאתה לוקח/ת מהשיחה עם המנטור...",
    saving: "שומר…",
    saved: "נשמר",
    error: "שגיאת שמירה",
    lastUpdated: "עודכן לאחרונה:",
    close: "סגירה",
    hint: "טיפ: בחר/י טקסט וסמן/י עם הטוש הזוהר כדי להדגיש משפטים חשובים.",
    deleteLastSegment: "מחק קטע אחרון",
    deleteConfirmTitle: "למחוק את הקטע האחרון?",
    deleteConfirmDescription: "הפעולה תמחק את הקטע האחרון שנכתב בפנקס. אפשר לבטל את הפעולה עם Ctrl+Z.",
    deleteConfirmCancel: "ביטול",
    deleteConfirmDelete: "מחק",
  },
  en: {
    tab: "My Notebook",
    title: "Your Personal Notebook",
    description: "Notes, insights, conclusions and action items from your journey. Auto-saved.",
    placeholder:
      "Write notes, insights and action items you're taking from the conversation with the mentor...",
    saving: "Saving…",
    saved: "Saved",
    error: "Save error",
    lastUpdated: "Last updated:",
    close: "Close",
    hint: "Tip: select text and use the highlighter to mark important lines.",
    deleteLastSegment: "Delete last segment",
    deleteConfirmTitle: "Delete the last segment?",
    deleteConfirmDescription: "This will remove the last segment written in the notebook. You can undo with Ctrl+Z.",
    deleteConfirmCancel: "Cancel",
    deleteConfirmDelete: "Delete",
  },
};


function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function buildAppendHTML(body: string, stageLabel: string | null, lang: "he" | "en") {
  const now = new Date();
  const dateStr = now.toLocaleString(lang === "en" ? "en-US" : "he-IL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  const header = stageLabel ? `📅 ${dateStr} · ${stageLabel}` : `📅 ${dateStr}`;
  const bodyHtml = escapeHtml(body.trim()).replace(/\n/g, "<br/>");
  return `<hr/><p><strong>${escapeHtml(header)}</strong></p><p>${bodyHtml}</p>`;
}

export function MentorNotebookPanel() {
  const { language, isRTL } = useLanguage();
  const t = COPY[language === "en" ? "en" : "he"];
  const side: "left" | "right" = isRTL ? "left" : "right";
  const [open, setOpen] = useState(false);
  const { content, setContent, loaded, status, updatedAt } = useMentorNotebook();
  const editorRef = useRef<NotebookEditorHandle | null>(null);

  useEffect(() => {
    const openHandler = () => setOpen(true);
    const appendHandler = (e: Event) => {
      const detail = (e as CustomEvent).detail as { body?: string; stageLabel?: string | null } | undefined;
      if (!detail?.body) return;
      const html = buildAppendHTML(detail.body, detail.stageLabel ?? null, language === "en" ? "en" : "he");
      setOpen(true);
      // Defer so the sheet/editor mounts before insertion
      setTimeout(() => editorRef.current?.appendHTML(html), 50);
    };
    window.addEventListener("mentor-notebook:open", openHandler);
    window.addEventListener("mentor-notebook:append", appendHandler as EventListener);
    return () => {
      window.removeEventListener("mentor-notebook:open", openHandler);
      window.removeEventListener("mentor-notebook:append", appendHandler as EventListener);
    };
  }, [language]);

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
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-mentor-accent/15 flex items-center justify-center">
                <Notebook className="w-4 h-4 text-mentor-accent" />
              </div>
              <div className={isRTL ? "text-right" : "text-left"}>
                <SheetTitle className="text-base font-serif">{t.title}</SheetTitle>
                <SheetDescription className="text-xs mt-0.5">{t.description}</SheetDescription>
              </div>
            </div>
          </SheetHeader>

          <div className="flex-1 flex flex-col p-4 gap-3 min-h-0">
            <div className="flex-1 min-h-0">
              <MentorNotebookEditor
                value={content}
                onChange={setContent}
                placeholder={t.placeholder}
                isRTL={isRTL}
                disabled={!loaded}
                ref={editorRef}
              />
            </div>

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
