import { useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, Copy, ArrowLeft, Target, Check, Minus, CircleDashed } from 'lucide-react';
import { toast } from 'sonner';
import {
  downloadSummaryPdf,
  copySummaryText,
  type SummarySection,
} from '@/lib/mentorSummary';
import { trackEvent } from '@/lib/analytics';

export type AreaStatus = 'priority' | 'strong' | 'stable' | 'not_assessed';
export interface AreaMapEntry {
  area: string;
  status: AreaStatus;
  note: string;
}

// Structured result of the practice-diagnosis conversation, read directly
// from therapist_journeys.diagnosis_output — deliberately its own type
// rather than squeezed into the generic MentorSummary shape, since the
// field names don't actually correspond (e.g. "not_the_priority" is close
// to the opposite of a generic "next_focus").
export interface DiagnosisResult {
  presentingTheory: string;
  whatIsWorking: string;
  bottleneck: string;
  diagnosisSummary: string;
  bottleneckStage: string;
  evidenceSummary: string;
  behavioralMechanism: string;
  notThePriority: string;
  pathForward: string;
  recommendedTool: string;
  areaMap: AreaMapEntry[];
}

// Single source of truth for how each recommended tool is labeled in the
// UI — both the display label and the need-phrased CTA action text read
// from here, so they can't drift out of sync with each other over time.
const RECOMMENDED_TOOL_META_HE: Record<string, { label: string; actionLabel: string }> = {
  'niche-finder': { label: 'מציאת הנישה', actionLabel: 'להתחיל לעבוד על הנישה שלי' },
  'pricing-calculator': { label: 'מחשבון התמחור', actionLabel: 'להתחיל לעבוד על התמחור שלי' },
  'self-presentation': { label: 'הצגה עצמית', actionLabel: 'להתחיל לעבוד על ההצגה העצמית שלי' },
  'contact-finder': { label: 'מציאת אנשי קשר להפניות', actionLabel: 'להתחיל לעבוד על רשת ההפניות שלי' },
  'connection-bridge': { label: 'גשר הקשר', actionLabel: 'להתחיל לעבוד על קשרי ההפניות שלי' },
  'first-call-practice': { label: 'תרגול שיחת הטלפון הראשונה', actionLabel: 'להתחיל לעבוד על שיחת הטלפון הראשונה' },
};
const RECOMMENDED_TOOL_META_EN: Record<string, { label: string; actionLabel: string }> = {
  'niche-finder': { label: 'Finding your niche', actionLabel: 'Start working on my niche' },
  'pricing-calculator': { label: 'The pricing calculator', actionLabel: 'Start working on my pricing' },
  'self-presentation': { label: 'Self-presentation', actionLabel: 'Start working on my self-presentation' },
  'contact-finder': { label: 'Finding referral contacts', actionLabel: 'Start working on my referral network' },
  'connection-bridge': { label: 'The connection bridge', actionLabel: 'Start working on my referral relationships' },
  'first-call-practice': { label: 'First-call practice', actionLabel: 'Start working on my first phone call' },
};

function toolMeta(botKey: string, isRTL: boolean) {
  const table = isRTL ? RECOMMENDED_TOOL_META_HE : RECOMMENDED_TOOL_META_EN;
  return table[botKey] ?? { label: botKey, actionLabel: isRTL ? 'להמשיך למנטור' : 'Continue to the Mentor' };
}

// The two purchase paths offered to anyone without full paid access once
// they're ready to act on the diagnosis: the one tool it actually
// recommended (cheaper, scoped — grants only that bot_key, matched
// server-side to this user's own diagnosis at payment time by
// grow-payment-webhook, not by anything in this URL) or the full journey
// (all six tools + Eliana). Someone who already has full access skips this
// entirely and keeps the single "let's start" CTA below.
const SINGLE_TOOL_PRICE_ILS = 290;
const SINGLE_TOOL_PAYMENT_URL = 'https://pay.grow.link/NzkyMDE~68a43deedc01abb7f94a1112c32d0b6b-Mzg3NjE4Ng';
const FULL_MENTOR_PRICE_ILS = 750;
const FULL_MENTOR_PAYMENT_URL = 'https://meshulam.co.il/quick_payment?b=692abdd2459224a95d57aef700a015ab';

const AREA_STATUS_META_HE: Record<AreaStatus, { label: string; Icon: typeof Target }> = {
  priority: { label: 'הכי דחוף', Icon: Target },
  strong: { label: 'חזק אצלך', Icon: Check },
  stable: { label: 'נראה יציב', Icon: Minus },
  not_assessed: { label: 'לא נבדק בשיחה', Icon: CircleDashed },
};
const AREA_STATUS_META_EN: Record<AreaStatus, { label: string; Icon: typeof Target }> = {
  priority: { label: 'Most urgent', Icon: Target },
  strong: { label: 'Strong for you', Icon: Check },
  stable: { label: 'Seems stable', Icon: Minus },
  not_assessed: { label: "Didn't come up", Icon: CircleDashed },
};

function areaStatusMeta(status: AreaStatus, isRTL: boolean) {
  return (isRTL ? AREA_STATUS_META_HE : AREA_STATUS_META_EN)[status];
}

function areaMapToText(areaMap: AreaMapEntry[], isRTL: boolean): string[] {
  return areaMap.map((e) => {
    const label = toolMeta(e.area, isRTL).label;
    const status = areaStatusMeta(e.status, isRTL)?.label ?? e.status;
    return e.note ? `${label} — ${status}: ${e.note}` : `${label} — ${status}`;
  });
}

function buildSections(result: DiagnosisResult, isRTL: boolean): SummarySection[] {
  return (
    isRTL
      ? [
          { label: 'מה חשבת שעוצר אותך', content: result.presentingTheory },
          { label: 'מפת שישה האזורים', content: areaMapToText(result.areaMap, isRTL) },
          { label: 'מה כן עובד אצלך', content: result.whatIsWorking },
          { label: 'מה נראה שבאמת עוצר כרגע את הצמיחה', content: result.diagnosisSummary },
          { label: 'למה הגענו למסקנה הזו', content: result.evidenceSummary },
          { label: 'מה קורה בפועל', content: [result.bottleneck, result.behavioralMechanism].filter(Boolean).join(' ') },
          { label: 'מה לא הייתי מנסה לפתור כרגע', content: result.notThePriority },
          { label: 'איך ממשיכים מכאן', content: result.pathForward },
        ]
      : [
          { label: 'What you thought was stopping you', content: result.presentingTheory },
          { label: 'The six-area map', content: areaMapToText(result.areaMap, isRTL) },
          { label: "What's already working", content: result.whatIsWorking },
          { label: "What's actually holding back your growth", content: result.diagnosisSummary },
          { label: 'Why we got here', content: result.evidenceSummary },
          { label: "What's actually happening", content: [result.bottleneck, result.behavioralMechanism].filter(Boolean).join(' ') },
          { label: "What I wouldn't try to fix right now", content: result.notThePriority },
          { label: 'How to move forward', content: result.pathForward },
        ]
  ).filter((s) => s.content && (Array.isArray(s.content) ? s.content.length > 0 : s.content.trim().length > 0));
}

interface DiagnosisResultDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  result: DiagnosisResult;
  isRTL: boolean;
  displayName?: string | null;
  /** Full-access users keep the single "let's start" CTA — nothing to sell them. */
  hasPaidAccess: boolean;
  onContinue: () => void;
}

export function DiagnosisResultDialog({
  open,
  onOpenChange,
  result,
  isRTL,
  displayName,
  hasPaidAccess,
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

  const meta = toolMeta(result.recommendedTool, isRTL);
  const sections = buildSections(result, isRTL);

  const handleDownload = async () => {
    try {
      await downloadSummaryPdf(
        {},
        { isRTL, displayName },
        { heading: isRTL ? 'האבחון שלך' : 'Your Diagnosis', fileNamePrefix: 'therapykeys-diagnosis', sections },
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

  const handleChooseSingleTool = () => {
    continuedRef.current = true;
    trackEvent('diagnosis_single_tool_purchase_clicked', { recommended_tool: result.recommendedTool, price_ils: SINGLE_TOOL_PRICE_ILS });
  };

  const handleChooseFullMentor = () => {
    continuedRef.current = true;
    trackEvent('diagnosis_full_mentor_purchase_clicked', { recommended_tool: result.recommendedTool, price_ils: FULL_MENTOR_PRICE_ILS });
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

          {result.areaMap?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-2">
                {isRTL ? 'עברנו על שישה אזורים בקליניקה שלך' : "We covered six areas of your practice"}
              </p>
              <div className="space-y-1.5">
                {result.areaMap.map((entry) => {
                  const { label } = toolMeta(entry.area, isRTL);
                  const statusMeta = areaStatusMeta(entry.status, isRTL);
                  const Icon = statusMeta.Icon;
                  const isPriority = entry.status === 'priority';
                  return (
                    <div
                      key={entry.area}
                      className={`flex items-start gap-2 rounded-md px-2.5 py-2 ${
                        isPriority ? 'bg-accent/5 border border-accent/20' : ''
                      }`}
                    >
                      <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${isPriority ? 'text-accent' : 'text-muted-foreground'}`} />
                      <div className="min-w-0">
                        <p className={`text-sm ${isPriority ? 'font-semibold text-foreground' : 'text-foreground/80'}`}>
                          {label}
                          <span className={`me-1.5 text-xs ${isPriority ? 'text-accent' : 'text-muted-foreground'}`}>
                            · {statusMeta.label}
                          </span>
                        </p>
                        {entry.note && <p className="text-xs text-muted-foreground mt-0.5">{entry.note}</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {result.whatIsWorking && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-1">
                {isRTL ? 'מה כן עובד אצלך' : "What's already working"}
              </p>
              <p className="text-sm text-foreground/80">{result.whatIsWorking}</p>
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

          {result.pathForward && (
            <div className="rounded-lg border border-border bg-muted/30 p-4">
              <p className="text-sm text-foreground/90 leading-relaxed">{result.pathForward}</p>
            </div>
          )}
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-col sm:space-x-0">
          {hasPaidAccess ? (
            <>
              <Button variant="cta" className="w-full gap-1.5" onClick={handleContinue}>
                {meta.actionLabel}
                <ArrowLeft className={isRTL ? '' : 'rotate-180'} />
              </Button>
              <p className="text-xs text-center text-muted-foreground -mt-1">
                {isRTL ? 'במסגרת המנטור' : 'within the Mentor'}
              </p>
            </>
          ) : (
            <div className="w-full space-y-2">
              <p className="text-xs text-center text-muted-foreground">
                {isRTL ? 'שתי דרכים להמשיך מכאן:' : 'Two ways to continue from here:'}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <a
                  href={SINGLE_TOOL_PAYMENT_URL}
                  target="_blank"
                  rel="noreferrer"
                  onClick={handleChooseSingleTool}
                  className="flex flex-col gap-1 rounded-lg border border-border p-3 hover:border-accent transition-colors"
                >
                  <span className="text-sm font-semibold text-foreground">{meta.label}</span>
                  <span className="text-xs text-muted-foreground">
                    {isRTL ? 'בדיוק הכלי שהאבחון המליץ עליו' : 'Exactly the tool the diagnosis recommended'}
                  </span>
                  <span className="text-sm font-semibold text-accent mt-1">
                    {isRTL ? `₪${SINGLE_TOOL_PRICE_ILS}` : `${SINGLE_TOOL_PRICE_ILS} NIS ($97)`}
                  </span>
                </a>
                <a
                  href={FULL_MENTOR_PAYMENT_URL}
                  target="_blank"
                  rel="noreferrer"
                  onClick={handleChooseFullMentor}
                  className="flex flex-col gap-1 rounded-lg border-2 border-accent/50 bg-accent/5 p-3 hover:border-accent transition-colors"
                >
                  <span className="text-sm font-semibold text-foreground">
                    {isRTL ? 'המסלול המלא עם אליענה' : 'The Full Mentor Journey'}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {isRTL ? `כולל את ${meta.label} וגם את חמשת הכלים האחרים` : `Includes ${meta.label} plus all five other tools`}
                  </span>
                  <span className="text-sm font-semibold text-accent mt-1">
                    {isRTL ? `₪${FULL_MENTOR_PRICE_ILS}` : `${FULL_MENTOR_PRICE_ILS} NIS`}
                  </span>
                </a>
              </div>
            </div>
          )}
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
