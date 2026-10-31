import { supabase } from '@/integrations/supabase/client';
import { trackEvent } from '@/lib/analytics';

export type DeliverableTool = 'niche-finder' | 'contact-finder';
export const DELIVERABLE_TOOLS: DeliverableTool[] = ['niche-finder', 'contact-finder'];

export interface NicheContent {
  focus_sentences: string[];
  page_headline: string;
  test_with_colleague: string;
  note?: string;
}
export interface ReferralSource {
  type: string;
  why: string;
  message: string;
  followup: string;
}
export interface ContactContent {
  referral_sources: ReferralSource[];
  note?: string;
}
export type DeliverableContent = NicheContent | ContactContent;

export interface Deliverable {
  id: string;
  tool: DeliverableTool;
  version: number;
  content: DeliverableContent;
  edited_content: DeliverableContent | null;
  created_at: string;
}

export interface MissingField {
  key: string;
  label: string;
  hint: string;
}

export type GenerateResult =
  | { status: 'ok'; deliverable: Deliverable }
  | { status: 'needs_info'; fields: MissingField[] }
  | { status: 'failed' }
  | { status: 'no_access' }
  | { status: 'limit' }
  | { status: 'error' };

// What the therapist sees and copies: their own edit if there is one, otherwise what was generated.
export const shownContent = (d: Deliverable): DeliverableContent => d.edited_content ?? d.content;

export async function generateDeliverable(tool: DeliverableTool, answers: Record<string, string> = {}): Promise<GenerateResult> {
  const { data, error } = await supabase.functions.invoke('generate-deliverable', { body: { tool, answers } });
  if (error) {
    const status = (error as { context?: Response }).context?.status;
    if (status === 403) return { status: 'no_access' };
    if (status === 429) return { status: 'limit' };
    return { status: 'error' };
  }
  if (data?.status === 'ok') return { status: 'ok', deliverable: data.deliverable as Deliverable };
  if (data?.status === 'needs_info') return { status: 'needs_info', fields: data.fields as MissingField[] };
  return { status: 'failed' };
}

// Opening, copying, downloading, editing and regenerating are what show whether the deliverables are used.
export async function recordDeliverableEvent(
  kind: 'viewed' | 'copied' | 'downloaded' | 'edited' | 'regenerated',
  tool: DeliverableTool,
  deliverableId?: string,
) {
  trackEvent(`deliverable_${kind}`, { tool });
  try {
    const { data } = await supabase.auth.getUser();
    if (!data.user) return;
    await supabase.from('deliverable_events').insert({ user_id: data.user.id, deliverable_id: deliverableId ?? null, tool, kind });
  } catch (e) {
    console.error('failed to record deliverable event', e);
  }
}

// Plain text of a deliverable, for the "download" button and for "copy everything".
export function deliverableToText(tool: DeliverableTool, content: DeliverableContent): string {
  if (tool === 'niche-finder') {
    const c = content as NicheContent;
    return [
      'המשפט שמציג את העבודה שלך',
      '',
      ...c.focus_sentences.map((s, i) => `${i + 1}. ${s}`),
      '',
      `כותרת לדף: ${c.page_headline}`,
      '',
      `בדיקה עם עמית: ${c.test_with_colleague}`,
    ].join('\n');
  }
  const c = content as ContactContent;
  return [
    'הודעה לאנשי מקצוע שמפנים מטופלים',
    '',
    ...c.referral_sources.flatMap((r, i) => [`${i + 1}. ${r.type}`, r.message, `מעקב: ${r.followup}`, '']),
  ].join('\n');
}
