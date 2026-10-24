// Shape of `therapist_journeys.diagnosis_output.report` (and diagnosis_results.report),
// written by the bot-extract-output edge function. Scores are computed there from a
// fixed rubric; this file only reads them, defensively, since the JSON is untrusted
// input as far as the type system goes (older diagnoses have no report at all).

export type ScoreBand = 'immediate' | 'improve' | 'strong';
export type ReportRating = 0 | 1 | 2 | null;

export interface ReportAreaScore {
  area: string;
  label: string;
  score: number | null;
  band: ScoreBand | null;
  known: number;
  total: number;
}

export interface ReportRatingItem {
  id: string;
  area: string;
  label: string;
  rating: ReportRating;
  evidence: string;
}

export interface DiagnosisReport {
  rubricVersion: number;
  language: 'he' | 'en';
  generatedAt: string;
  overall: number | null;
  overallBand: ScoreBand | null;
  /** How many of the six areas had enough information to be scored. */
  scoredAreas: number;
  areas: ReportAreaScore[];
  priorityOrder: string[];
  ratings: ReportRatingItem[];
  works: string[];
  needsWork: Array<{ area: string; point: string }>;
  centralFailure: { area: string; statement: string; cause: string; evidence: string[] };
  fixApproach: string[];
  futurePicture: string[];
  actionSteps: Array<{ step: string; outcome: string }>;
  notNow: Array<{ item: string; reason: string }>;
}

const BANDS: ScoreBand[] = ['immediate', 'improve', 'strong'];

const asString = (v: unknown): string => (typeof v === 'string' ? v : '');
const asObject = (v: unknown): Record<string, unknown> =>
  v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
const asArray = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);
const asBand = (v: unknown): ScoreBand | null => (BANDS.includes(v as ScoreBand) ? (v as ScoreBand) : null);
const asScore = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) ? v : null);
const strings = (v: unknown): string[] => asArray(v).map(asString).filter(Boolean);

export function parseDiagnosisReport(raw: unknown): DiagnosisReport | null {
  const r = asObject(raw);
  const scores = asObject(r.scores);
  const cf = asObject(r.central_failure);
  const areas: ReportAreaScore[] = asArray(scores.areas).map((x) => {
    const a = asObject(x);
    return {
      area: asString(a.area),
      label: asString(a.label),
      score: asScore(a.score),
      band: asBand(a.band),
      known: typeof a.known === 'number' ? a.known : 0,
      total: typeof a.total === 'number' ? a.total : 0,
    };
  }).filter((a) => a.area && a.label);

  const steps = asArray(r.action_steps).map((x) => {
    const e = asObject(x);
    return { step: asString(e.step), outcome: asString(e.outcome) };
  }).filter((s) => s.step);

  // The same minimum the server enforces: without these the report would be a shell.
  if (!areas.length || !asString(cf.statement) || !steps.length) return null;

  return {
    rubricVersion: typeof r.rubric_version === 'number' ? r.rubric_version : 1,
    language: r.language === 'en' ? 'en' : 'he',
    generatedAt: asString(r.generated_at),
    overall: asScore(scores.overall),
    overallBand: asBand(scores.band),
    scoredAreas: typeof scores.scored_areas === 'number' ? scores.scored_areas : areas.filter((a) => a.score !== null).length,
    areas,
    priorityOrder: strings(r.priority_order),
    ratings: asArray(r.ratings).map((x) => {
      const e = asObject(x);
      const rating = e.rating === 0 || e.rating === 1 || e.rating === 2 ? (e.rating as 0 | 1 | 2) : null;
      return { id: asString(e.id), area: asString(e.area), label: asString(e.label), rating, evidence: asString(e.evidence) };
    }).filter((x) => x.id && x.label),
    works: strings(r.works),
    needsWork: asArray(r.needs_work).map((x) => {
      const e = asObject(x);
      return { area: asString(e.area), point: asString(e.point) };
    }).filter((x) => x.point),
    centralFailure: {
      area: asString(cf.area),
      statement: asString(cf.statement),
      cause: asString(cf.cause),
      evidence: strings(cf.evidence),
    },
    fixApproach: strings(r.fix_approach),
    futurePicture: strings(r.future_picture),
    actionSteps: steps,
    notNow: asArray(r.not_now).map((x) => {
      const e = asObject(x);
      return { item: asString(e.item), reason: asString(e.reason) };
    }).filter((x) => x.item),
  };
}

export const BAND_META: Record<ScoreBand, { he: string; en: string; color: string; tint: string }> = {
  immediate: { he: 'כדאי להתחיל כאן', en: 'A good place to start', color: '#9e2b25', tint: '#f6e4e1' },
  improve: { he: 'יש בסיס לבנות עליו', en: 'A base to build on', color: '#a8661f', tint: '#f7ecdc' },
  strong: { he: 'חזק', en: 'Strong', color: '#33704f', tint: '#e0eee6' },
};

export const formatScore = (n: number | null): string => (n === null ? '–' : n.toFixed(1));
