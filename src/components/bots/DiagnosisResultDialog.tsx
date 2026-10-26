import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Download, FileText, Copy, ArrowLeft, Target, Check, Minus, CircleDashed, ShieldCheck, Sparkles, MessageCircle, ThumbsUp, ThumbsDown, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  downloadSummaryPdf,
  copySummaryText,
  type SummarySection,
} from '@/lib/mentorSummary';
import { trackEvent } from '@/lib/analytics';
import { DiagnosisReportDocument } from '@/components/diagnosis/DiagnosisReportDocument';
import { DiagnosisTestimonials } from '@/components/bots/DiagnosisTestimonials';
import { downloadDiagnosisReportPdf } from '@/lib/diagnosisReportPdf';
import type { DiagnosisReport } from '@/lib/diagnosisReport';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle2, Loader2 } from 'lucide-react';

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
  /** Formal report with computed scores; absent on diagnoses made before it existed. */
  report?: DiagnosisReport | null;
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
const SINGLE_TOOL_PRICE_USD = 97;
const SINGLE_TOOL_PAYMENT_URL_HE = 'https://pay.grow.link/NzkyMDE~68a43deedc01abb7f94a1112c32d0b6b-Mzg3NjE4Ng';
const SINGLE_TOOL_PAYMENT_URL_EN = 'https://www.paypal.com/ncp/payment/6X9HVVT5D7WS4';
const FULL_MENTOR_PRICE_ILS = 750;
const FULL_MENTOR_PRICE_USD = 250;
const FULL_MENTOR_PAYMENT_URL_HE = 'https://meshulam.co.il/quick_payment?b=692abdd2459224a95d57aef700a015ab';
const FULL_MENTOR_PAYMENT_URL_EN = 'https://www.paypal.com/ncp/payment/TLJZ4QDGZCDWN';
// For someone who wants hands-on guidance (the small group or one-on-one with Eliana): a short fit
// questionnaire, after which Eliana sets up an intro call. Hebrew only; the English version is not published.
const ELIANA_WHATSAPP_NUMBER = '972523379716';
const PREMIUM_FIT_FORM_URL_HE ='https://docs.google.com/forms/d/e/1FAIpQLSffRhcbsjwlcVL46nwy8HHL3OFeBb04uUIvjEQcSAJU5cbWjA/viewform';

// Where the "send to a colleague" WhatsApp message points — the diagnosis's
// own public entry point, not this account's authenticated /mentor area.
const DIAGNOSIS_START_URL_HE = 'https://therapykeys.co.il/ai-assistants/practice-diagnosis';
const DIAGNOSIS_START_URL_EN = 'https://therapykeys.co.il/en/ai-assistants/practice-diagnosis';

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
  const [feedbackRating, setFeedbackRating] = useState<'up' | 'down' | null>(null);
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackTextSent, setFeedbackTextSent] = useState(false);

  useEffect(() => {
    if (open) {
      continuedRef.current = false;
      setFeedbackRating(null);
      setFeedbackText('');
      setFeedbackTextSent(false);
      trackEvent('diagnosis_result_viewed', { recommended_tool: result.recommendedTool, bottleneck_stage: result.bottleneckStage });
      void recordConsultClick('report_opened');
    } else if (!continuedRef.current) {
      trackEvent('diagnosis_exited_without_continue', { recommended_tool: result.recommendedTool });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const meta = toolMeta(result.recommendedTool, isRTL);

  // After the purchase button is clicked the payment happens in another tab and the webhook grants access a few
  // seconds later. Poll for the grant (every 5s, up to 20 min) so the dialog itself shows the tool link when it
  // arrives, without the therapist having to reload anything.
  const { user: authUser } = useAuth();
  const [purchaseKind, setPurchaseKind] = useState<'single_tool' | 'full_mentor' | null>(null);
  const [purchaseStartedAt, setPurchaseStartedAt] = useState<number | null>(null);
  const toolAccessQuery = useQuery<boolean>({
    queryKey: ['diagnosis-dialog-tool-access', authUser?.id, result.recommendedTool],
    enabled: open && !!authUser?.id && !!result.recommendedTool,
    refetchInterval: (query) =>
      purchaseKind === 'single_tool' && purchaseStartedAt !== null && Date.now() - purchaseStartedAt < 20 * 60_000 && query.state.data !== true
        ? 5000
        : false,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_tool_access')
        .select('id')
        .eq('user_id', authUser!.id)
        .eq('bot_key', result.recommendedTool)
        // a time-limited purchase that has run out no longer counts as owning the tool
        .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
        .limit(1);
      if (error) throw error;
      return (data?.length ?? 0) > 0;
    },
  });
  const ownsTool = toolAccessQuery.data === true;
  const toolPath = `${isRTL ? '' : '/en'}/ai-assistants/${result.recommendedTool}`;
  const waitingForPayment =
    purchaseKind === 'single_tool' && !ownsTool && purchaseStartedAt !== null && Date.now() - purchaseStartedAt < 20 * 60_000;
  const sections = buildSections(result, isRTL);
  const report = result.report ?? null;
  const [downloadingReport, setDownloadingReport] = useState(false);

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

  const handleDownloadReport = async () => {
    if (!report || downloadingReport) return;
    setDownloadingReport(true);
    try {
      await downloadDiagnosisReportPdf(report, { isRTL, displayName });
      trackEvent('diagnosis_report_pdf_downloaded', { recommended_tool: result.recommendedTool, overall: report.overall });
    } catch (e) {
      console.error(e);
      toast.error(isRTL ? 'ההורדה נכשלה' : 'Download failed');
    } finally {
      setDownloadingReport(false);
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

  // Records the click into diagnosis_purchase_intents so admins get an actual
  // list of who clicked "buy" (name/email/which option), not just an
  // anonymous GA4 count — a same-day personal follow-up on a hot lead like
  // this is worth far more than a report someone checks weeks later.
  // Fire-and-forget: a failure here should never block the actual purchase
  // link from opening.
  const recordPurchaseIntent = async (purchaseType: 'single_tool' | 'full_mentor') => {
    try {
      const { data } = await supabase.auth.getUser();
      const user = data.user;
      if (!user) return;
      await supabase.from('diagnosis_purchase_intents').insert({
        user_id: user.id,
        email: user.email ?? null,
        full_name: displayName ?? null,
        recommended_tool: result.recommendedTool,
        purchase_type: purchaseType,
        language: isRTL ? 'he' : 'en',
      });
    } catch (e) {
      console.error('failed to record purchase intent', e);
    }
  };

  // Who opened the report and who tried to reach Eliana, so the follow-up list is real people and not a GA4 count.
  const recordConsultClick = async (kind: 'report_opened' | 'whatsapp' | 'premium_form') => {
    try {
      const { data } = await supabase.auth.getUser();
      const user = data.user;
      if (!user) return;
      await supabase.from('diagnosis_consult_clicks').insert({
        user_id: user.id,
        email: user.email ?? null,
        full_name: displayName ?? null,
        kind,
        recommended_tool: result.recommendedTool,
        language: isRTL ? 'he' : 'en',
      });
    } catch (e) {
      console.error('failed to record consult click', e);
    }
  };

  // Upsert (one row per user) so clicking a thumb records immediately, and
  // filling in the optional reason afterward on a thumbs-down just adds to
  // the same row instead of creating a second one.
  const submitFeedback = async (rating: 'up' | 'down', text?: string) => {
    try {
      const { data } = await supabase.auth.getUser();
      const user = data.user;
      if (!user) return;
      await supabase.from('diagnosis_feedback').upsert(
        {
          user_id: user.id,
          email: user.email ?? null,
          rating,
          feedback_text: text ?? null,
          recommended_tool: result.recommendedTool,
          language: isRTL ? 'he' : 'en',
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' },
      );
    } catch (e) {
      console.error('failed to record diagnosis feedback', e);
    }
  };

  const handleRate = (rating: 'up' | 'down') => {
    setFeedbackRating(rating);
    trackEvent('diagnosis_feedback_given', { rating, recommended_tool: result.recommendedTool });
    void submitFeedback(rating);
  };

  const handleSendFeedbackText = () => {
    if (!feedbackText.trim()) return;
    setFeedbackTextSent(true);
    void submitFeedback('down', feedbackText.trim());
  };

  // Framed around a specific colleague's situation, not the sender's own —
  // asking "does this feel accurate for you" would require the sender to
  // hold themselves up as an example in front of a peer, which is exactly
  // the kind of exposure this population avoids. Sent privately (wa.me,
  // not a public post) to one person the sender already has in mind.
  const handleShareWithColleague = () => {
    trackEvent('diagnosis_colleague_share_clicked', { recommended_tool: result.recommendedTool });
    const url = isRTL ? DIAGNOSIS_START_URL_HE : DIAGNOSIS_START_URL_EN;
    const message = isRTL
      ? `חשבתי עלייך כשראיתי את זה — כלי אבחון קצר וחינמי שעזר לי להבין מה בדיוק עוצר את הקליניקה שלי. חשבתי שאולי יעזור גם לך: ${url}`
      : `Thought of you when I saw this — a short, free tool that helped me understand what's actually holding back my practice. Thought it might help you too: ${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank', 'noreferrer');
  };

  const handleChooseSingleTool = () => {
    continuedRef.current = true;
    trackEvent('diagnosis_single_tool_purchase_clicked', {
      recommended_tool: result.recommendedTool,
      currency: isRTL ? 'ILS' : 'USD',
      price: isRTL ? SINGLE_TOOL_PRICE_ILS : SINGLE_TOOL_PRICE_USD,
    });
    void recordPurchaseIntent('single_tool');
    setPurchaseKind('single_tool');
    setPurchaseStartedAt(Date.now());
  };

  const handleChooseFullMentor = () => {
    continuedRef.current = true;
    trackEvent('diagnosis_full_mentor_purchase_clicked', {
      recommended_tool: result.recommendedTool,
      currency: isRTL ? 'ILS' : 'USD',
      price: isRTL ? FULL_MENTOR_PRICE_ILS : FULL_MENTOR_PRICE_USD,
    });
    void recordPurchaseIntent('full_mentor');
    setPurchaseKind('full_mentor');
    setPurchaseStartedAt(Date.now());
  };

  const handlePremiumFitClicked = () => {
    trackEvent('diagnosis_premium_fit_form_clicked', { recommended_tool: result.recommendedTool });
    void recordConsultClick('premium_form');
  };

  // A direct line to Eliana for someone who is still deciding. The prefilled message tells her which tool the
  // diagnosis recommended; no email, score or other personal detail goes into the link.
  const handleWhatsappClicked = () => {
    trackEvent('diagnosis_whatsapp_clicked', { recommended_tool: result.recommendedTool });
    void recordConsultClick('whatsapp');
    const message = `היי אליענה, סיימתי את האבחון וההמלצה שקיבלתי היא ${meta.label}. אשמח לעזרה להבין מה הכי מתאים לי.`;
    window.open(`https://wa.me/${ELIANA_WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`, '_blank', 'noreferrer');
  };

  const renderFeedback = () => (
    <>
      <div className="mt-3 pt-3 border-t border-accent/20 flex items-center gap-2.5">
        {feedbackRating ? (
          <p className="text-xs text-muted-foreground">
            {isRTL ? 'תודה על המשוב!' : 'Thanks for the feedback!'}
          </p>
        ) : (
          <>
            <p className="text-xs text-muted-foreground">
              {isRTL ? 'זה הרגיש מדויק?' : 'Did this feel accurate?'}
            </p>
            <button
              type="button"
              onClick={() => handleRate('up')}
              aria-label={isRTL ? 'כן, זה מדויק' : 'Yes, this is accurate'}
              className="text-muted-foreground hover:text-accent transition-colors"
            >
              <ThumbsUp className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => handleRate('down')}
              aria-label={isRTL ? 'לא, זה לא מדויק' : "No, this isn't accurate"}
              className="text-muted-foreground hover:text-destructive transition-colors"
            >
              <ThumbsDown className="w-4 h-4" />
            </button>
          </>
        )}
      </div>

      {feedbackRating === 'up' && (
        <div className="mt-2.5 rounded-md border border-border bg-background/60 p-2.5 space-y-2">
          <p className="text-xs text-foreground/80 leading-relaxed">
            {isRTL
              ? 'עולה לך בראש קולגה שמרגיש שהוא לא הכתובת הראשונה שעולה בראש כשמישהו שואל למי להפנות?'
              : "Does a colleague come to mind — someone who isn't the first name people think of when someone asks who to refer to?"}
          </p>
          <Button size="sm" variant="outline" className="gap-1.5" onClick={handleShareWithColleague}>
            <Share2 className="w-3.5 h-3.5" />
            {isRTL ? 'שליחה לקולגה' : 'Send to a colleague'}
          </Button>
        </div>
      )}

      {feedbackRating === 'down' && !feedbackTextSent && (
        <div className="mt-2.5 space-y-1.5">
          <Textarea
            value={feedbackText}
            onChange={(e) => setFeedbackText(e.target.value)}
            placeholder={isRTL ? 'מה לא הרגיש מדויק? (לא חובה)' : "What didn't feel accurate? (optional)"}
            className="text-sm min-h-16 bg-background"
          />
          {feedbackText.trim() && (
            <Button size="sm" variant="secondary" onClick={handleSendFeedbackText}>
              {isRTL ? 'שליחה' : 'Send'}
            </Button>
          )}
        </div>
      )}
      {feedbackTextSent && (
        <p className="mt-2 text-xs text-muted-foreground">
          {isRTL ? 'תודה, זה עוזר לנו לדייק את האבחון.' : 'Thanks — this helps us sharpen the diagnosis.'}
        </p>
      )}
    </>
  );

  const renderTestimonial = () => <DiagnosisTestimonials isRTL={isRTL} />;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`${report ? 'sm:max-w-2xl' : 'sm:max-w-lg'} max-h-[85vh] overflow-y-auto`} dir={isRTL ? 'rtl' : 'ltr'}>
        <DialogHeader>
          <DialogTitle>{isRTL ? 'האבחון שלך' : 'Your Diagnosis'}</DialogTitle>
        </DialogHeader>

        {report ? (
          <div className="space-y-5">
            <div className="rounded-lg border border-border bg-white p-4 sm:p-6 text-start">
              <DiagnosisReportDocument report={report} isRTL={isRTL} displayName={displayName} showAppendix />
            </div>
            <div className="rounded-lg border border-border bg-muted/20 px-3 pb-3 [&>div:first-child]:mt-0 [&>div:first-child]:border-t-0 [&>div:first-child]:pt-3">
              {renderFeedback()}
            </div>
            {!hasPaidAccess && renderTestimonial()}
          </div>
        ) : (
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

              {renderFeedback()}
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

          {!hasPaidAccess && renderTestimonial()}
        </div>
        )}

        <DialogFooter className="flex-col gap-2 sm:flex-col sm:space-x-0">
          {ownsTool && !hasPaidAccess ? (
            <div className="w-full rounded-lg border border-emerald-300 bg-emerald-50 p-3 space-y-2 text-center" role="status">
              <p className="text-sm font-semibold text-emerald-900 flex items-center justify-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                {isRTL ? `הכלי ${meta.label} פתוח עבורך` : `${meta.label} is open for you`}
              </p>
              <Button variant="cta" className="w-full" asChild>
                <a href={toolPath}>{isRTL ? 'לפתיחת הכלי' : 'Open the tool'}</a>
              </Button>
              {purchaseKind === 'single_tool' && (
                <p className="text-xs text-muted-foreground">
                  {isRTL
                    ? 'אימייל אישור עם אותו קישור נשלח לאימייל שאיתו נרשמת. אם הוא לא הגיע, כדאי לבדוק בתיקיית הספאם.'
                    : 'A confirmation email with the same link was sent to the email you registered with. If it has not arrived, check the spam folder.'}
                </p>
              )}
            </div>
          ) : hasPaidAccess ? (
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
            <div className="w-full space-y-2.5">
              {isRTL && (
                <div className="rounded-xl border-2 border-accent/50 bg-accent/5 p-4 space-y-3 text-center">
                  <p className="text-base font-bold text-foreground">להתייעץ עם אליענה על מה שמתאים לך</p>
                  <p className="text-sm text-foreground/80 leading-relaxed">
                    אליענה שפירא, מטפלת זוגית ומומחית ליצירת תוכן ובינה מלאכותית, מלווה מטפלים בבניית קליניקה פרטית,
                    בדיוק בנקודות שעלו באבחון שלך. אפשר לפנות אליה ולהתייעץ על הצעד הנכון עבורך עכשיו.
                  </p>
                  <Button
                    size="lg"
                    className="w-full h-auto py-3.5 text-base font-semibold gap-2 bg-[#25D366] hover:bg-[#1ebe5a] text-white"
                    onClick={handleWhatsappClicked}
                  >
                    <MessageCircle className="w-5 h-5" />
                    לפנייה לאליענה בווצאפ
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    אליענה עונה בעצמה, בדרך כלל תוך יום. הפנייה היא כדי להתייעץ, ואין חובה לקנות דבר.
                  </p>
                  <a
                    href={PREMIUM_FIT_FORM_URL_HE}
                    target="_blank"
                    rel="noreferrer"
                    onClick={handlePremiumFitClicked}
                    className="inline-block text-sm font-medium text-accent hover:underline underline-offset-2"
                  >
                    מתעניינים בליווי אישי (קבוצה קטנה או אחד על אחד)? לשאלון התאמה קצר
                  </a>
                </div>
              )}

              <p className="pt-1 text-center text-sm font-medium text-muted-foreground">
                {isRTL ? 'או להמשיך לבד, בקצב שלך:' : 'Or continue on your own:'}
              </p>

              <div className="flex items-center gap-1.5 justify-center text-xs font-medium text-accent">
                <Sparkles className="w-3.5 h-3.5" />
                {isRTL
                  ? 'בונוס למי שמתחילים תוך 48 שעות: שיחת ייעוץ קצרה עם אליענה, אישית'
                  : 'Bonus for starting within 48 hours: a short personal call with Eliana'}
              </div>

              <Button variant="cta" className="w-full h-auto py-2.5" asChild>
                <a
                  href={isRTL ? FULL_MENTOR_PAYMENT_URL_HE : FULL_MENTOR_PAYMENT_URL_EN}
                  target="_blank"
                  rel="noreferrer"
                  onClick={handleChooseFullMentor}
                  className="flex flex-col items-center leading-tight gap-0.5"
                >
                  <span>
                    {isRTL ? 'להתחיל את המסע המלא עם אליענה' : 'Start the full journey with Eliana'} — {isRTL ? `₪${FULL_MENTOR_PRICE_ILS}` : `$${FULL_MENTOR_PRICE_USD}`}
                  </span>
                  <span className="text-xs font-normal opacity-85">
                    {isRTL
                      ? `כל ששת הכלים, כולל ${meta.label} שהאבחון המליץ עליו`
                      : `All six tools, including ${meta.label}, the one the diagnosis recommended`}
                  </span>
                </a>
              </Button>

              <div className="flex items-center gap-1.5 justify-center text-xs text-muted-foreground">
                <ShieldCheck className="w-3.5 h-3.5 text-accent" />
                {isRTL ? 'לא מתאים לך? החזר כספי מלא, ללא שאלות.' : "Not a fit? Full refund, no questions asked."}
              </div>

              <Button variant="outline" className="w-full h-auto py-2.5" asChild>
                <a
                  href={isRTL ? SINGLE_TOOL_PAYMENT_URL_HE : SINGLE_TOOL_PAYMENT_URL_EN}
                  target="_blank"
                  rel="noreferrer"
                  onClick={handleChooseSingleTool}
                  className="flex flex-col items-center leading-tight gap-0.5"
                >
                  <span>
                    {isRTL ? `רק הכלי שהומלץ: ${meta.label}` : `Just the recommended tool: ${meta.label}`} — {isRTL ? `₪${SINGLE_TOOL_PRICE_ILS}` : `$${SINGLE_TOOL_PRICE_USD}`}
                  </span>
                </a>
              </Button>

              {purchaseKind && (
                <div className="rounded-lg border border-accent/30 bg-accent/5 p-3 text-xs leading-relaxed space-y-1.5" role="status">
                  <p className="font-semibold text-foreground">{isRTL ? 'מה קורה אחרי התשלום' : 'What happens after payment'}</p>
                  {purchaseKind === 'single_tool' ? (
                    <p>
                      {isRTL
                        ? `אחרי התשלום הכלי ${meta.label} ייפתח כאן, בדיאלוג הזה, עם קישור לכניסה אליו. יישלח אליך גם אימייל אישור עם אותו קישור.`
                        : `After payment, ${meta.label} will open right here in this dialog, with a link to it. A confirmation email with the same link will also be sent to you.`}
                    </p>
                  ) : (
                    <p>{isRTL ? 'אחרי התשלום הגישה תיפתח אוטומטית. כדאי לרענן את הדף אחרי דקה.' : 'After payment, access opens automatically. Refresh the page after a minute.'}</p>
                  )}
                  <p>
                    {isRTL
                      ? `חשוב לשלם עם האימייל שאיתו נרשמת${authUser?.email ? ': ' + authUser.email : ''}. תשלום באימייל אחר לא יזוהה אוטומטית.`
                      : `Please pay with the email you registered with${authUser?.email ? ': ' + authUser.email : ''}. A payment under another email is not matched automatically.`}
                  </p>
                  {waitingForPayment && (
                    <p className="flex items-center gap-1.5 text-muted-foreground">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      {isRTL ? 'ממתינים לאישור התשלום. הדף מתעדכן לבד.' : 'Waiting for the payment confirmation. This updates by itself.'}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
          {report ? (
            <div className="pt-1">
              <Button variant="outline" className="w-full gap-1.5" onClick={handleDownloadReport} disabled={downloadingReport}>
                <FileText className="w-4 h-4" />
                {downloadingReport
                  ? (isRTL ? 'מכין את הקובץ...' : 'Preparing the file...')
                  : (isRTL ? 'הורדת הדו״ח הרשמי (PDF)' : 'Download the official report (PDF)')}
              </Button>
            </div>
          ) : (
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
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
