import { useRef, useState } from "react";
import { Paperclip, X, Loader2, FileText, Image as ImageIcon, File as FileIcon, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  processMentorAttachment,
  formatBytes,
  MAX_FILES_PER_MESSAGE,
  ALLOWED_MIME,
  type MentorAttachment,
} from "@/lib/mentorAttachments";

interface Props {
  userId: string;
  isRTL: boolean;
  disabled?: boolean;
  attachments: MentorAttachment[];
  onChange: (next: MentorAttachment[]) => void;
}

const acceptAttr = Object.keys(ALLOWED_MIME).join(",");

export function MentorAttachmentPicker({ userId, isRTL, disabled, attachments, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const strings = isRTL
    ? {
        attach: "צרף קובץ",
        limit: `אפשר לצרף עד ${MAX_FILES_PER_MESSAGE} קבצים להודעה אחת`,
        unsupported: "פורמט לא נתמך. אפשר PDF, DOCX, TXT או תמונה (JPG/PNG/WebP).",
        tooLarge: "הקובץ גדול מדי — עד 10MB למסמך, 15MB לתמונה.",
        scannedPdf: "נראה שזה PDF סרוק ולא הצלחתי לחלץ ממנו טקסט. אפשר להעלות את המסמך כתמונה (JPG/PNG) במקום, והמנטורית תוכל לקרוא ממנו.",
        emptyContent: "לא זוהה תוכן טקסטואלי בקובץ. נסי לוודא שהוא לא ריק/סרוק.",
        unreadable: "לא הצלחתי לקרוא את הקובץ. נסי קובץ אחר.",
        uploadFailed: "העלאת הקובץ נכשלה. נסה שוב.",
        truncated: "הקובץ ארוך — נשלחו רק 15,000 התווים הראשונים.",
        remove: "הסר קובץ",
        processing: "מעבד קובץ…",
      }
    : {
        attach: "Attach file",
        limit: `You can attach up to ${MAX_FILES_PER_MESSAGE} files per message`,
        unsupported: "Unsupported format. Allowed: PDF, DOCX, TXT, or an image (JPG/PNG/WebP).",
        tooLarge: "File too large — up to 10MB for documents, 15MB for images.",
        scannedPdf: "This looks like a scanned PDF and no text could be extracted. Try uploading it as an image (JPG/PNG) instead so the mentor can read it.",
        emptyContent: "No text content detected in the file. Please check it isn't empty/scanned.",
        unreadable: "Couldn't read the file. Please try a different one.",
        uploadFailed: "File upload failed. Please try again.",
        truncated: "The file is long — only the first 15,000 characters were sent.",
        remove: "Remove file",
        processing: "Processing file…",
      };

  const handlePick = () => {
    if (disabled || busy) return;
    if (attachments.length >= MAX_FILES_PER_MESSAGE) {
      toast.warning(strings.limit);
      return;
    }
    inputRef.current?.click();
  };

  const handleFiles = async (fileList: FileList | null) => {
    if (!fileList || !fileList.length) return;
    const files = Array.from(fileList).slice(0, MAX_FILES_PER_MESSAGE - attachments.length);
    if (fileList.length > files.length) toast.warning(strings.limit);

    setBusy(true);
    const added: MentorAttachment[] = [];
    for (const file of files) {
      try {
        const att = await processMentorAttachment(file, userId, strings);
        added.push(att);
        if (att.truncated) toast.info(strings.truncated);
      } catch (e: any) {
        toast.error(e?.message || strings.unreadable);
      }
    }
    if (added.length) onChange([...attachments, ...added]);
    setBusy(false);
    if (inputRef.current) inputRef.current.value = "";
  };

  const removeAt = (id: string) => {
    onChange(attachments.filter((a) => a.id !== id));
  };

  return (
    <div className="w-full">
      {attachments.length > 0 && (
        <div className="max-w-3xl mx-auto mb-2 flex flex-wrap gap-1.5">
          {attachments.map((a) => (
            <div
              key={a.id}
              className="flex items-center gap-2 bg-mentor-accent/10 border border-mentor-accent/30 rounded-full ps-2 pe-1 py-1 text-xs max-w-full"
              dir={isRTL ? "rtl" : "ltr"}
            >
              {a.kind === "image" ? (
                <ImageIcon className="w-3.5 h-3.5 flex-shrink-0 text-mentor-accent" />
              ) : a.kind === "pdf" || a.kind === "docx" ? (
                <FileText className="w-3.5 h-3.5 flex-shrink-0 text-mentor-accent" />
              ) : (
                <FileIcon className="w-3.5 h-3.5 flex-shrink-0 text-mentor-accent" />
              )}
              <span className="truncate max-w-[180px] font-medium text-foreground">{a.name}</span>
              <span className="text-muted-foreground">{formatBytes(a.size)}</span>
              {a.truncated && (
                <AlertTriangle
                  className="w-3.5 h-3.5 text-amber-600 flex-shrink-0"
                  aria-label={strings.truncated}
                />
              )}
              <button
                type="button"
                onClick={() => removeAt(a.id)}
                title={strings.remove}
                aria-label={strings.remove}
                className="rounded-full hover:bg-mentor-accent/20 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
          {attachments.some((a) => a.truncated) && (
            <div
              className="w-full text-[11px] text-amber-700 flex items-center gap-1"
              dir={isRTL ? "rtl" : "ltr"}
            >
              <AlertTriangle className="w-3 h-3" />
              <span>{strings.truncated}</span>
            </div>
          )}
        </div>
      )}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={handlePick}
        disabled={disabled || busy}
        title={strings.attach}
        aria-label={strings.attach}
        className="h-[48px] w-[48px] flex-shrink-0 text-muted-foreground hover:text-mentor-accent"
      >
        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Paperclip className="w-4 h-4" />}
      </Button>
      <input
        ref={inputRef}
        type="file"
        accept={acceptAttr}
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  );
}
