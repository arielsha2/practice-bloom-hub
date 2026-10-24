import { useQuery } from '@tanstack/react-query';
import { Quote } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

// Anonymous testimonials from the Mentor page, shown under the diagnosis offer as proof. They are read from the same
// table the Mentor page's carousel reads (mentor_testimonials, publicly readable), so the label under each one (today
// "psychotherapist, name kept on file") and any later correction or approved name come from one place. The ids pick
// three that speak about results rather than about the experience: a raised fee, a first public post, the confidence
// and the niche. English has only the first, the only one that exists in English.
const TESTIMONIAL_IDS = {
  he: [
    'c1915b34-8836-4a3e-9542-9283c6d5f9b4', // raised the fee
    'ac9ebbca-9ed9-4a6c-bd4d-317ffbe234b2', // first post on Facebook
    '97733cc6-09d8-4126-99ad-51ae4969616c', // niche and confidence
  ],
  en: ['17e68325-3a2f-4847-b861-1645f70c47c8'],
};

interface Row {
  id: string;
  body_text: string | null;
  author: string | null;
}

// The strongest result quote on the challenge page ("a therapist I accompanied"): the diagnosis offers Eliana's help,
// and this one is about what that help changed. It is the same text and label that page already shows publicly.
const ACCOMPANIED: Row = {
  id: 'accompanied',
  body_text:
    'התהליך שעברתי היה באמת תהליך מאוד משמעותי, מאוד עמוק, קיבלתי המון ידע וכלים. היום מגיעים לקליניקה באמת מטופלים שאני רוצה לעבוד איתם, שאני שמחה לעבוד איתם, שהם טובים ומדויקים למה שאני רוצה לתת בעולם. אני יכולה להגיד שזה הקפיץ אותי בעשרות אחוזים.',
  author: 'מטפלת שליוויתי',
};

// What the offer showed before the testimonials were wired in; kept as the fallback if the table cannot be read.
const FALLBACK_HE = 'מטפלים שעברו את המנטור המלא מספרים שהוא נתן להם ידע וביטחון אמיתי לקחת את הצעדים המשמעותיים בקליניקה שלהם.';
const FALLBACK_EN = 'Therapists who completed the full Mentor say it gave them real knowledge and confidence to take the significant steps in their practice.';

export function DiagnosisTestimonials({ isRTL }: { isRTL: boolean }) {
  const ids = isRTL ? TESTIMONIAL_IDS.he : TESTIMONIAL_IDS.en;
  const query = useQuery<Row[]>({
    queryKey: ['diagnosis-testimonials', isRTL ? 'he' : 'en'],
    staleTime: 10 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.from('mentor_testimonials').select('id, body_text, author').in('id', ids);
      if (error) throw error;
      const byId = new Map((data ?? []).map((r) => [r.id, r as Row]));
      return ids.map((id) => byId.get(id)).filter((r): r is Row => !!r && !!r.body_text?.trim());
    },
  });
  const rows = [...(isRTL ? [ACCOMPANIED] : []), ...(query.data ?? [])];

  if (rows.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-muted/20 p-3 flex gap-2">
        <Quote className="w-4 h-4 text-accent shrink-0 mt-0.5" />
        <p className="text-xs text-foreground/80 leading-relaxed italic">{isRTL ? FALLBACK_HE : FALLBACK_EN}</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-muted/20 p-3 space-y-3">
      {rows.map((r, i) => (
        <figure key={r.id} className="flex gap-2 m-0">
          <Quote className={`w-4 h-4 text-accent shrink-0 mt-0.5 ${i === 0 ? '' : 'opacity-40'}`} />
          <div className="min-w-0">
            <blockquote
              className="m-0 text-xs text-foreground/80 leading-relaxed italic whitespace-pre-line"
              style={{ display: '-webkit-box', WebkitLineClamp: 7, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
            >
              {r.body_text!.trim()}
            </blockquote>
            {r.author && <figcaption className="mt-1 text-[11px] text-muted-foreground">{r.author}</figcaption>}
          </div>
        </figure>
      ))}
    </div>
  );
}
