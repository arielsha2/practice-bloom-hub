import { useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, Copy, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import {
  downloadSummaryPdf,
  copySummaryText,
  type SummarySection,
} from '@/lib/mentorSummary';
import { trackEvent } from '@/lib/analytics';

// Structured result of the practice-diagnosis conversation, read directly
// from therapist_journeys.diagnosis_output — deliberately its own type
// rather than squeezed into the generic MentorSummary shape, since the
// field names don't actually correspond (e.g. "not_the_priority" is close
// to the opposite of a generic "next_focus").
export interface DiagnosisResult {
  presentingTheory: string;
  bottleneck: string;
  diagnosisSummary: string;
  bottleneckStage: string;
  evidenceSummary: string;
  behavioralMechanism: string;
  notThePriority: string;
  recommendedTool: string;
}

// Single source of truth for how each recommended tool is labeled in the
// UI — both the display label and the need-phrased CTA action text read
// from here, so they can't drift out of sync with each other over time.
const RECOMMENDED_TOOL_META: Record<string, { label: string; actionLabel: string }> = {
  'niche-finder': { label: 'מציאת הנישה', actionLabel: 'להתחיל לעבוד על הנישה שלי' },
  'pricing-calculator': { label: 'מחשבון התמחור', actionLabel: 'להתחיל לעבוד על התמחור שלי' },
  'self-presentation': { label: 'הצגה עצמית', actionLabel: 'להתחיל לעבוד על ההצגה העצמית שלי' },
  'contact-finder': { label: 'מציאת אנשי קשר להפניות', actionLabel: 'להתחיל לעבוד על רשת ההפניות שלי' },
  'connection-bridge': { label: 'גשר הקשר', actionLabel: 'להתחיל לעבוד על קשרי ההפניות שלי' },
  'first-call-practice': { label: 'תרגול שיחת הטלפון הראשונה', actionLabel: 'להתחיל לעבוד על שיחת הטלפון הראשונה' },
};

function toolMeta(botKey: string) {
  return RECOMMENDED_TOOL_META[botKey] ?? { label: botKey, actionLabel: 'להמשיך למנטור' };
}

function buildSections(result: DiagnosisResult): SummarySection[] {
  return [
    { label: 'מה חשבת שעוצר אותך', content: result.presentingTheory },
    { label: 'מה נראה שבאמת עוצר כרגע את הצמיחה', content: result.diagnosisSummary },
    { label: 'למה הגענו למסקנה הזו', content: result.evidenceSummary },
    { label: 'מה קורה בפועל', content: [result.bottleneck, result.behavioralMechanism].filter(Boolean).join(' ') },
    { label: 'מה לא הייתי מנסה לפתור כרגע', content: result.notThePriority },
    { label: 'הצעד הבא', content: toolMeta(result.recommendedTool).label },
  ].filter((s) => s.content && (Array.isArray(s.content) ? s.content.length > 0 : s.content.trim().length > 0));
}

interface DiagnosisResultDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  result: DiagnosisResult;
  isRTL: boolean;
  displayName?: string | null;
  onContinue: () => void;
}

export function DiagnosisResultDialog({
  open,
  onOpenChange,
  result,
  isRTL,
  displayName,
  onContinue,
}: DiagnosisResultDialogProps) {
  const continuedRef = useRef(false);

  useEffect(() => {
    if (open) {
      continuedRef.current = false;
      trackEvent('diagnosis_result_viewed', { recommended_tool: result.recommendedTool, bottleneck_stage: result.bottleneckStage });
    } else if (!continuedRef.current) {
      trackEvent('diagnosis_exited_without_continue', { recommended_tool: result.recommendedTool });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const meta = toolMeta(result.recommendedTool);
  const sections = buildSections(result);

  const handleDownload = async () => {
    try {
      await downloadSummaryPdf(
        {},
        { isRTL, displayName },
        { heading: 'האבחון שלך', fileNamePrefix: 'therapykeys-diagnosis', sections },
      );
      trackEvent('diagnosis_pdf_downloaded', { recommended_tool: result.recommendedTool });
    } catch (e) {
      console.error(e);
      toast.error(isRTL ? 'ההורדה נכשלה' : 'Download failed');
    }
  };

  const handleCopy = async () => {
    try {
      await copySummaryText({}, { isRTL }, sections);
      toast.success(isRTL ? 'הועתק ללוח' : 'Copied to clipboard');
      trackEvent('diagnosis_copied', { recommended_tool: result.recommendedTool });
    } catch (e) {
      console.error(e);
      toast.error(isRTL ? 'ההעתקה נכשלה' : 'Copy failed');
    }
  };

  const handleContinue = () => {
    continuedRef.current = true;
    trackEvent('diagnosis_continue_clicked', { recommended_tool: result.recommendedTool });
    onContinue();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto" dir={isRTL ? 'rtl' : 'ltr'}>
        <DialogHeader>
          <DialogTitle>{isRTL ? 'האבחון שלך' : 'Your Diagnosis'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {result.presentingTheory && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-1">
                {isRTL ? 'מה חשבת שעוצר אותך' : "What you thought was stopping you"}
              </p>
              <p className="text-sm text-foreground/80">{result.presentingTheory}</p>
            </div>
          )}

          {result.diagnosisSummary && (
            <div className="rounded-lg border border-accent/30 bg-accent/5 p-4">
              <p className="text-xs font-semibold text-accent mb-1">
                {isRTL ? 'מה נראה שבאמת עוצר כרגע את הצמיחה' : "What's actually holding back your growth"}
              </p>
              <p className="text-base font-medium text-foreground leading-relaxed">{result.diagnosisSummary}</p>
            </div>
          )}

          {result.evidenceSummary && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-1">
                {isRTL ? 'למה הגענו למסקנה הזו' : 'Why we got here'}
              </p>
              <p className="text-sm text-foreground/80">{result.evidenceSummary}</p>
            </div>
          )}

          {(result.bottleneck || result.behavioralMechanism) && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-1">
                {isRTL ? 'מה קורה בפועל' : "What's actually happening"}
              </p>
              <p className="text-sm text-foreground/80">
                {[result.bottleneck, result.behavioralMechanism].filter(Boolean).join(' ')}
              </p>
            </div>
          )}

          {result.notThePriority && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-1">
                {isRTL ? 'מה לא הייתי מנסה לפתור כרגע' : "What I wouldn't try to fix right now"}
              </p>
              <p className="text-sm text-foreground/80">{result.notThePriority}</p>
            </div>
          )}
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-col sm:space-x-0">
          <Button variant="cta" className="w-full gap-1.5" onClick={handleContinue}>
            {meta.actionLabel}
            <ArrowLeft className={isRTL ? '' : 'rotate-180'} />
          </Button>
          <p className="text-xs text-center text-muted-foreground -mt-1">
            {isRTL ? 'במסגרת המנטור' : 'within the Mentor'}
          </p>
          <div className="flex gap-2 pt-1">
            <Button variant="outline" className="flex-1 gap-1.5" onClick={handleDownload}>
              <Download className="w-4 h-4" />
              {isRTL ? 'הורד PDF' : 'Download PDF'}
            </Button>
            <Button variant="outline" className="flex-1 gap-1.5" onClick={handleCopy}>
              <Copy className="w-4 h-4" />
              {isRTL ? 'העתק' : 'Copy'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
