// A best-effort guess of how to write about someone from the first name they gave at sign-up. It is only
// ever a PROPOSAL: the tool shows what it assumed ("כתבנו עלייך בלשון נקבה, לפי השם") and lets the person change
// it, and when the name is ambiguous or unknown it asks instead of guessing. Names that are used for both
// genders (יובל, נועם, עמית, שחר, ...) are deliberately absent, so they are never guessed.

const FEMALE = new Set(
  `אביבה אביגיל אגמית אורית אורנה אורלי אילנה אילת אלה אלינור אליענה אסנת אסתר אפרת ארנה איריס אתי בלה בתיה בת-שבע ברכה גאיה גילה גלית דבורה דורית דליה דנה דניאלה דפנה דינה הגר הדס הילה הילית זהבה חגית חוה חיה חנה טובה טלי יעל יפעת יפה כרמית לאה ליאת לילך לימור מאיה מורן מירב מיטל מירי מיה מיכל מלכה מרים נגה נועה נורית נטלי נעמי סיגל סיגלית סיון ספיר עדנה ענת עינת פנינה צילה קלרה רבקה רות רחל רינה רונית רותי שולמית שושנה שירה שירלי שלומית שרה שרית תהילה תמי תמר תקווה אורטל`
    .split(/\s+/),
);

const MALE = new Set(
  `אבי אבנר אברהם אהרון אופיר איתי איתן אלון אמיר אמנון אסף ארז אריה גדי גיא גלעד גיורא דוד דן דני דניאל דרור הלל זאב חגי חיים חנן יהודה יהושע יואב יוגב יוסי יוסף יוני יונתן יורם יניב יעקב יצחק ירון ישראל מאיר מוטי מיכאל מנחם משה נדב נחום נתן ניר סער עוז עידו עמוס עמרי עופר ערן פיני צבי צחי קובי רועי רונן רמי רן רפאל שגיא שלמה שמואל שמעון תומר תמיר בועז בנימין ברוך`
    .split(/\s+/),
);

const TITLES = /^(ד["״']?ר|דר|פרופ['׳]?|פרופסור|מר|גב['׳]?|גברת)\.?$/;

export function firstNameOf(fullName: string | null | undefined): string {
  const parts = (fullName ?? "")
    .replace(/[,()]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .filter((p) => !TITLES.test(p));
  return parts[0] ?? "";
}

export type NameGender = "f" | "m";

export function guessGender(fullName: string | null | undefined): NameGender | null {
  const first = firstNameOf(fullName);
  if (!first || /[@\d]/.test(first)) return null; // an e-mail address or initials say nothing
  if (FEMALE.has(first)) return "f";
  if (MALE.has(first)) return "m";
  return null;
}

// A registered "name" that is really an e-mail address or a single letter is not a name to show on a card.
export function usableName(fullName: string | null | undefined): string {
  const n = (fullName ?? "").trim();
  if (!n || /@/.test(n) || n.replace(/[\s.]/g, "").length < 2) return "";
  return n;
}
