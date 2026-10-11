import { forwardRef } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { BAND_META, formatScore } from '@/lib/diagnosisReport';
import type { DiagnosisReport, ReportRating } from '@/lib/diagnosisReport';

// The single source of truth for how the official report looks: the dialog
// renders it on screen and diagnosisReportPdf.ts rasterises this same markup,
// so the two can't drift. Colours are fixed hex values (a printed page is always
// "light"), not theme tokens, so dark mode never leaks into the PDF.
//
// The "על שפת הקליניקה" logo is picked up from src/assets/clinic-language-logo.*
// if that file exists; until then a text wordmark stands in.
const logoModules = import.meta.glob('@/assets/clinic-language-logo.{png,svg,webp,jpg}', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>;
export const CLINIC_LOGO_SRC: string | null = Object.values(logoModules)[0] ?? null;

const C = {
  ink: '#1e1a18',
  muted: '#6b625c',
  burgundy: '#4b0b24',
  terracotta: '#9e5a38',
  cream: '#faf7f2',
  line: '#e6dfd6',
  track: '#ece5db',
};

const T = {
  he: {
    title: 'דו״ח אבחון: מצב הקליניקה הפרטית',
    caption: 'כלי האבחון של הקליניקה',
    brand: 'מבית "על שפת הקליניקה" של ד״ר אריאל שפירא ואליענה שפירא',
    preparedFor: 'הוכן עבור',
    date: 'תאריך',
    scoreTitle: 'ציון עוגן',
    outOf: 'מתוך 10',
    scoreNote: 'הציון הכללי הוא ממוצע ציוני התחומים. ככל שהוא גבוה יותר, המצב טוב יותר.',
    partialNote: 'הציון מבוסס על {n} מתוך 6 תחומים. תחום שלא התקבל לגביו מידע מספק אינו נכלל בחישוב, ולכן הציון עשוי להשתנות באבחון חוזר.',
    noScoreNote: 'לא התקבל בשיחה מספיק מידע כדי לחשב ציון. הדו״ח מבוסס על מה שנאמר, ואפשר להשלים את התמונה באבחון חוזר.',
    areasTitle: 'ציון לפי תחום, לפי סדר דחיפות',
    notAssessed: 'לא נבדק',
    notAssessedNote: 'לא התקבל מידע מספק לדירוג',
    urgent: 'נקודת הכשל',
    central: 'נקודת הכשל המרכזית',
    cause: 'הסיבה',
    basis: 'על מה זה מבוסס',
    works: 'מה עובד',
    needsWork: 'מה לא עובד',
    fix: 'איך מתקנים',
    steps: 'צעדים מעשיים',
    outcome: 'תוצר',
    notNow: 'מה לא כדאי לעסוק בו כעת',
    progress: 'איך בודקים התקדמות',
    progressBody:
      'לאחר יישום הצעדים אפשר לבצע את האבחון מחדש. המדד קבוע (גרסה {v}), ולכן ההשוואה בין שני אבחונים משקפת שינוי בפועל ולא שינוי בשיטת המדידה.',
    method: 'הערת מתודולוגיה',
    methodBody:
      'הציונים מחושבים ממדד קבוע של 24 קריטריונים, ארבעה בכל אחד משישה תחומים, על סמך הנאמר בשיחת האבחון. קריטריון שלא התקבל לגביו מידע מספק אינו נכלל בחישוב. הדו״ח הוא כלי עזר מקצועי להכוונה ואינו תחליף לליווי אישי.',
    appendix: 'נספח: פירוט הקריטריונים',
    rating: { 2: 'במקום', 1: 'חלקי', 0: 'חסר' } as Record<number, string>,
    unknown: 'לא נבדק',
    bio: 'ד״ר אריאל שפירא · פסיכולוג קליני ומייסד TherapyKeys · עוזר למטפלים לבנות קליניקה פרטית משגשגת',
  },
  en: {
    title: 'Diagnosis Report: Your Private Practice',
    caption: 'The practice diagnostic tool',
    brand: 'From "On the Language of the Clinic" by Dr. Ariel Shapira and Eliana Shapira',
    preparedFor: 'Prepared for',
    date: 'Date',
    scoreTitle: 'Anchor score',
    outOf: 'out of 10',
    scoreNote: 'The overall score is the average of the area scores. Higher means a stronger position.',
    partialNote: 'The score is based on {n} of 6 areas. An area without enough information is left out of the calculation, so the score may change when you take the diagnosis again.',
    noScoreNote: 'The conversation did not give enough information to calculate a score. This report is based on what was said, and you can complete the picture by taking the diagnosis again.',
    areasTitle: 'Score by area, in order of urgency',
    notAssessed: 'Not assessed',
    notAssessedNote: 'Not enough information to rate',
    urgent: 'Failure point',
    central: 'The central failure point',
    cause: 'Cause',
    basis: 'What this is based on',
    works: "What's working",
    needsWork: "What isn't working",
    fix: 'How to fix it',
    steps: 'Practical steps',
    outcome: 'Deliverable',
    notNow: 'What not to work on right now',
    progress: 'How to track progress',
    progressBody:
      'After you put the steps into practice you can take the diagnosis again. The scale is fixed (version {v}), so a comparison between two diagnoses reflects real change, not a change in how it is measured.',
    method: 'Methodology note',
    methodBody:
      'Scores are computed from a fixed scale of 24 criteria, four in each of six areas, based on what was said in the diagnostic conversation. A criterion without enough information is left out of the calculation. This report is a professional guidance tool and is not a substitute for personal support.',
    appendix: 'Appendix: criteria detail',
    rating: { 2: 'In place', 1: 'Partial', 0: 'Missing' } as Record<number, string>,
    unknown: 'Not assessed',
    bio: 'Dr. Ariel Shapira · Clinical psychologist and founder of TherapyKeys · Helping therapists build a thriving private practice',
  },
};

interface Props {
  report: DiagnosisReport;
  isRTL: boolean;
  displayName?: string | null;
  /** Render the criteria appendix (always true for the PDF). */
  showAppendix?: boolean;
  /** Fixed pixel width for the PDF; fluid when omitted. */
  width?: number;
}

function Section({ title, children, accent, avoid = true }: { title: string; children: ReactNode; accent?: boolean; avoid?: boolean }) {
  return (
    <section className={avoid ? 'dr-avoid' : undefined} style={{ marginTop: 22 }}>
      <h2
        style={{
          margin: '0 0 10px',
          paddingBottom: 6,
          borderBottom: `2px solid ${accent ? C.terracotta : C.burgundy}`,
          fontFamily: "'Miriam Libre','Assistant',sans-serif",
          fontSize: 17,
          fontWeight: 700,
          color: accent ? C.terracotta : C.burgundy,
        }}
      >
        {title}
      </h2>
      {children}
    </section>
  );
}

// Bullets are a flex row (marker, then text) rather than <ul>/<ol>: in RTL the
// marker sits on the right next to the text, instead of the list numbers
// drifting to the left edge as they did with the previous <ol>-based PDF.
function Bullet({ marker, children, markerStyle }: { marker: ReactNode; children: ReactNode; markerStyle?: CSSProperties }) {
  return (
    <div className="dr-avoid" style={{ display: 'flex', gap: 10, alignItems: 'flex-start', margin: '0 0 8px' }}>
      <div
        style={{
          flex: '0 0 auto',
          minWidth: 22,
          height: 22,
          marginTop: 1,
          borderRadius: 11,
          background: C.burgundy,
          color: '#fff',
          fontSize: 12,
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          paddingBottom: 2,
          boxSizing: 'border-box',
          ...markerStyle,
        }}
      >
        {marker}
      </div>
      <div style={{ flex: '1 1 auto', minWidth: 0, fontSize: 14, lineHeight: 1.65, color: C.ink }}>{children}</div>
    </div>
  );
}

const Dot = ({ color }: { color: string }) => (
  <span style={{ display: 'inline-block', width: 7, height: 7, borderRadius: 4, background: color, margin: '7px 7px 0' }} />
);

function ratingColor(r: ReportRating): string {
  return r === 2 ? '#33704f' : r === 1 ? '#a8661f' : r === 0 ? '#9e2b25' : '#9a918a';
}

export const DiagnosisReportDocument = forwardRef<HTMLDivElement, Props>(function DiagnosisReportDocument(
  { report, isRTL, displayName, showAppendix = false, width },
  ref,
) {
  const t = isRTL ? T.he : T.en;
  const dir = isRTL ? 'rtl' : 'ltr';
  const areaLabel = (key: string) => report.areas.find((a) => a.area === key)?.label ?? '';
  const ordered = report.priorityOrder.length
    ? report.priorityOrder.map((k) => report.areas.find((a) => a.area === k)).filter((a): a is NonNullable<typeof a> => !!a)
    : report.areas;
  const band = report.overallBand ? BAND_META[report.overallBand] : null;
  const dateStr = report.generatedAt
    ? new Date(report.generatedAt).toLocaleDateString(isRTL ? 'he-IL' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' })
    : '';

  return (
    <div
      ref={ref}
      dir={dir}
      lang={isRTL ? 'he' : 'en'}
      style={{
        width: width ?? '100%',
        boxSizing: 'border-box',
        background: '#ffffff',
        color: C.ink,
        fontFamily: "'Assistant','Segoe UI',sans-serif",
        textAlign: isRTL ? 'right' : 'left',
        paddingBottom: width ? 24 : 0,
      }}
    >
      {/* Letterhead */}
      <header
        className="dr-avoid"
        style={{ display: 'flex', alignItems: 'center', gap: 16, paddingBottom: 14, borderBottom: `3px solid ${C.burgundy}` }}
      >
        {CLINIC_LOGO_SRC ? (
          <img src={CLINIC_LOGO_SRC} alt="" style={{ height: 120, width: "auto", flex: "0 0 auto" }} crossOrigin="anonymous" />
        ) : (
          <div
            style={{
              flex: '0 0 auto',
              width: 64,
              height: 64,
              borderRadius: 32,
              border: `2px solid ${C.burgundy}`,
              color: C.burgundy,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: "'Miriam Libre',serif",
              fontSize: 11,
              fontWeight: 700,
              textAlign: 'center',
              lineHeight: 1.2,
              padding: 6,
            }}
          >
            {isRTL ? 'על שפת הקליניקה' : 'On the Language of the Clinic'}
          </div>
        )}
        <div style={{ flex: '1 1 auto', minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: isRTL ? 0 : 0.6, color: C.terracotta }}>{t.caption}</div>
          <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{t.brand}</div>
          <h1
            style={{
              margin: '8px 0 0',
              fontFamily: "'Miriam Libre','Assistant',sans-serif",
              fontSize: 24,
              lineHeight: 1.25,
              fontWeight: 700,
              color: C.burgundy,
            }}
          >
            {t.title}
          </h1>
        </div>
      </header>

      <div className="dr-avoid" style={{ display: 'flex', gap: 18, flexWrap: 'wrap', margin: '10px 0 0', fontSize: 12, color: C.muted }}>
        {displayName ? (
          <span>
            {t.preparedFor}: <strong style={{ color: C.ink }}>{displayName}</strong>
          </span>
        ) : null}
        {dateStr ? (
          <span>
            {t.date}: <strong style={{ color: C.ink }}>{dateStr}</strong>
          </span>
        ) : null}
      </div>

      {/* Anchor score */}
      <section
        className="dr-avoid"
        style={{ marginTop: 18, background: C.cream, border: `1px solid ${C.line}`, borderRadius: 10, padding: 16 }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}>
          <div style={{ textAlign: 'center', flex: '0 0 auto', minWidth: 110 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.muted }}>{t.scoreTitle}</div>
            <div
              style={{ fontFamily: "'Miriam Libre',serif", fontSize: 46, fontWeight: 700, lineHeight: 1.25, color: band?.color ?? C.ink }}
              dir="ltr"
            >
              {formatScore(report.overall)}
            </div>
            <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>{t.outOf}</div>
          </div>
          <div style={{ flex: '1 1 220px', minWidth: 0 }}>
            {band && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '4px 12px 6px',
                  borderRadius: 14,
                  background: band.tint,
                  color: band.color,
                  fontSize: 13,
                  fontWeight: 700,
                }}
              >
                {isRTL ? band.he : band.en}
              </span>
            )}
            <p style={{ margin: '8px 0 0', fontSize: 13, lineHeight: 1.6, color: C.muted }}>{t.scoreNote}</p>
            {report.scoredAreas < 6 && (
              <p style={{ margin: '6px 0 0', fontSize: 12, lineHeight: 1.6, color: C.terracotta }}>
                {report.scoredAreas === 0 ? t.noScoreNote : t.partialNote.replace('{n}', String(report.scoredAreas))}
              </p>
            )}
          </div>
        </div>

        <h3 style={{ margin: '16px 0 8px', fontSize: 13, fontWeight: 700, color: C.burgundy }}>{t.areasTitle}</h3>
        <div>
          {ordered.map((a, i) => {
            const b = a.band ? BAND_META[a.band] : null;
            const isCentral = a.area === report.centralFailure.area;
            return (
              <div
                key={a.area}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '5px 0', borderTop: i ? `1px solid ${C.line}` : 'none' }}
              >
                <div style={{ flex: '0 0 138px', fontSize: 13, fontWeight: isCentral ? 700 : 500, color: C.ink }}>
                  {a.label}
                  {isCentral && (
                    <div style={{ fontSize: 11, fontWeight: 700, color: C.terracotta }}>{t.urgent}</div>
                  )}
                </div>
                <div style={{ flex: '1 1 auto', height: 9, borderRadius: 5, background: C.track, position: 'relative', overflow: 'hidden' }} dir="ltr">
                  {a.score !== null && b && (
                    <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${((a.score - 1) / 9) * 100}%`, minWidth: 6, background: b.color, borderRadius: 5 }} />
                  )}
                </div>
                <div style={{ flex: '0 0 auto', width: 64, textAlign: isRTL ? 'left' : 'right', fontSize: 13, fontWeight: 700, color: b?.color ?? C.muted }} dir="ltr">
                  {a.score === null ? (
                    <span style={{ fontWeight: 400, fontSize: 11 }}>{t.notAssessed}</span>
                  ) : (
                    formatScore(a.score)
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Central failure */}
      <Section title={t.central} accent>
        <p style={{ margin: '0 0 8px', fontSize: 16, lineHeight: 1.6, fontWeight: 700, color: C.ink }}>
          {report.centralFailure.statement}
        </p>
        {areaLabel(report.centralFailure.area) && (
          <p style={{ margin: '0 0 8px', fontSize: 12, color: C.terracotta, fontWeight: 700 }}>{areaLabel(report.centralFailure.area)}</p>
        )}
        {report.centralFailure.cause && (
          <p style={{ margin: '0 0 8px', fontSize: 14, lineHeight: 1.65 }}>
            <strong>{t.cause}: </strong>
            {report.centralFailure.cause}
          </p>
        )}
        {report.centralFailure.evidence.length > 0 && (
          <div style={{ marginTop: 6 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.muted, marginBottom: 4 }}>{t.basis}</div>
            {report.centralFailure.evidence.map((e, i) => (
              <div key={i} className="dr-avoid" style={{ display: 'flex', gap: 4, fontSize: 13, lineHeight: 1.6, color: C.muted, margin: '0 0 3px' }}>
                <Dot color={C.terracotta} />
                <span style={{ flex: 1 }}>{e}</span>
              </div>
            ))}
          </div>
        )}
      </Section>

      {report.works.length > 0 && (
        <Section title={t.works}>
          {report.works.map((w, i) => (
            <Bullet key={i} marker="✓" markerStyle={{ background: '#33704f' }}>
              {w}
            </Bullet>
          ))}
        </Section>
      )}

      {report.needsWork.length > 0 && (
        <Section title={t.needsWork}>
          {report.needsWork.map((n, i) => (
            <Bullet key={i} marker="!" markerStyle={{ background: '#9e2b25' }}>
              {n.area && areaLabel(n.area) ? (
                <span style={{ color: C.terracotta, fontWeight: 700 }}>{areaLabel(n.area)}: </span>
              ) : null}
              {n.point}
            </Bullet>
          ))}
        </Section>
      )}

      {report.fixApproach.length > 0 && (
        <Section title={t.fix}>
          {report.fixApproach.map((f, i) => (
            <Bullet key={i} marker="←" markerStyle={{ background: C.terracotta, transform: isRTL ? undefined : 'scaleX(-1)' }}>
              {f}
            </Bullet>
          ))}
        </Section>
      )}

      <Section title={t.steps}>
        {report.actionSteps.map((s, i) => (
          <Bullet key={i} marker={i + 1}>
            <div style={{ fontWeight: 600 }}>{s.step}</div>
            {s.outcome && (
              <div style={{ fontSize: 13, color: C.muted, marginTop: 2 }}>
                <strong>{t.outcome}: </strong>
                {s.outcome}
              </div>
            )}
          </Bullet>
        ))}
      </Section>

      {report.notNow.length > 0 && (
        <Section title={t.notNow}>
          {report.notNow.map((n, i) => (
            <Bullet key={i} marker="–" markerStyle={{ background: '#9a918a' }}>
              <span style={{ fontWeight: 600 }}>{n.item}</span>
              {n.reason ? <span style={{ color: C.muted }}> · {n.reason}</span> : null}
            </Bullet>
          ))}
        </Section>
      )}

      <Section title={t.progress}>
        <p style={{ margin: 0, fontSize: 14, lineHeight: 1.7 }}>{t.progressBody.replace('{v}', String(report.rubricVersion))}</p>
      </Section>

      {/* html2pdf starts a new page at this marker; it has no height on screen. The appendix always begins on its own page so its heading never sits alone at the bottom of one. */}
      {showAppendix && report.ratings.length > 0 && <div className="html2pdf__page-break" style={{ height: 0 }} />}
      {showAppendix && report.ratings.length > 0 && (
        <Section title={t.appendix} avoid={false}>
          {report.areas.map((a) => {
            const items = report.ratings.filter((r) => r.area === a.area);
            if (!items.length) return null;
            return (
              <div key={a.area} className="dr-avoid" style={{ margin: '0 0 12px' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.burgundy, marginBottom: 4 }}>
                  {a.label} ·{' '}
                  <span dir="ltr" style={{ color: a.band ? BAND_META[a.band].color : C.muted }}>
                    {a.score === null ? t.notAssessed : formatScore(a.score)}
                  </span>
                </div>
                {items.map((r) => (
                  <div key={r.id} style={{ display: 'flex', gap: 4, fontSize: 12.5, lineHeight: 1.55, margin: '0 0 2px' }}>
                    <Dot color={ratingColor(r.rating)} />
                    <span style={{ flex: 1 }}>
                      {r.label}
                      <span style={{ color: ratingColor(r.rating), fontWeight: 700 }}> · {r.rating === null ? t.unknown : t.rating[r.rating]}</span>
                      {r.evidence ? <span style={{ color: C.muted }}> ({r.evidence})</span> : null}
                    </span>
                  </div>
                ))}
              </div>
            );
          })}
        </Section>
      )}

      <div className="dr-avoid" style={{ marginTop: 22, padding: '10px 12px', background: C.cream, border: `1px solid ${C.line}`, borderRadius: 8 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: C.burgundy, marginBottom: 2 }}>{t.method}</div>
        <p style={{ margin: 0, fontSize: 12, lineHeight: 1.6, color: C.muted }}>{t.methodBody}</p>
      </div>

      <footer
        className="dr-avoid"
        style={{ marginTop: 18, paddingTop: 10, borderTop: `1px solid ${C.line}`, fontSize: 11, lineHeight: 1.6, color: C.muted, textAlign: 'center' }}
      >
        <div>{t.bio}</div>
        <div dir="ltr" style={{ marginTop: 2 }}>therapykeys.co.il</div>
      </footer>
    </div>
  );
});
