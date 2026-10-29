// Where a challenge sign-up came from, stored in challenge_registrations.source.
//
//   ?src=site          the "האתגר" tab in the site header
//   ?src=lecture[-x]   the link/QR given out at a lecture
//   ?utm_source=facebook&utm_medium=paid&utm_campaign=x  → "paid:facebook:x"
//   no parameter, but arrived from another website      → "ref:<host>"
//   nothing at all (typed the address, WhatsApp, etc.)   → null ("direct")
//
// The first source seen in a browser tab wins, so a visitor who came from an
// ad and then clicked the header tab is still counted as the ad.

const STORAGE_KEY = "challenge_source";
const PAID_MEDIUMS = new Set(["paid", "cpc", "ppc", "paid_social", "paidsocial", "ads", "ad"]);

const clean = (v: string | null) =>
  (v ?? "").trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9_.\-:]/g, "").slice(0, 60);

function fromUrl(params: URLSearchParams): string | null {
  const src = clean(params.get("src"));
  if (src) return src;

  const utmSource = clean(params.get("utm_source"));
  if (utmSource) {
    const medium = clean(params.get("utm_medium"));
    const campaign = clean(params.get("utm_campaign"));
    const base = PAID_MEDIUMS.has(medium) ? `paid:${utmSource}` : utmSource;
    return campaign ? `${base}:${campaign}` : base;
  }

  try {
    if (document.referrer) {
      const host = new URL(document.referrer).hostname.replace(/^www\./, "");
      if (host && host !== location.hostname.replace(/^www\./, "")) return `ref:${host}`;
    }
  } catch {
    // ignore malformed referrer
  }
  return null;
}

export function resolveChallengeSource(params: URLSearchParams): string | null {
  let stored: string | null = null;
  try {
    stored = sessionStorage.getItem(STORAGE_KEY);
  } catch {
    // storage blocked: fall back to the URL only
  }
  if (stored) return stored;

  const source = fromUrl(params);
  if (source) {
    try {
      sessionStorage.setItem(STORAGE_KEY, source);
    } catch {
      // ignore
    }
  }
  return source;
}

// crypto.randomUUID is missing in some older in-app browsers.
export function randomId(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return Math.random().toString(36).slice(2) + Date.now().toString(36);
  }
}

/**
 * A random id kept in this browser, used only to count distinct visitors
 * (nothing identifying). Null when storage is blocked.
 */
export function challengeVisitorId(): string | null {
  try {
    let id = localStorage.getItem("challenge_visitor_id");
    if (!id) {
      id = randomId();
      localStorage.setItem("challenge_visitor_id", id);
    }
    return id;
  } catch {
    return null;
  }
}

/** True the first time it is called for this challenge in this browser tab. */
export function firstViewInTab(challengeKey: string): boolean {
  const key = `challenge_view_logged:${challengeKey}`;
  try {
    if (sessionStorage.getItem(key)) return false;
    sessionStorage.setItem(key, "1");
    return true;
  } catch {
    return true;
  }
}

export type SourceGroup = "site" | "lecture" | "paid" | "referral" | "direct" | "other";

export const SOURCE_GROUP_LABELS: Record<SourceGroup, string> = {
  site: "מהאתר",
  lecture: "מתנת ההרצאה",
  paid: "פרסום ממומן",
  referral: "הפניה מאתר אחר",
  direct: "ישיר (בלי מקור)",
  other: "אחר",
};

export function sourceGroup(source: string | null): SourceGroup {
  if (!source) return "direct";
  if (source === "site") return "site";
  if (source.startsWith("lecture")) return "lecture";
  if (source.startsWith("paid:")) return "paid";
  if (source.startsWith("ref:")) return "referral";
  return "other";
}
