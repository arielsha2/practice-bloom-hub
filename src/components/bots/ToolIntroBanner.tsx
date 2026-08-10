import { Sparkles, X } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

const BOT_INTROS: Record<string, { he: string; en: string }> = {
  'niche-finder': {
    he: 'לחידוד הנישה המקצועית שלך ולזיהוי המטופל האידאלי.',
    en: 'To sharpen your professional niche and identify your ideal patient.',
  },
  'strategy-planner': {
    he: 'לבניית תוכנית פעולה ממוקדת לקליניקה שלך.',
    en: 'To build a focused action plan for your clinic.',
  },
  'content-creator': {
    he: 'ליצירת תוכן שיווקי שמדבר בשפה שלך.',
    en: 'To create marketing content that speaks in your voice.',
  },
  'connection-bridge': {
    he: 'לתרגול פנייה ובניית קשר עם איש מקצוע מפנה — לא מטופל.',
    en: 'To practice reaching out and building a relationship with a referring colleague — not a patient.',
  },
  'contact-finder': {
    he: 'למציאת אנשי קשר מקצועיים רלוונטיים לקליניקה שלך.',
    en: 'To find professional contacts relevant to your clinic.',
  },
  'self-presentation': {
    he: 'לניסוח הצגה עצמית בהירה ומדויקת.',
    en: 'To craft a clear and accurate self-presentation.',
  },
  'first-call-practice': {
    he: 'לתרגול שיחת הטלפון הראשונה עם מטופל פוטנציאלי, מהבירור ועד לקביעת פגישה.',
    en: 'To practice the first phone call with a prospective patient, from intake to booking.',
  },
};

interface ToolIntroBannerProps {
  botKey: string;
  botName: string;
  isRTL: boolean;
}

export function ToolIntroBanner({ botKey, botName, isRTL }: ToolIntroBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  const intro = BOT_INTROS[botKey];
  const lang = isRTL ? 'he' : 'en';
  const description = intro?.[lang] ?? '';

  const title = isRTL
    ? `את/ה כרגע בכלי AI · ${botName}`
    : `You are now in the AI tool · ${botName}`;
  const tail = isRTL
    ? 'כשתסיים/י — לחיצה על "חזרה למנטור עם הסיכום" בראש המסך תחזיר אותך לאליענה עם סיכום השיחה.'
    : 'When you finish — click "Return to Mentor" at the top to go back to Eliana with your summary.';

  return (
    <div
      dir={isRTL ? 'rtl' : 'ltr'}
      className={cn(
        'mx-4 mt-4 rounded-lg border border-accent/30 bg-accent/5 px-4 py-3',
        'flex items-start gap-3'
      )}
    >
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-accent/15 flex items-center justify-center">
        <Sparkles className="w-4 h-4 text-accent" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        {description && (
          <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
        )}
        <p className="text-xs text-muted-foreground mt-1">{tail}</p>
      </div>
      <button
        onClick={() => setDismissed(true)}
        className="flex-shrink-0 p-1 rounded hover:bg-accent/10 text-muted-foreground hover:text-foreground transition-colors"
        aria-label={isRTL ? 'סגור' : 'Dismiss'}
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
