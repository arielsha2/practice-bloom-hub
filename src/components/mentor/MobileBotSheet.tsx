import { forwardRef } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

interface MobileBotSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  botKey: string | null;
  botLabel: string;
  isRTL: boolean;
  onIframeLoad: () => void;
}

/**
 * Full-screen sheet that hosts the bot iframe on mobile so the tool can't
 * be missed below the fold. On desktop the iframe is rendered inline.
 */
export const MobileBotSheet = forwardRef<HTMLIFrameElement, MobileBotSheetProps>(
  function MobileBotSheet({ open, onOpenChange, botKey, botLabel, isRTL, onIframeLoad }, ref) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="bottom"
          className="h-[100dvh] max-h-[100dvh] w-full p-0 flex flex-col gap-0 sm:max-w-full"
          dir={isRTL ? "rtl" : "ltr"}
        >
          <SheetHeader className="px-4 py-3 border-b border-mentor-border/60 bg-mentor-surface">
            <SheetTitle className="text-sm font-medium text-foreground">{botLabel}</SheetTitle>
          </SheetHeader>
          {botKey && (
            <iframe
              ref={ref}
              src={`/ai-assistants/${botKey}?kickoff=1&from=mentor`}
              className="flex-1 w-full border-0 bg-mentor-bg"
              title={botLabel}
              onLoad={onIframeLoad}
            />
          )}
        </SheetContent>
      </Sheet>
    );
  },
);
