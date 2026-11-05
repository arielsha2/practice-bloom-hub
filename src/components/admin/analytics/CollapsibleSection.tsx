import { ReactNode, useState } from "react";
import { ChevronDown } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface Props {
  title: string;
  /** Short line shown next to the title while closed (row count, totals...). */
  summary?: string;
  /** Closed by default: heavy tables open only on click. */
  defaultOpen?: boolean;
  children: ReactNode;
}

/**
 * A heavy table (or list) that stays closed until the admin clicks it, so the
 * analytics page does not need long scrolling to get past it.
 */
export default function CollapsibleSection({ title, summary, defaultOpen = false, children }: Props) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Collapsible open={open} onOpenChange={setOpen} className="rounded-lg border border-border">
      <CollapsibleTrigger className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-right hover:bg-secondary/50 rounded-lg">
        <span className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <span className="text-sm font-semibold text-foreground">{title}</span>
          {summary && <span className="text-xs text-muted-foreground">{summary}</span>}
        </span>
        <span className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
          {open ? "סגירה" : "פתיחה"}
          <ChevronDown className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`} />
        </span>
      </CollapsibleTrigger>
      <CollapsibleContent className="px-3 pb-3 pt-1">{children}</CollapsibleContent>
    </Collapsible>
  );
}
