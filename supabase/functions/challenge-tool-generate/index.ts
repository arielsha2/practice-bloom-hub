// The free challenge tools. Tool "professional-card": four short questions about ONE person whose life the
// therapist's work changed (who, and what happened when they reached out; what they asked for and what lay beneath
// it; what changed after a few months; what was different in the therapist's way). action "reflect" returns Neri's
// one-sentence mirror of an answer (and, rarely, one follow-up question); the default action writes three versions
// of "אני עוזר ל__ ל__", a line that defines the niche and a line on the therapist's own way. The system owns everything that is structure (the
// first-person opening by the therapist's gender, the word limits, the banned words, the checks); the model only
// phrases. Stored in therapist_deliverables (tool = 'professional-card'), one new version per run.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ===== ai provider: begin =====
// Identical block in every function that calls an AI model (separate edge functions, no shared module in the
// deploy path) — keep the copies in step.
//
// aiFetch is a drop-in for fetch() on the Lovable AI gateway URL. When the GEMINI_API_KEY secret exists the call
// goes to Google's Gemini API directly (OpenAI-compatible endpoint, same request and response format; only the
// URL, the key and the model name differ), and ANY failure there falls back to the gateway call that was
// originally asked for: a model Google rejected once took the mentor down (incident 2026-08-03), and the
// gateway can run out of credits (402), so neither path may be the only one.
//
// Google retires models for new keys without notice ("no longer available to new users": the whole 2.5 family
// was retired by 2026-10), so the names stored in the database (google/gemini-2.5-flash, ...) are translated
// through GEMINI_MODEL_MAP; a name Google still does not know (400 / 404) is retried once with the always-current
// alias before giving up on Google. Update the map when Google retires another model.
const GEMINI_CHAT_URL = "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";
const GEMINI_FALLBACK_MODEL = "gemini-flash-latest";
const GEMINI_MODEL_MAP: Record<string, string> = {
  "google/gemini-2.5-flash": "gemini-3.8-flash",
  "google/gemini-2.5-flash-lite": "gemini-3.1-flash-lite",
  "google/gemini-2.5-pro": "gemini-3.1-pro-preview",
  "google/gemini-3-flash-preview": "gemini-3-flash-preview",
};

// The retired 2.5-flash answered fast; its 3.x replacement thinks first (about 7 s to the first word on
// gemini-3.8-flash, about 2.8 s with reasoning_effort "low"), so requests that asked for it are sent with "low"
// unless they set their own effort. Models that were already 3.x (the diagnosis) are left exactly as they were.
const GEMINI_LOW_EFFORT_FOR = new Set(["google/gemini-2.5-flash"]);

async function aiFetch(url: string, init: RequestInit): Promise<Response> {
  const geminiKey = Deno.env.get("GEMINI_API_KEY");
  if (geminiKey && typeof init.body === "string") {
    try {
      const body = JSON.parse(init.body) as Record<string, unknown>;
      const asked = String(body.model ?? "");
      const effort = GEMINI_LOW_EFFORT_FOR.has(asked) && body.reasoning_effort === undefined ? { reasoning_effort: "low" } : {};
      const call = (model: string) =>
        fetch(GEMINI_CHAT_URL, {
          ...init,
          headers: { ...(init.headers as Record<string, string>), Authorization: `Bearer ${geminiKey}` },
          body: JSON.stringify({ ...body, ...effort, model }),
        });
      const model = GEMINI_MODEL_MAP[asked] ?? (asked.replace(/^google\//, "") || GEMINI_FALLBACK_MODEL);
      let res = await call(model);
      if (!res.ok && (res.status === 400 || res.status === 404) && model !== GEMINI_FALLBACK_MODEL) {
        res = await call(GEMINI_FALLBACK_MODEL);
      }
      if (res.ok) return res;
      console.error("gemini direct failed, falling back to the gateway:", res.status, (await res.text().catch(() => "")).slice(0, 200));
    } catch (e) {
      console.error("gemini direct threw, falling back to the gateway:", e instanceof Error ? e.message : String(e));
    }
  }
  return fetch(url, init);
}
// ===== ai provider: end =====

// ===== core: begin =====
export type Tool = "professional-card";
export const TOOLS: Tool[] = ["professional-card"];
export const DAILY_LIMIT = 8;
export const DAILY_REFLECT_LIMIT = 120;

export type Gender = "f" | "m" | "n";

// The therapist's own first-person opening, chosen by code from the therapist's gender (never by the model, never
// asked: the page guesses it from the account name and sends "n" when the name says nothing).
export const LEADS: Record<Gender, string> = { f: "אני עוזרת", m: "אני עוזר", n: "אני כאן כדי לעזור" };

export const TAGS = ["לפי הקהל", "לפי הקושי", "לפי השינוי"] as const;

// What the therapist calls the people who come to them (one tap on the page); the model uses the same word.
export const CLIENT_WORDS = ["מטופלים", "לקוחות", "מתאמנים"] as const;
export type ClientWord = (typeof CLIENT_WORDS)[number];

// On the professional card itself professional words are right ("טיפול", "ליווי", "הדרכת הורים"); only empty
// clichés are kept out of it.
export const CARD_CLICHES = ["מרחב בטוח", "מקום בטוח", "מסע", "בגובה העיניים", "קרקע יציבה", "לצעוד יחד", "להחזיק מקום", "העצמה", "הגשמה"];
const WORK_KIND: Record<string, string> = { "מטופלים": "טיפול", "לקוחות": "ייעוץ", "מתאמנים": "אימון" };

// Words that keep a person at a distance: professional terms and vague abstractions the client would not use
// about himself. They are also flagged for the therapist in the card they review (client side, same list).
export const JARGON = ["ויסות", "דפוסים", "מרחב בטוח", "מרחב", "העצמה", "כלים", "חיבור", "תהליך", "ליווי"];
export const BANNED = ["מרחב בטוח", "מקום בטוח", "מסע", "בגובה העיניים", "קרקע יציבה", "ליווי מקצועי ואישי", "לצעוד יחד", "להחזיק מקום", ...JARGON];

const SLASH = /[֐-׿][/(][֐-׿]{1,3}\)?/;
const words = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;
const norm = (s: string) => s.replace(/[^֐-׿a-z0-9]/gi, "");
const hebrewStem = (w: string) => w.replace(/[^֐-׿]/g, "").replace(/^[ומהבלכש]{1,2}(?=.{3,})/, "");
const STOP = new Set(["אחרי", "שהם", "שהוא", "שהיא", "אני", "עוזר", "עוזרת", "מלווה", "מרגישים", "מרגיש", "מרגישות", "כמו", "גם", "כל", "עם", "בלי", "אבל", "זה", "זו", "את", "של", "על"]);
const stems = (s: string) => new Set(s.split(/\s+/).map(hebrewStem).filter((w) => w.length >= 3 && !STOP.has(w)));

// The four questions, in the order the page asks them (the path of Eliana's card prompt: who, what was asked and
// what lay beneath it, where to, and the therapist's own way). Kept here too so the model sees the exact wording.
export const QUESTIONS = [
  "אדם אחד שהיה לך ממש טוב לעבוד איתו, ושהיית רוצה שיגיעו אליך עוד רבים כמוהו: מי הוא, ומה קרה בחייו ברגע שפנה אליך?",
  "מה הוא ביקש, ומה היה באמת מתחת לבקשה?",
  "מה השתנה אצלו אחרי כמה חודשים? מה שמו לב האנשים סביבו?",
  "אם היינו רואים רגע אחד מהעבודה הזו, איזה רגע היה עוזר לנו להבין איך זה לעבוד איתך? האם יש לך סיפור על התערבות משמעותית שעשית?",
];
export const ANSWER_COUNT = QUESTIONS.length;

export interface Input {
  answers: string[];
  gender: Gender;
  clientWord: ClientWord;
  source: string | null;
}
export interface Missing { index: number; hint: string }

const MIN_WORDS = 4;
const HINTS = [
  "תארו אדם אחד: באיזה שלב בחיים הוא היה, ומה קרה ברגע שפנה.",
  "מה הוא ביקש במילים שלו, ומה היה מתחת לבקשה?",
  "מה השתנה ביום רגיל שלו, ומה שמו לב האנשים סביבו?",
  "תארו רגע אחד מהעבודה: מה עשית, ומה קרה אצלו בעקבות זה.",
];

const cleanAnswer = (a: unknown) => (typeof a === "string" ? a.replace(/\s+/g, " ").trim().slice(0, 900) : "");
const parseGender = (g: unknown): Gender => (g === "f" || g === "m" ? g : "n");
const parseClientWord = (w: unknown): ClientWord => (CLIENT_WORDS as readonly string[]).includes(String(w)) ? (w as ClientWord) : "מטופלים";

export function parseInput(body: any): { input: Input } | { error: string } | { missing: Missing[] } {
  const raw = Array.isArray(body?.answers) ? body.answers : null;
  if (!raw || raw.length !== ANSWER_COUNT) return { error: "bad_answers" };
  const answers = raw.map(cleanAnswer);
  const missing: Missing[] = [];
  answers.forEach((a: string, index: number) => {
    if (words(a) < MIN_WORDS) missing.push({ index, hint: HINTS[index] });
  });
  if (missing.length) return { missing };
  const source = typeof body?.source === "string" ? body.source.replace(/[^a-z0-9_.:-]/gi, "").slice(0, 60) || null : null;
  return { input: { answers, gender: parseGender(body?.gender), clientWord: parseClientWord(body?.client_word), source } };
}

// ---------------------------------------------------------------- the short reflection after each answer
// Neri mirrors each answer in one sentence, in the person's own words, and once per question may ask one
// follow-up: when the first answer describes a group or a diagnosis instead of one person in a moment of life, or
// when an answer is apologetic or dismissive of the therapist's own worth. Code decides what is allowed to come
// back; a reply that fails a check is simply dropped and the page goes on with its own fixed line.
export const REFLECT_SYSTEM = `את נרי, מנטורית חמה למטפלים, יועצים ומאמנים. המטפל עונה על ארבע שאלות קצרות כדי לנסח משפט אחד לכרטיס ביקור: למי הוא עוזר, מאיפה ולאן. עכשיו הוא ענה על שאלה אחת, ואת מגיבה בקצרה לפני השאלה הבאה.

פורמט: JSON בלבד: {"mirror": "...", "follow_up": "..."}

mirror: משפט אחד, עד 20 מילים, שמשקף את מה שנאמר, במילים של המטפל עצמו. בלי עצה, בלי פרשנות, בלי שבח ובלי "אני שומעת ש". למשל: "אמא שחזרה לעבודה, וזוגיות שהשתתקה בערבים." דברי על האדם שתואר (הוא, היא, הם), לא על המטפל.

follow_up: בדרך כלל מחרוזת ריקה "". כתבי אותו רק באחד משני המצבים:
1. בשאלה הראשונה בלבד: אם התשובה מתארת קבוצה, אבחנה או נושא ("אנשים עם חרדה", "נשים שרוצות רוגע") ולא אדם אחד ברגע מסוים בחייו. אז שאלה אחת: "מי בדיוק? באיזה רגע בחיים הוא מגיע?" במילים שלך, עד 16 מילים.
2. בכל שאלה: אם התשובה מתנצלת, מקטינה את עצמה או חוששת להיראות ("לא בטוח שזה מיוחד", "יחשבו שאני עף על עצמי"). אז משפט חמלה קצר ותזכורת שהמשפט הזה נועד לשרת את האדם שאפשר הכי לעזור לו, ושאלה אחת. עד 30 מילים.
אם התשובה כבר קונקרטית, follow_up הוא "".

כללי לשון: עברית חמה ומכובדת, לא רחובית ולא שיווקית. לא ידוע אם המטפל גבר או אישה: אל תפני אליו בפועל שמשתנה לפי מגדר (לא "את חושבת", לא "אתה מרגיש"), ובלי לוכסנים. מותר: שלך, אליך, אצלך, ממך, ופעלי עבר בגוף שני (עשית, ראית). אסור להשתמש במילים: ${BANNED.join(", ")}.`;

export function buildReflectUser(step: number, answers: string[], clientWord: ClientWord): string {
  const prior = answers.slice(0, step).map((a, k) => `שאלה ${k + 1}: ${QUESTIONS[k]}\nתשובה: ${a}`).join("\n\n");
  return `המטפל קורא לאנשים שמגיעים אליו "${clientWord}".
${prior ? `\nמה שנאמר עד עכשיו:\n${prior}\n` : ""}
השאלה הנוכחית (שאלה ${step + 1} מתוך ${ANSWER_COUNT}): ${QUESTIONS[step]}
התשובה: ${answers[step]}`;
}


export function validateReflect(obj: any): { mirror: string; follow_up: string } | null {
  if (!obj || typeof obj !== "object") return null;
  const mirror = typeof obj.mirror === "string" ? obj.mirror.trim() : "";
  const follow = typeof obj.follow_up === "string" ? obj.follow_up.trim() : "";
  if (!mirror || words(mirror) > 24) return null;
  const all = `${mirror}\n${follow}`;
  if (BANNED.some((b) => all.includes(b)) || SLASH.test(all) || /[\[\]{}]/.test(all)) return null;
  // Addressing the therapist with a gendered verb ("את חושבת", "ספרי") reads wrong to half of them.
  if (/(^|[\sשו])(את|אתה)\s+(חושב|חושבת|מרגיש|מרגישה|יודע|יודעת|עובד|עובדת|מאמין|מאמינה|רואה)(?=[\s.,?]|$)/.test(all)) return null;
  if (/(^|\s)(חשבי|ספרי|נסי|תארי|שימי|כתבי|דמייני)(?=[\s.,?]|$)/.test(all)) return null;
  const okFollow = follow && words(follow) <= 32 && follow.includes("?") ? follow : "";
  return { mirror, follow_up: okFollow };
}

// ---------------------------------------------------------------- the card
export const SYSTEM = `את נרי, ומנסחת כרטיס ביקור מקצועי: משפט אחד שאומר למי המטפל עוזר, מאיפה ולאן, כך שמי ששומע אותו מבין, מתעניין, ומיד חושב על מישהו שצריך אותו. המטפל ענה על ארבע שאלות על אדם אחד שעבודתו שינתה את חייו: מי הוא ומה קרה בחייו כשפנה, מה ביקש ומה היה מתחת לבקשה, מה השתנה אחרי כמה חודשים, ומה היה שונה בדרך של המטפל.

המשימה: שלוש גרסאות של משפט אחד במבנה "אני עוזר ל[מי] שמתמודדים עם [קושי], ל[מצב רצוי]" (משפט שאומרים בעל פה), שורה אחת שמגדירה את הנישה, שורה אחת שמתארת את הדרך הייחודית של המטפל, ושלוש אפשרויות לניסוח הנישה על כרטיס הביקור המקצועי. את הפתיחה "אני עוזר" אתה לא כותב, הקוד מוסיף אותה לפי המטפל. אתה כותב רק את who ואת change.

פורמט: JSON בלבד, בלי הסבר ובלי markdown:
{"niche_line": "...", "way_line": "...", "card_niches": [{"title": "...", "detail": "..."}, {"title": "...", "detail": "..."}, {"title": "...", "detail": "..."}], "variants": [{"tag": "לפי הקהל", "who": "...", "change": "..."}, {"tag": "לפי הקושי", "who": "...", "change": "..."}, {"tag": "לפי השינוי", "who": "...", "change": "..."}]}

כללים:
1. who ממשיך את "אני עוזר" ומתחיל באות ל' ("לזוגות ...", "לאמהות ..."). הוא אומר מי האנשים ומה הקושי שלהם, בתיאור אחד ברור ולא ברשימה. עד 10 מילים ומסתיים בפסיק.
2. change הוא פועל במקור שמתחיל באות ל' ("לחזור ...", "להרגיש ..."), פעולה אחת ולא רשימה. הוא אומר לאן הם מגיעים, משהו שאפשר לראות בחיים (מתשובה 3). עד 9 מילים ומסתיים בנקודה.
3. המשפט המלא "אני עוזר" + who + change חייב להיות עברית תקינה וטבעית ועד 20 מילים, משפט שאפשר להגיד בנשימה אחת למי ששואל במה אתה עוסק. קצר עדיף על שלם.
   דוגמאות לאורך ולסגנון בלבד, אל תעתיק מהן: "אני עוזר לבני נוער שמתקשים להגיע לבית הספר, לחזור ללמוד בלי כאבי בטן." / "אני עוזר לגברים שנשחקו מהעבודה, לחזור הביתה עם כוח לבני המשפחה."
4. תאר קבוצה של אנשים כמו האדם שתואר, בלשון רבים, ולא את האדם עצמו. בלי שם, בלי גיל מדויק, בלי מקום עבודה ובלי פרט שמזהה אדם. הקושי נשען על מה שהיה מתחת לבקשה (תשובה 2), לא רק על הבקשה.
5. שלוש הגרסאות שונות בזווית: "לפי הקהל" מדגישה מי האנשים, "לפי הקושי" מדגישה מה קשה להם, "לפי השינוי" מדגישה לאן הם מגיעים.
6. השתמש במילים ובתמונות של המטפל. אל תמציא עובדות שלא נאמרו. כתוב במילים של יום יום, כמו שהאדם עצמו היה אומר, בלי מונחים מקצועיים, בלי ז'רגון שיווקי ובלי מילים מופשטות ועמומות. אסור להשתמש במילים: ${BANNED.join(", ")}.
7. בלי לוכסנים ובלי סוגריים, בלי הבטחת ריפוי או תוצאה.
8. niche_line: שורה אחת, עד 20 מילים, שמגדירה את הקבוצה שהאדם מייצג: מי הם, ומה משותף להם. בלי "אני עוזר".
9. way_line: צירוף קצר, עד 10 מילים, שמתאר את הדרך הייחודית של המטפל, כפי שהיא עולה מהרגע או מההתערבות שתוארו בתשובה 4, ומתחיל ב"דרך", "בעזרת" או "בעבודה". למשל: "בעבודה שמתחילה במה שהכי קשה לומר בקול." בלי פועל בגוף ראשון ובלי פנייה לפי מגדר. אל תמציא שיטה שלא נאמרה.
10. לפני שאתה מחזיר, בדוק כל גרסה: האם מי שלא מכיר את התחום מבין אותה? האם היא מעוררת סקרנות? האם השומע יכול לחשוב מיד על מישהו שצריך אותה? אם לא, נסח מחדש.
11. card_niches: הנישה כפי שתופיע על כרטיס ביקור מקצועי, לצד שם המטפל וההכשרה שלו. כאן, בשונה מהמשפט, השפה מקצועית ומדויקת, כמו שמטפל מציג את תחום ההתמחות שלו לעמית או לגורם מפנה. title: תחום ההתמחות, עד 7 מילים, למשל "טיפול רגשי באמהות אחרי לידה" או "אימון למנהלים בשחיקה". detail: שורה אחת, עד 12 מילים, שמפרטת את הקשיים ואת הכיוון, למשל "ריחוק זוגי, עייפות ובדידות בשנה הראשונה להורות". שלוש האפשרויות שונות בזווית (לפי הקהל, לפי הקושי, לפי השינוי). אל תכתוב שיטה, הכשרה או תואר שהמטפל לא אמר (את ההכשרה הוא ממלא בעצמו). בלי פועל בגוף ראשון, בלי לוכסנים ובלי הבטחות. בכרטיס מותר להשתמש במונחים מקצועיים, אבל לא בביטויים שחוקים: ${CARD_CLICHES.join(", ")}.
12. לא ידוע אם המטפל גבר או אישה, ולא ידוע מין האדם שתואר אלא אם זה עולה מהתיאור. אל תנחש: כתוב על האנשים בלשון רבים.`;

export function buildUser(input: Input): string {
  const a = input.answers;
  return `המטפל קורא לאנשים שמגיעים אליו "${input.clientWord}". השתמש במילה הזו אם צריך לכנות אותם. סוג העבודה שלו, לכרטיס: ${WORK_KIND[input.clientWord] ?? "טיפול"}, אלא אם מהתשובות עולה אחרת.

${QUESTIONS.map((q, k) => `תשובה ${k + 1}. ${q}\n${a[k]}`).join("\n\n")}`;
}

export function validateCard(obj: any, answersText: string): string[] {
  const fails: string[] = [];
  if (!obj || typeof obj !== "object") return ["התשובה אינה JSON תקין"];
  const texts: string[] = [];
  const str = (v: unknown, label: string, maxWords: number): string => {
    if (typeof v !== "string" || !v.trim()) { fails.push(`${label} חסר`); return ""; }
    if (words(v) > maxWords) fails.push(`${label} ארוך מדי (מעל ${maxWords} מילים)`);
    texts.push(v);
    return v.trim();
  };
  str(obj.niche_line, "שורת הנישה", 24);
  const way = str(obj.way_line, "שורת הדרך", 12);
  if (way && !/^(דרך|בדרך|בעזרת|בעבודה)/.test(way)) fails.push(`שורת הדרך חייבת להתחיל ב"דרך", "בעזרת" או "בעבודה"`);
  const cn = Array.isArray(obj.card_niches) ? obj.card_niches : [];
  if (cn.length !== 3) fails.push("נדרשות בדיוק שלוש אפשרויות לנישה בכרטיס");
  const cardTexts: string[] = [];
  cn.forEach((c: any, i: number) => {
    const title = typeof c?.title === "string" ? c.title.trim() : "";
    const detail = typeof c?.detail === "string" ? c.detail.trim() : "";
    if (!title) fails.push(`נישה לכרטיס ${i + 1}: title חסר`);
    else if (words(title) > 8) fails.push(`נישה לכרטיס ${i + 1}: title ארוך מדי (מעל 8 מילים)`);
    if (!detail) fails.push(`נישה לכרטיס ${i + 1}: detail חסר`);
    else if (words(detail) > 14) fails.push(`נישה לכרטיס ${i + 1}: detail ארוך מדי (מעל 14 מילים)`);
    if (/(^|\s)(אני|אנחנו)(\s|$)/.test(`${title} ${detail}`)) fails.push(`נישה לכרטיס ${i + 1}: בלי גוף ראשון`);
    cardTexts.push(title, detail);
  });
  const cardAll = cardTexts.join("\n");
  for (const b of CARD_CLICHES) if (cardAll.includes(b)) fails.push(`ביטוי שחוק בכרטיס: ${b}`);
  if (new Set(cn.map((c: any) => norm(String(c?.title ?? "")))).size < cn.length) fails.push("יש אפשרויות כפולות לנישה בכרטיס");
  const vs = Array.isArray(obj.variants) ? obj.variants : [];
  if (vs.length !== 3) fails.push("נדרשות בדיוק שלוש גרסאות");
  const full: string[] = [];
  vs.forEach((v: any, i: number) => {
    const who = str(v?.who, `גרסה ${i + 1}: who`, 12);
    const change = str(v?.change, `גרסה ${i + 1}: change`, 11);
    if (who && change && words(who) + words(change) > 18) fails.push(`גרסה ${i + 1}: המשפט ארוך מדי לכרטיס (מעל 18 מילים בשני החלקים)`);
    if (who && !who.startsWith("ל")) fails.push(`גרסה ${i + 1}: who חייב להתחיל באות ל'`);
    if (change && !change.startsWith("ל")) fails.push(`גרסה ${i + 1}: change חייב להיות פועל במקור שמתחיל באות ל'`);
    if (who && !/,$/.test(who)) fails.push(`גרסה ${i + 1}: who חייב להסתיים בפסיק`);
    if (change && !/[.]$/.test(change)) fails.push(`גרסה ${i + 1}: change חייב להסתיים בנקודה`);
    if (v?.tag !== TAGS[i]) fails.push(`גרסה ${i + 1}: התווית חייבת להיות "${TAGS[i]}"`);
    full.push(`${who} ${change}`);
  });
  if (new Set(full.map(norm)).size < full.length) fails.push("יש גרסאות כפולות");
  const all = texts.join("\n");
  for (const b of BANNED) if (all.includes(b)) fails.push(`ביטוי שאסור להשתמש בו: ${b}`);
  const everything = `${all}\n${cardAll}`;
  if (SLASH.test(everything)) fails.push("צורת מגדר עם לוכסן או סוגריים");
  if (/[\[\]()]/.test(everything)) fails.push("סוגריים אסורים");
  if (/@|https?:|www\./i.test(everything) || /\d{7,}/.test(everything)) fails.push("פרט קשר או כתובת בתוך הניסוח");
  const allowedDigits = new Set(answersText.match(/\d+/g) ?? []);
  for (const n of everything.match(/\d+/g) ?? []) if (!allowedDigits.has(n)) fails.push(`מספר שלא הופיע בנתונים: ${n}`);
  // The wording has to come from what the therapist said: every version shares at least one content word with the answers.
  const said = stems(answersText);
  full.forEach((f, i) => {
    const mine = [...stems(f)];
    if (mine.length && !mine.some((s) => said.has(s))) fails.push(`גרסה ${i + 1} לא נשענת על מה שנאמר`);
  });
  return fails;
}

export interface CardContent {
  gender: Gender;
  client_word: ClientWord;
  niche_line: string;
  way_line: string;
  card_niches: { title: string; detail: string }[];
  person_summary: string;
  variants: { tag: string; lead: string; who: string; change: string }[];
}

export function composeContent(obj: any, input: Input): CardContent {
  return {
    gender: input.gender,
    client_word: input.clientWord,
    niche_line: String(obj.niche_line).trim(),
    way_line: String(obj.way_line).trim(),
    card_niches: obj.card_niches.map((c: any) => ({ title: String(c.title).trim().replace(/[.]+$/, ""), detail: String(c.detail).trim().replace(/[.]+$/, "") })),
    person_summary: input.answers[0],
    variants: obj.variants.map((v: any, i: number) => ({
      tag: TAGS[i],
      lead: LEADS[input.gender],
      who: String(v.who).trim(),
      change: String(v.change).trim(),
    })),
  };
}

export interface Deps {
  getUserId: (req: Request) => Promise<string | null>;
  countToday: (userId: string) => Promise<number>;
  countReflectToday: (userId: string) => Promise<number>;
  logReflect: (userId: string) => Promise<void>;
  callModel: (system: string, user: string) => Promise<string>;
  save: (userId: string, tool: Tool, content: unknown, inputs: unknown) => Promise<{ id: string; version: number }>;
  isAdmin: (userId: string) => Promise<boolean>;
  deleteMine: (userId: string, tool: Tool) => Promise<number>; // every version of the caller's own card (their events cascade)
}

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const parseJson = (raw: string): unknown => {
  try { return JSON.parse(raw); } catch { const m = raw.match(/\{[\s\S]*\}/); return m ? JSON.parse(m[0]) : null; }
};

async function handleReflect(body: any, userId: string, deps: Deps): Promise<Response> {
  const step = Number(body?.step);
  const raw = Array.isArray(body?.answers) ? body.answers.slice(0, ANSWER_COUNT).map(cleanAnswer) : [];
  if (!Number.isInteger(step) || step < 0 || step >= ANSWER_COUNT || raw.length <= step || !raw[step]) return json(400, { error: "bad_step" });
  if ((await deps.countReflectToday(userId)) >= DAILY_REFLECT_LIMIT) return json(200, { status: "skip" });
  await deps.logReflect(userId);
  try {
    const out = validateReflect(parseJson(await deps.callModel(REFLECT_SYSTEM, buildReflectUser(step, raw, parseClientWord(body?.client_word)))));
    return json(200, out ? { status: "ok", ...out } : { status: "skip" });
  } catch {
    return json(200, { status: "skip" });
  }
}

export async function handle(req: Request, deps: Deps): Promise<Response> {
  if (req.method !== "POST") return json(405, { error: "method_not_allowed" });
  let body: any = {};
  try { body = await req.json(); } catch { /* an empty body is rejected below */ }
  const tool = body?.tool as Tool;
  if (!TOOLS.includes(tool)) return json(400, { error: "bad_tool" });

  const userId = await deps.getUserId(req);
  if (!userId) return json(401, { error: "unauthorized" });

  if (body?.action === "reflect") return handleReflect(body, userId, deps);
  // Admin only, for trying the exercise again from a clean slate: deletes the admin's OWN card rows, nobody else's.
  if (body?.action === "reset") {
    if (!(await deps.isAdmin(userId))) return json(403, { error: "forbidden" });
    const deleted = await deps.deleteMine(userId, tool);
    return json(200, { status: "ok", deleted });
  }

  const parsed = parseInput(body);
  if ("error" in parsed) return json(400, { error: parsed.error });
  if ("missing" in parsed) return json(200, { status: "needs_info", missing: parsed.missing });
  const input = parsed.input;

  if ((await deps.countToday(userId)) >= DAILY_LIMIT) return json(429, { error: "daily_limit" });

  const user = buildUser(input);
  const answersText = input.answers.join("\n");
  let lastFails: string[] = [];
  for (let attempt = 0; attempt < 2; attempt++) {
    const extra = attempt === 0 ? "" : `\n\nהניסיון הקודם נפסל מהסיבות האלה, תקן אותן: ${lastFails.join("; ")}`;
    let obj: unknown = null;
    try {
      obj = parseJson(await deps.callModel(SYSTEM, user + extra));
    } catch { lastFails = ["שגיאת מודל"]; continue; }
    lastFails = validateCard(obj, answersText);
    if (!lastFails.length) {
      const content = composeContent(obj, input);
      const saved = await deps.save(userId, tool, content, { answers: input.answers, gender: input.gender, client_word: input.clientWord, source: input.source });
      return json(200, { status: "ok", deliverable: { id: saved.id, tool, version: saved.version, content, edited_content: null } });
    }
  }
  return json(200, { status: "failed", reason: "quality_check", failures: lastFails });
}
// ===== core: end =====

const reflectCounts = new Map<string, number>();

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const lovableKey = Deno.env.get("LOVABLE_API_KEY") ?? "";
    const deps: Deps = {
      // Reflections save nothing, so their limit is a soft per-instance guard against a runaway client.
      countReflectToday: async (userId) => {
        const day = new Date().toISOString().slice(0, 10);
        const k = `${day}:${userId}`;
        return reflectCounts.get(k) ?? 0;
      },
      logReflect: async (userId) => {
        const day = new Date().toISOString().slice(0, 10);
        const k = `${day}:${userId}`;
        if (reflectCounts.size > 5000) reflectCounts.clear();
        reflectCounts.set(k, (reflectCounts.get(k) ?? 0) + 1);
      },
      getUserId: async (r) => {
        const auth = r.headers.get("Authorization") ?? "";
        if (!auth.startsWith("Bearer ")) return null;
        const c = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: auth } } });
        const { data } = await c.auth.getUser();
        return data?.user?.id ?? null;
      },
      countToday: async (userId) => {
        const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
        const { count } = await admin.from("therapist_deliverables").select("id", { count: "exact", head: true }).eq("user_id", userId).eq("tool", "professional-card").gte("created_at", since);
        return count ?? 0;
      },
      callModel: async (system, user) => {
        const r = await aiFetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: { Authorization: `Bearer ${lovableKey}`, "Content-Type": "application/json" },
          signal: AbortSignal.timeout(60000),
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            temperature: 0.7,
            response_format: { type: "json_object" },
            messages: [{ role: "system", content: system }, { role: "user", content: user }],
          }),
        });
        if (!r.ok) throw new Error("model " + r.status);
        const d = await r.json();
        return String(d?.choices?.[0]?.message?.content ?? "");
      },
      isAdmin: async (userId) => {
        const { data, error } = await admin.rpc("has_role", { _user_id: userId, _role: "admin" });
        return !error && data === true;
      },
      deleteMine: async (userId, tool) => {
        const { data, error } = await admin.from("therapist_deliverables").delete().eq("user_id", userId).eq("tool", tool).select("id");
        if (error) throw error;
        return (data as unknown[] | null)?.length ?? 0;
      },
      save: async (userId, tool, content, inputs) => {
        const { data: last } = await admin.from("therapist_deliverables").select("version").eq("user_id", userId).eq("tool", tool).order("version", { ascending: false }).limit(1);
        const version = ((last as any[])?.[0]?.version ?? 0) + 1;
        const { data, error } = await admin.from("therapist_deliverables").insert({ user_id: userId, tool, version, content, inputs }).select("id").single();
        if (error) throw error;
        return { id: (data as any).id, version };
      },
    };
    return await handle(req, deps);
  } catch (e) {
    console.error("challenge-tool-generate", e);
    return json(500, { error: "server_error" });
  }
});
