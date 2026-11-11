import { forwardRef } from 'react';
import type { CSSProperties } from 'react';

// The two deliverables of the challenge tools, as pure presentational documents:
// the on-screen preview and the downloaded PDF / PNG render these same components,
// so what the therapist sees is what they download. Colours are fixed hex values
// (a printed page is always "light"), the same palette as the diagnosis report.

export const PAGE_W = 794; // A4 width at 96dpi
export const PAGE_H = 1122; // A4 height at 96dpi

export type CardTheme = 'burgundy' | 'cream' | 'terracotta';

export interface CardData {
  name: string;
  title: string;
  lead: string; // "אני עוזרת"
  who: string; // "לזוגות שהפכו להורים ומרגישים שהתרחקו זה מזה,"
  change: string; // "למצוא שוב שפה משותפת."
  contact: string[];
  theme: CardTheme;
}

export interface InvitationData {
  headline: string; // the opening line, set large: the one that makes the reader recognise themselves
  paragraphs: string[]; // the rest of the note, ending with the short invitation
  name: string;
  title: string;
  contact: string[];
}

const F = {
  sans: "'Assistant', sans-serif",
  display: "'Miriam Libre', 'Assistant', sans-serif",
  serif: "'Frank Ruhl Libre', 'Miriam Libre', serif",
  hand: "'Gveret Levin', 'Miriam Libre', cursive",
};

const C = {
  ink: '#1e1a18',
  muted: '#6b625c',
  burgundy: '#4b0b24',
  terracotta: '#9e5a38',
  cream: '#faf7f2',
  sand: '#f3ece1',
  line: '#e6dfd6',
  paper: '#fdfaf4',
};

export const FONT_FAMILIES = ['Miriam Libre', 'Assistant', 'Frank Ruhl Libre', 'Gveret Levin'];

const THEMES: Record<CardTheme, { bg: string; fg: string; accent: string; muted: string; frame: string; shadow: string }> = {
  burgundy: {
    bg: '#4b0b24',
    fg: '#faf7f2',
    accent: '#e3b48f',
    muted: 'rgba(250,247,242,0.72)',
    frame: 'rgba(227,180,143,0.5)',
    shadow: '0 14px 34px rgba(75,11,36,0.28)',
  },
  cream: {
    bg: '#faf7f2',
    fg: '#4b0b24',
    accent: '#9e5a38',
    muted: '#6b625c',
    frame: 'rgba(158,90,56,0.4)',
    shadow: '0 14px 34px rgba(30,26,24,0.16), 0 0 0 1px #e6dfd6',
  },
  terracotta: {
    bg: '#9e5a38',
    fg: '#fffaf5',
    accent: '#f6e0cb',
    muted: 'rgba(255,250,245,0.82)',
    frame: 'rgba(246,224,203,0.55)',
    shadow: '0 14px 34px rgba(158,90,56,0.32)',
  },
};

export const THEME_LABELS: Record<CardTheme, string> = {
  burgundy: 'בורדו',
  cream: 'קרם',
  terracotta: 'טרה-קוטה',
};

export const THEME_SWATCH: Record<CardTheme, string> = {
  burgundy: '#4b0b24',
  cream: '#faf7f2',
  terracotta: '#9e5a38',
};

// ---------------------------------------------------------------------------------------------
// The card itself: a standard 90 x 50 mm business card (9:5).
// ---------------------------------------------------------------------------------------------
export const BusinessCard = forwardRef<HTMLDivElement, { data: CardData; width: number }>(({ data, width }, ref) => {
  const u = width / 640;
  const t = THEMES[data.theme];
  const initial = data.name.trim().charAt(0);
  return (
    <div
      ref={ref}
      dir="rtl"
      style={{
        width,
        height: (width * 5) / 9,
        background: t.bg,
        color: t.fg,
        borderRadius: 10 * u,
        position: 'relative',
        overflow: 'hidden',
        fontFamily: F.sans,
        boxShadow: t.shadow,
        boxSizing: 'border-box',
        flexShrink: 0,
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 14 * u,
          border: `${Math.max(1, u)}px solid ${t.frame}`,
          borderRadius: 6 * u,
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          padding: `${30 * u}px ${38 * u}px`,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 * u }}>
          <span
            style={{
              width: 30 * u,
              height: 30 * u,
              borderRadius: '50%',
              background: t.accent,
              color: t.bg,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: F.display,
              fontWeight: 700,
              fontSize: 16 * u,
              lineHeight: 1,
            }}
          >
            {initial}
          </span>
          <span style={{ fontSize: 13 * u, color: t.accent, fontWeight: 700 }}>{data.title}</span>
        </div>

        <div>
          <div style={{ width: 34 * u, height: 2 * u, background: t.accent, marginBottom: 12 * u }} />
          <p style={{ margin: 0, fontFamily: F.display, fontWeight: 700, fontSize: 25 * u, lineHeight: 1.38 }}>
            {data.lead ? <span>{data.lead} </span> : null}
            <span>{data.who}</span>
            {data.change ? <span style={{ color: t.accent }}> {data.change}</span> : null}
          </p>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <span style={{ fontFamily: F.display, fontWeight: 700, fontSize: 19 * u }}>{data.name}</span>
          <span style={{ direction: 'ltr', textAlign: 'left', fontSize: 11.5 * u, lineHeight: 1.55, color: t.muted }}>
            {data.contact.map((c) => (
              <div key={c}>{c}</div>
            ))}
          </span>
        </div>
      </div>
    </div>
  );
});
BusinessCard.displayName = 'BusinessCard';

const page: CSSProperties = {
  width: PAGE_W,
  height: PAGE_H,
  boxSizing: 'border-box',
  position: 'relative',
  overflow: 'hidden',
  direction: 'rtl',
  fontFamily: F.sans,
  color: C.ink,
  background: '#ffffff',
};

const Footer = ({ note }: { note: string }) => (
  <div
    style={{
      position: 'absolute',
      insetInline: 64,
      bottom: 34,
      borderTop: `1px solid ${C.line}`,
      paddingTop: 12,
      display: 'flex',
      justifyContent: 'space-between',
      fontSize: 11.5,
      color: C.muted,
    }}
  >
    <span>{note}</span>
    <span>TherapyKeys · על שפת הקליניקה</span>
  </div>
);

// Page 1 of the card PDF: the card, how to use it, a quick test.
export function CardPresentationPage({ data }: { data: CardData }) {
  const uses = [
    { title: 'בפרופיל ובאתר', body: 'המשפט הראשון בביו, בדף הבית או בפרופיל המקצועי.' },
    { title: 'בהיכרות עם עמית', body: 'כששואלים במה אתם עוסקים, מתחילים ממנו ומתארים אדם אחד.' },
    { title: 'כשמפנים אליכם', body: 'הוא המשפט שעוזר למי שמפנה להבין למי כדאי להפנות אליכם.' },
  ];
  return (
    <div style={page}>
      <div style={{ padding: '58px 64px 0' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: C.terracotta, letterSpacing: 0.5 }}>כרטיס הביקור המקצועי</div>
        <h1 style={{ margin: '8px 0 0', fontFamily: F.display, fontSize: 36, fontWeight: 700, color: C.burgundy, lineHeight: 1.2 }}>
          {data.name}
        </h1>
        <p style={{ margin: '8px 0 0', fontSize: 16, color: C.muted, lineHeight: 1.6 }}>
          משפט אחד שאומר למי העבודה שלך מיועדת, ומה משתנה בעקבותיה.
        </p>
      </div>

      <div style={{ margin: '34px 0 0', background: C.sand, padding: '46px 0', display: 'flex', justifyContent: 'center' }}>
        <BusinessCard data={data} width={640} />
      </div>

      <div style={{ padding: '30px 64px 0' }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: C.burgundy, marginBottom: 12 }}>איפה משתמשים בו</div>
        <div style={{ display: 'flex', gap: 16 }}>
          {uses.map((u) => (
            <div key={u.title} style={{ flex: 1, border: `1px solid ${C.line}`, borderRadius: 10, padding: '16px 16px 18px', background: C.cream }}>
              <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 16, color: C.burgundy }}>{u.title}</div>
              <div style={{ marginTop: 6, fontSize: 13.5, lineHeight: 1.65, color: C.ink }}>{u.body}</div>
            </div>
          ))}
        </div>

        <div
          style={{
            marginTop: 22,
            borderInlineStart: `3px solid ${C.terracotta}`,
            paddingInlineStart: 16,
            fontSize: 14.5,
            lineHeight: 1.75,
          }}
        >
          <span style={{ fontWeight: 700, color: C.burgundy }}>בדיקה של שתי דקות: </span>
          קראו את המשפט לעמית ושאלו אותו מה הבין ולמי היה מפנה. אם התשובה קרובה למה שרציתם, המשפט עובד. אם לא, זה מידע טוב על מה לחדד.
        </div>
      </div>

      <Footer note="גרסה ראשונה. אפשר לחזור ולחדד אותה בכל זמן." />
    </div>
  );
}

// Page 2: a print sheet of ten cards at true size, with crop marks.
export function CardSheetPage({ data }: { data: CardData }) {
  const CW = 340; // 90 mm
  const CH = 189; // 50 mm
  const gridW = CW * 2;
  const gridH = CH * 5;
  const left = (PAGE_W - gridW) / 2;
  const top = 120;
  const marks: JSX.Element[] = [];
  for (let c = 0; c <= 2; c++) {
    const x = left + c * CW;
    marks.push(<line key={`vt${c}`} x1={x} x2={x} y1={top - 16} y2={top - 4} />);
    marks.push(<line key={`vb${c}`} x1={x} x2={x} y1={top + gridH + 4} y2={top + gridH + 16} />);
  }
  for (let r = 0; r <= 5; r++) {
    const y = top + r * CH;
    marks.push(<line key={`hl${r}`} y1={y} y2={y} x1={left - 16} x2={left - 4} />);
    marks.push(<line key={`hr${r}`} y1={y} y2={y} x1={left + gridW + 4} x2={left + gridW + 16} />);
  }
  return (
    <div style={page}>
      <div style={{ padding: '50px 64px 0' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: C.terracotta }}>גיליון להדפסה</div>
        <div style={{ marginTop: 6, fontSize: 14.5, color: C.muted, lineHeight: 1.6 }}>
          עשרה כרטיסים בגודל אמיתי, 90 × 50 מ״מ. מדפיסים בגודל 100% (בלי התאמה לעמוד) וחותכים לפי הסימנים.
        </div>
      </div>
      <svg width={PAGE_W} height={PAGE_H} style={{ position: 'absolute', top: 0, left: 0 }} stroke="#a79d94" strokeWidth={1}>
        {marks}
      </svg>
      <div style={{ position: 'absolute', top, left, width: gridW, display: 'flex', flexWrap: 'wrap', direction: 'rtl' }}>
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} style={{ width: CW, height: CH, overflow: 'hidden' }}>
            <BusinessCard data={{ ...data }} width={CW} />
          </div>
        ))}
      </div>
    </div>
  );
}

// The card PDF: page 1 (presentation) + page 2 (print sheet).
export const CardPdfDocument = forwardRef<HTMLDivElement, { data: CardData }>(({ data }, ref) => (
  <div ref={ref} style={{ width: PAGE_W, background: '#ffffff' }}>
    <CardPresentationPage data={data} />
    <CardSheetPage data={data} />
  </div>
));
CardPdfDocument.displayName = 'CardPdfDocument';

// ---------------------------------------------------------------------------------------------
// The personal note: one page on paper. It is written by the therapist in the client's own words,
// in the second person, so that the reader feels the therapist read their diary.
// ---------------------------------------------------------------------------------------------
export const InvitationPage = forwardRef<HTMLDivElement, { data: InvitationData }>(({ data }, ref) => {
  // A longer (edited) note gets a slightly smaller type so it always fits the page.
  const len = data.paragraphs.join('').length + data.headline.length;
  const body = len > 1000 ? 17 : len > 760 ? 19 : 21.5;
  const headSize = data.headline.length > 150 ? 27 : data.headline.length > 100 ? 31 : 35;
  return (
    <div ref={ref} style={{ ...page, background: C.paper }}>
      <div style={{ position: 'absolute', inset: 26, border: '1px solid #d9c9b3' }} />
      <div style={{ position: 'absolute', inset: 32, border: '1px solid #e8dccb' }} />

      <div style={{ position: 'absolute', insetInline: 104, top: 112 }}>
        <div style={{ textAlign: 'center', fontSize: 13, fontWeight: 700, color: C.terracotta, letterSpacing: 0.5 }}>פתק אישי</div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, margin: '12px 0 0' }}>
          <span style={{ height: 1, width: 70, background: '#d9c9b3' }} />
          <span style={{ width: 7, height: 7, transform: 'rotate(45deg)', background: C.terracotta }} />
          <span style={{ height: 1, width: 70, background: '#d9c9b3' }} />
        </div>

        <p
          style={{
            margin: '46px 10px 0',
            textAlign: 'center',
            fontFamily: F.serif,
            fontSize: headSize,
            lineHeight: 1.5,
            color: C.burgundy,
            fontWeight: 500,
          }}
        >
          {data.headline}
        </p>

        <div style={{ margin: '40px auto 38px', height: 1, width: 120, background: '#d9c9b3' }} />

        <div style={{ fontFamily: F.serif, fontSize: body, lineHeight: 1.95, color: '#2b2220' }}>
          {data.paragraphs.map((p, i) => (
            <p key={i} style={{ margin: i === 0 ? 0 : '18px 0 0' }}>
              {p}
            </p>
          ))}
        </div>

        <div style={{ marginTop: 44 }}>
          <div style={{ fontFamily: F.hand, fontSize: 46, color: C.burgundy, lineHeight: 1.35, transform: 'rotate(-3deg)', transformOrigin: 'right center' }}>
            {data.name}
          </div>
          <div style={{ marginTop: 14, fontSize: 14, color: C.muted }}>{data.title}</div>
          <div style={{ marginTop: 3, fontSize: 13, color: C.muted, direction: 'ltr', textAlign: 'right' }}>{data.contact.join('  ·  ')}</div>
        </div>
      </div>
    </div>
  );
});
InvitationPage.displayName = 'InvitationPage';

// A square version for sharing (a post, a story, the community group): the headline and the invitation.
export const InvitationShare = forwardRef<HTMLDivElement, { data: InvitationData; size?: number }>(({ data, size = 540 }, ref) => {
  const u = size / 540;
  const head = data.headline.length > 150 ? 21 : data.headline.length > 100 ? 25 : 29;
  return (
    <div
      ref={ref}
      dir="rtl"
      style={{
        width: size,
        height: size,
        background: C.burgundy,
        color: '#faf7f2',
        position: 'relative',
        overflow: 'hidden',
        boxSizing: 'border-box',
        padding: `${46 * u}px ${48 * u}px`,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        fontFamily: F.sans,
      }}
    >
      <div style={{ position: 'absolute', inset: 16 * u, border: `${u}px solid rgba(227,180,143,0.45)` }} />
      <div style={{ fontSize: 12.5 * u, fontWeight: 700, color: '#e3b48f' }}>פתק אישי</div>
      <div>
        <div style={{ width: 34 * u, height: 2 * u, background: '#e3b48f', marginBottom: 18 * u }} />
        <p style={{ margin: 0, fontFamily: F.serif, fontSize: head * u, lineHeight: 1.5 }}>{data.headline}</p>
        <p style={{ margin: `${20 * u}px 0 0`, fontFamily: F.serif, fontSize: 15.5 * u, lineHeight: 1.7, color: 'rgba(250,247,242,0.82)' }}>
          {data.paragraphs[data.paragraphs.length - 1]}
        </p>
      </div>
      <div>
        <div style={{ fontFamily: F.hand, fontSize: 32 * u, lineHeight: 1.35, color: '#faf7f2', transform: 'rotate(-3deg)', transformOrigin: 'right center' }}>{data.name}</div>
        <div style={{ fontSize: 12.5 * u, color: 'rgba(250,247,242,0.7)', marginTop: 8 * u }}>{data.title}</div>
      </div>
    </div>
  );
});
InvitationShare.displayName = 'InvitationShare';
