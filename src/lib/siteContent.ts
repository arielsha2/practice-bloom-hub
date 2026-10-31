import { SITE_STYLES, type SiteFaq, type SiteStyle, type SiteView } from '@/components/site/TherapistSite';

// The content of a page built by the wizard, as stored in therapist_websites.content (jsonb). Pages made by the
// older builder have no `style` and keep the older template.
export interface StoredSite {
  style: SiteStyle;
  fullName: string;
  title: string;
  avatarUrl?: string;
  keyPhrase: string;
  heroLine?: string;
  about: string;
  forYouIf: string[];
  firstSession: string[];
  faq: SiteFaq[];
  contactLine?: string;
  phone?: string;
  email?: string;
  location?: string;
  confirmedAt?: string; // when the therapist approved the words
}

export function isWizardSite(c: unknown): c is StoredSite {
  const s = (c as { style?: unknown } | null)?.style;
  return typeof s === 'string' && (SITE_STYLES as string[]).includes(s);
}

export function toSiteView(c: StoredSite, calendarLink?: string | null): SiteView {
  return {
    fullName: c.fullName,
    title: c.title,
    avatarUrl: c.avatarUrl || undefined,
    keyPhrase: c.keyPhrase,
    heroLine: c.heroLine,
    about: c.about,
    forYouIf: c.forYouIf.filter(Boolean),
    firstSession: c.firstSession.filter(Boolean),
    faq: c.faq,
    contactLine: c.contactLine,
    phone: c.phone,
    email: c.email,
    location: c.location,
    calendarLink: calendarLink || undefined,
  };
}

// Hebrew letters to Latin for the page address.
export function romanize(s: string): string {
  const map: Record<string, string> = {
    'א': 'a', 'ב': 'b', 'ג': 'g', 'ד': 'd', 'ה': 'h', 'ו': 'v', 'ז': 'z', 'ח': 'ch', 'ט': 't', 'י': 'y', 'כ': 'k', 'ך': 'k',
    'ל': 'l', 'מ': 'm', 'ם': 'm', 'נ': 'n', 'ן': 'n', 'ס': 's', 'ע': 'a', 'פ': 'p', 'ף': 'f', 'צ': 'tz', 'ץ': 'tz', 'ק': 'k',
    'ר': 'r', 'ש': 'sh', 'ת': 't',
  };
  return (
    s
      .replace(/^(ד["״]ר|דר)\s*/, '')
      .split('')
      .map((c) => map[c] ?? c)
      .join('')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'therapist'
  );
}
