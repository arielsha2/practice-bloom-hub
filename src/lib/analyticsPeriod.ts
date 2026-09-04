import type { AnalyticsPeriod } from "@/hooks/useAdminAnalytics";

// Same rolling-window convention as admin-analytics/index.ts's periodToDays —
// duplicated here rather than shared across the client/edge-function
// boundary, mirroring how small enums are already duplicated elsewhere in
// this codebase (e.g. STUCK_CATEGORIES).
const PERIOD_DAYS: Record<AnalyticsPeriod, number> = { "1d": 1, "7d": 7, "30d": 30, "90d": 90 };

export function periodToSince(period: AnalyticsPeriod): string {
  return new Date(Date.now() - PERIOD_DAYS[period] * 24 * 60 * 60 * 1000).toISOString();
}
