import { AlertCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HandoffFailureBannerProps {
  botLabel: string;
  isRTL: boolean;
  onRetry: () => void;
  onDismiss: () => void;
}

export function HandoffFailureBanner({ botLabel, isRTL, onRetry, onDismiss }: HandoffFailureBannerProps) {
  return (
    <div
      dir={isRTL ? "rtl" : "ltr"}
      className="border-t border-destructive/30 bg-destructive/5 px-3 md:px-4 py-2.5"
    >
      <div className="max-w-3xl mx-auto flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0" />
          <p className="text-xs md:text-sm text-foreground/90 truncate">
            {isRTL
              ? `נראה שלא הצלחת להגיע ל${botLabel}. רוצה לפתוח שוב?`
              : `It looks like ${botLabel} didn't open. Want to try again?`}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button
            size="sm"
            onClick={onRetry}
            className="bg-mentor-accent hover:bg-mentor-accent/90 text-mentor-accent-foreground text-xs h-8 px-3"
          >
            {isRTL ? "פתחי שוב" : "Open again"}
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={onDismiss}
            className="h-8 w-8"
            aria-label={isRTL ? "סגור" : "Dismiss"}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
