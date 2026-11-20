// The address of an article: a readable slug (Hebrew or English words joined by hyphens) in place of the id.
// Plain TypeScript with no imports, so the same rules run in the admin form, in the edge functions and in the
// one-off backfill that wrote the first slugs.
//
// A slug is stored, not derived: once an article has one it stays the same when the title is edited, so links that
// were already shared keep working. Changing a slug on purpose breaks the old address (the admin form warns).

export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Routes under /contents/ that are pages of their own, never an article.
export const RESERVED_SLUGS = ["admin"];

const MAX_LEN = 60;

export function slugify(title: string): string {
  const s = title
    .normalize("NFKC")
    .replace(/[֑-ׇ]/g, "") // niqqud and cantillation marks
    .replace(/^\s*פוסט\s+/, "") // "פוסט ..." is a label in the admin, not part of the subject
    .replace(/['’׳״"]/g, "") // apostrophes and quotes: it’s -> its, ד"ר -> דר
    .toLowerCase()
    .replace(/(\p{L})(\d)/gu, "$1-$2") // "משקיע2" -> "משקיע-2"
    .replace(/[^\p{L}\p{N}]+/gu, "-") // everything that is not a letter or a digit becomes a separator
    .replace(/^-+|-+$/g, "");
  if (s.length <= MAX_LEN) return s;
  const cut = s.slice(0, MAX_LEN);
  const dash = cut.lastIndexOf("-");
  return (dash > MAX_LEN * 0.5 ? cut.slice(0, dash) : cut).replace(/-+$/, "");
}

// Same rule as the database CHECK: no spaces or URL-special characters, not an id, not a reserved word.
export function isValidSlug(slug: string): boolean {
  return (
    slug.length > 0 &&
    slug.length <= 100 &&
    /^[^\s/?#%\\]+$/.test(slug) &&
    !UUID_RE.test(slug) &&
    !RESERVED_SLUGS.includes(slug)
  );
}

// A free slug for this title: the plain one, or with -2, -3... when it is taken.
export function uniqueSlug(title: string, taken: Iterable<string>): string {
  const used = new Set(taken);
  const base = slugify(title) || "article";
  let slug = base;
  for (let n = 2; used.has(slug) || !isValidSlug(slug); n++) slug = `${base}-${n}`;
  return slug;
}

// The path of an article: its slug when it has one, else its id.
export const contentPath = (c: { id: string; slug?: string | null }): string => `/contents/${c.slug || c.id}`;
