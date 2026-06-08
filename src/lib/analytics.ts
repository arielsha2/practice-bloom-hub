// Lightweight analytics wrapper: routes events to GA4 (gtag) and Microsoft Clarity.
// Safe no-op when scripts aren't loaded (e.g. local dev, ad-blockers).

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    clarity?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

export type TrackProps = Record<string, string | number | boolean | undefined>;

/**
 * Track a named event in GA4 and Clarity.
 * @example trackEvent("cta_whatsapp_click", { location: "homepage_banner" })
 */
export function trackEvent(name: string, props: TrackProps = {}) {
  const payload = {
    page_path: typeof location !== "undefined" ? location.pathname + location.search : "",
    ...props,
  };
  try {
    window.gtag?.("event", name, payload);
  } catch (e) {
    // swallow
  }
  try {
    window.clarity?.("event", name);
    // attach a key custom tag for segmentation in Clarity (max 128 chars)
    if (props.location) {
      window.clarity?.("set", "last_cta", String(props.location));
    }
  } catch (e) {
    // swallow
  }
}

/** Identify a logged-in user across GA4 and Clarity (hash before calling if PII-sensitive). */
export function identifyUser(userId: string) {
  try {
    window.gtag?.("set", { user_id: userId });
  } catch (_) {}
  try {
    window.clarity?.("identify", userId);
  } catch (_) {}
}
