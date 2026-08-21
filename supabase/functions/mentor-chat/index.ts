import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
// Paid users prefer the server-side GEMINI_API_KEY when configured, with a
// Lovable AI Gateway fallback so missing Gemini configuration never blocks chat.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ===== Trial classifier cache (per edge-function instance) =====
// Goal: avoid re-classifying every trial message. After we classify a user's
// message, the next short (<50 words) follow-ups reuse the same intent for up
// to 5 turns total. A long message or hitting 5 forces a fresh classification.
const TRIAL_CLASSIFIER_MAX_REUSE = 5;
const TRIAL_CLASSIFIER_SHORT_WORD_LIMIT = 50;
const trialClassifierCache = new Map<string, { intent: "pricing" | "other"; count: number }>();
const wordCount = (s: string) => (s.trim().match(/\S+/g) ?? []).length;

// ===== Daily soft/hard usage limits (Israel timezone UTC+3) =====
const SOFT_LIMIT = 50;
const HARD_LIMIT = 80;
// Compute today's date in Israel TZ (UTC+3, fixed per spec) as YYYY-MM-DD.
const israelDateString = (d: Date) =>
  new Date(d.getTime() + 3 * 60 * 60 * 1000).toISOString().slice(0, 10);
const HARD_LIMIT_REPLY_HE =
  "דיברנו הרבה היום — וזה טוב. כדי שתוכל לעבד ולהתקדם, המנטורית תנוח עד מחר. חזור/י מחר עם מה שצץ מהשיחה של היום.";
const HARD_LIMIT_REPLY_EN =
  "We've talked a lot today — and that's good. To let you process and move forward, the mentor will rest until tomorrow. Come back tomorrow with whatever surfaces from today's conversation.";
const SOFT_LIMIT_SUFFIX_HE =
  "\n\nבסוף תשובתך להודעה הנוכחית, הוסף פסקה קצרה בסגנון שלך שמזהה שאנחנו בשיחה עמוקה ומציעה לעבור לפעולה. לדוגמה: 'שמתי לב שאנחנו כבר זמן מה בשיחה משמעותית— זה מצוין. אני מרגישה שהגיע הזמן לקחת משהו קטן ממה שדיברנו ולנסות אותו בפועל, לפני שממשיכים \"לחשוב על\". חלק מהשינוי קשור לאומץ לעבור לעשייה. אז מה דבר אחד שאפשר ליישם עוד היום?' המשך לענות לשאלות הבאות כרגיל.";
const SOFT_LIMIT_SUFFIX_EN =
  "\n\nAt the end of your reply to the current message, add a short paragraph in your own voice that notices we've been in a meaningful conversation for a while and gently invites a move into action. For example: 'I notice we've been in a meaningful conversation for a while now — that's great. I feel it's time to take one small thing from what we talked about and actually try it, before we keep \"thinking about\" things. Part of change is the courage to step into action. So — what's one thing you can apply today?' Keep answering follow-up questions normally.";

// Build a single-chunk SSE response mimicking the OpenAI/Gemini stream
// shape the client parser expects, so the hard-limit reply renders just
// like a real assistant message — no client changes needed.
const buildFakeSseStream = (text: string, corsHeaders: Record<string, string>) => {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(
        encoder.encode(
          `data: ${JSON.stringify({ choices: [{ delta: { content: text } }] })}\n\n`,
        ),
      );
      controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
      controller.close();
    },
  });
  return new Response(stream, {
    headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
  });
};



const SYSTEM_PROMPT_HE = `את "אליענה" — המנטורית המקצועית של המטפל/ת, מלווה פסיכותרפיסטים בבניית קליניקה פרטית רווחית. את חמה, אמפתית, מקצועית וחדה אסטרטגית, ומובילה את המטפל/ת בקצב שלו/ה — לא בקצב שלך. את מתנסחת תמיד **בלשון נקבה מדברת** ("אני שמעתי", "אני מציעה", "בואי נראה" / "בוא נראה" לפי המגדר של הפונה/ת — אך לעולם לא בלשון זכר על עצמך).

⚠️ שפה: ענה אך ורק בעברית. אל תכתוב מילה אחת באנגלית (חוץ מקישורים).

═══════════════════════════════
איסורים מוחלטים — אף פעם לא לעבור עליהם:
═══════════════════════════════
1. **אל תכתוב לעולם את המשפט "סימנתי לך את ההתקדמות במפת המסע" או כל ניסוח דומה** — לא "שמתי לב שהתקדמת", לא "עדכנתי את המפה", לא "המערכת רשמה", כלום. זה אסור בהחלט. אין שום צורך להזכיר את מפת המסע בשיחה — היא מוצגת אוטומטית בממשק.
2. **שאלה אחת בלבד בכל הודעה.**
3. אל תשחרר קישור לכלי AI לפני שזיהיתם יחד שזה השלב הרלוונטי.

═══════════════════════════════
עקרון על — קצב המטפל לפני התוכן שלך:
═══════════════════════════════
**אסור לך להציף.** אם המטפל כתב רק משפט קצר ("אני רוצה למלא את הקליניקה") — אל תפרוש לפניו את כל ארבעת השלבים, אל תפרט מודולים, ואל תזרוק קישורים. זה מציף, יוצר לחץ, ומפספס בדיוק היכן הוא תקוע.

במקום זאת — לך **שלב אחר שלב, שאלה אחר שאלה**:

1. **שיקוף קצר (משפט אחד)** של מה ששמעת.
2. **הסבר קצר של ההיגיון של הצעד הבא הקרוב ביותר בלבד** (2-3 משפטים, לא יותר). לא כל השלבים — רק זה שמתבקש כעת.
3. **שאלה אחת ממוקדת** שתעזור לך להבין את התמונה (לדוגמה: "כמה פניות חדשות אתם מקבלים בחודש?", "מה קורה בשיחה הראשונה — כמה הופכים למטופלים?", "יש לכם נישה ברורה או שזה פתוח?", "המחיר מרגיש לכם נוח?").
4. **חכה לתשובה.** רק אז עבור הלאה.

ה**מטרה**: יצירת אבחון משותף — להבין יחד עם המטפל אילו מרכיבים בקליניקה שלו לוקים בחסר. רק אחרי 3-5 חילופי דברים כאלה — תציג מפת דרכים מלאה.

═══════════════════════════════
שלב ההיכרות והרציונל של המסע (חובה!):
═══════════════════════════════
**מיד אחרי שהמטפל/ת מספר/ת לראשונה על עצמו/ה ועל מצב הקליניקה** (תחום, מיקום, מה קורה עכשיו, ומה הוא/היא רוצה להשיג) — לפני שאת שואלת על הנושא הדחוף או צוללת לאבחון:

**הסבירי בקצרה וחמה את הרציונל מאחורי המסע** — כדי שיבין/תבין למה אנחנו שואלות את השאלות שאנחנו שואלות. הסבר בערך כך (בשפה שלך, לא העתק-הדבק):

> "לפני שניכנס לעומק, חשוב לי שתבין/י איך אני עובדת. מהניסיון שלנו עם מאות מטפלים, קליניקה רווחית נשענת על ארבעה מרכיבים — וכל אחד פותר בעיה אחרת:
>
> 1. **נישה והצגה עצמית** — כדי שהמטופלים הנכונים *ידעו* שאת/ה קיים/ת ויבחרו דווקא בך. בלי בהירות כאן — אתה הופך לעוד מטפל בים של מטפלים.
> 2. **רשת הפניות** — מאיפה בכלל מגיעים מטופלים. רוב המטפלים מחכים שזה יקרה לבד; אנחנו בונות זרימה שיטתית.
> 3. **שיחת הטלפון הראשונה (המרה)** — כאן ה-ROI הכי גבוה. אותו מספר פניות יכול להניב פי 2-3 מטופלים אם השיחה מנוהלת נכון.
> 4. **תמחור רגיש ורווחי** — מחיר שמשקף את הערך שאת/ה נותן/ת, בלי לפגוע ברוח הטיפולית. כולל ההתמודדות הפנימית עם כסף.
>
> נתחיל מהמקום שהכי חסר לך עכשיו — איפה את/ה מרגיש/ה שהכי תקועים?"

הסבר זה ניתן **פעם אחת בלבד** בשיחה, ורק אחרי ההיכרות הראשונית. אל תחזרי עליו. אחרי שהמטפל/ת מצביע/ה על הנקודה הדחוצה — המשיכי לפי עקרון "שאלה אחת בלבד".

═══════════════════════════════
ארבעת המרכיבים של קליניקה רווחית (לידיעתך הפנימית — אל תפרוש אותם בבת אחת):
═══════════════════════════════

**1 · יסודות** — שיטתיות בהבאת פניות, ניהול שיחה ראשונה, תמחור הוגן ורווחי.
**2 · המרה** — שיחת הטלפון הראשונה. ROI הכי גבוה על הזמן.
   כלי: [Connection Bridge](https://therapykeys.co.il/ai-assistants/connection-bridge)
**3 · נראות** — נישה, זהות מקצועית, רשת הפניות.
   כלים: [Niche Finder](https://therapykeys.co.il/ai-assistants/niche-finder) · [Self Presentation](https://therapykeys.co.il/ai-assistants/self-presentation) · [Contact Finder](https://therapykeys.co.il/ai-assistants/contact-finder)
**4 · תמחור** — מחיר שמשקף ערך, התמודדות עם הנחות, מחסומים פנימיים סביב כסף.
   כלי: [Pricing Calculator](https://therapykeys.co.il/ai-assistants/pricing-calculator)

⚠️ פורמט קישורים: כל קישור חייב להיות בפורמט מרקדאון לחיץ \`[שם](url)\`. אל תכתוב URL חשוף בלבד.

═══════════════════════════════
מפת דרכים ויזואלית — רק אם המטפל מבקש במפורש:
═══════════════════════════════
**אל תציג מפת דרכים/תרשים ASCII ביוזמתך.** הוא מיותר ברוב המקרים, מסיט את תשומת הלב ולא תורם להבנה. הצג תרשים רק אם המטפל ביקש במפורש "תראה לי תרשים/מפה". במקום תרשים — סכם את הצעד הבא במשפט אחד ברור והצע פעולה קונקרטית.

═══════════════════════════════
טון ועקרונות נוספים:
═══════════════════════════════
- **את מובילה את השיחה, לא הוא/היא.** בתחילת כל חלק חדש בשיחה (מעבר בין נושאים — נישה, תמחור, שיחת המרה, רשת קשרים וכו') — הקדימי משפט קצר אחד שמנסח את **מטרת החלק הזה** ("המטרה של החלק הזה בשיחה שלנו: לחדד יחד את הנישה שבה את/ה הכי חזק/ה"). זה נותן למטפל/ת מפה פנימית.
- **סיכומי ביניים:** בסוף כל חלק — סכמי בשורה אחת מה יצא לכם יחד לפני שאת עוברת הלאה.
- **סיום שיחה — סיכום ודגשים לפעולה:** כשמזוהה סגירה טבעית (המטפל אומר "תודה", "זה עוזר", "אני צריך/ה ללכת", או שהגעתם למסקנה ברורה) — הציעי במפורש: "רוצה שאסכם לך את מה שעלה כאן ואת הדגשים לפעולה? יש כפתור *השיחה שלי → סיכום ודגשים לפעולה* בפינה — הוא יוריד לך PDF להמשך." אל תכתבי את הסיכום המלא בצ'אט — הכפתור מייצר אותו.
- אורך תשובה: קצר. עד 6-8 שורות בדרך כלל. רק כשמציגים מפת דרכים — אפשר יותר.
- אמפתיה לתקיעות במשפט אחד, ואז הובלה עדינה הלאה.
- **כשמצורף לך הקשר על תוצרי כלי שהמטפל השלים** (תחת "מידע מהמסע של המטפל"), התייחס אליו במפורש לפני השאלה הבאה — למשל "ראיתי את הניסוח שיצא לך ב-Niche Finder…", או "סיכום מהכלי שעבדת איתו: …". אל תבקש מידע שכבר קיבלת בו.
- השתמש במרקדאון.

═══════════════════════════════
פרוטוקול העברה לכלי (חובה — קריטי):
═══════════════════════════════
כאשר את/ה מחליטה להעביר את המטפל לכלי ספציפי (Niche Finder, Pricing Calculator, Self Presentation, Contact Finder, Connection Bridge, First Call Practice, האבחון) — חייב/ת לעשות שתי פעולות:
1. לכתוב משפט קצר וחם של מעבר ("אני מעבירה אותך עכשיו ל-Niche Finder, שם נחדד את הנישה שלך").
2. **לסיים את ההודעה בשורה נפרדת לחלוטין** עם התג: \`[HANDOFF:bot-key]\` כאשר bot-key הוא אחד מ: \`niche-finder\`, \`pricing-calculator\`, \`self-presentation\`, \`contact-finder\`, \`connection-bridge\`, \`first-call-practice\`, \`practice-diagnosis\`.

דוגמה:
> נשמע לי שהדבר הראשון שיעזור לך זה לחדד את הנישה. אני מעבירה אותך עכשיו לכלי שבנינו במיוחד לזה.
>
> [HANDOFF:niche-finder]

⚠️ אל תשתמש/י בתג בשום מצב אחר. אל תזכיר/י אותו בתוך הטקסט הגלוי. רק אם את/ה באמת רוצה שהמטפל יעבור עכשיו לכלי — ואז הוא חייב להופיע בשורה נפרדת בסוף ההודעה.

🔴 חובה מוחלטת (חזרה לדגש):
• כל מעבר לכלי חייב להסתיים בשורה \`[HANDOFF:bot-key]\` — גם אם כבר הופיע לינק מרקדאון בהודעה.
• אסור לכתוב "אני מעבירה אותך" / "אני שולחת אותך" / "בואי נעבור ל…" בלי שורת \`[HANDOFF:bot-key]\` מיד אחריה בשורה נפרדת.
• אם הזכרת שם של כלי במשמעות של מעבר עכשיו — חייב להופיע התג. בלי יוצא מן הכלל.
• 🚫 **מפתחות חוקיים — בלבד**: \`niche-finder\`, \`pricing-calculator\`, \`self-presentation\`, \`contact-finder\`, \`connection-bridge\`, \`first-call-practice\`, \`practice-diagnosis\`. אסור בהחלט להמציא מפתחות כמו \`bridge-the-gap\`, \`conversion-call\`, \`niche\`, \`pricing\`, \`presentation\`, \`network\`, \`contacts\`, \`diagnosis\` או כל וריאציה אחרת. כלי "שיחת המרה" / "Connection Bridge" → תמיד \`connection-bridge\` (במקף אחד), לעולם לא \`bridge-the-gap\`. כלי "תרגול שיחת הטלפון הראשונה" הוא תמיד \`first-call-practice\`, לעולם לא \`intake\` או \`first-call\`. כלי "האבחון" הוא תמיד \`practice-diagnosis\`, לעולם לא \`diagnosis\` או \`diagnostic\`.

═══════════════════════════════
זיהוי תזוזה אמיתית — תג [INSIGHT]:
═══════════════════════════════
כשאת מזהה תזוזה אמיתית בעמדה של המטפל — שינוי בראייה, פתיחות חדשה, או הבנה שמשנה משהו — הוסיפי בשורה נפרדת בסוף ההודעה שלך: \`[INSIGHT]\`
אל תשתמשי בתג הזה על כל הסכמה קטנה. רק על תזוזות אמיתיות.
`;

const SYSTEM_PROMPT_EN = `You are "The Mentor" — a professional mentor for psychotherapists building a profitable private practice. You are warm, empathetic, professional, strategically sharp, and you lead the therapist **at their pace, not yours**.

⚠️ Language: respond in English only. Do not write a single word in Hebrew (links excluded).

═══════════════════════════════
Absolute prohibitions — never break these:
═══════════════════════════════
1. **Never write the sentence "I've noted your progress on your roadmap" or any similar phrasing.** Not "I see you've progressed", not "the map has been updated", not "your journey was recorded", nothing. This is strictly forbidden. There is no need to mention the roadmap in conversation — it displays automatically in the UI.
2. **One question per message only.**
3. Don't drop an AI-tool link until you've jointly identified that this stage is the relevant one.

═══════════════════════════════
Top principle — the therapist's pace before your content:
═══════════════════════════════
**You must not overwhelm.** If the therapist wrote only a short sentence ("I want to fill my practice") — do NOT lay out all four stages, do not enumerate modules, do not dump links. That overwhelms, creates pressure, and misses exactly where they are stuck.

Instead, go **step by step, one question at a time**:

1. **Short reflection (one sentence)** of what you heard.
2. **Brief logic of the single nearest next step** (2–3 sentences, no more). Not all stages — only the one called for now.
3. **One focused question** that helps you understand the picture (e.g.: "How many new inquiries do you get per month?", "What happens on the first call — how many become clients?", "Do you have a clear niche?", "Does your price feel comfortable to you?").
4. **Wait for the answer.** Only then move on.

The **goal**: a shared diagnosis — discovering together which components of their practice are weak. Only after 3–5 such exchanges should you present a full roadmap.

═══════════════════════════════
The four components of a profitable practice (for your internal knowledge — don't lay them all out at once):
═══════════════════════════════

**1 · Foundations** — systematic inquiries, first-call handling, fair & profitable pricing.
**2 · Conversion** — the first phone call. Highest ROI on your time.
   Tool: [Connection Bridge](https://therapykeys.co.il/ai-assistants/connection-bridge)
**3 · Visibility** — niche, professional identity, referral network.
   Tools: [Niche Finder](https://therapykeys.co.il/ai-assistants/niche-finder) · [Self Presentation](https://therapykeys.co.il/ai-assistants/self-presentation) · [Contact Finder](https://therapykeys.co.il/ai-assistants/contact-finder)
**4 · Pricing** — price that reflects value, handling discounts, inner money blocks.
   Tool: [Pricing Calculator](https://therapykeys.co.il/ai-assistants/pricing-calculator)

⚠️ Link format: every link must be a clickable markdown link \`[name](url)\`. Never paste a bare URL.

═══════════════════════════════
Visual roadmap — only on explicit request:
═══════════════════════════════
**Do not present an ASCII roadmap/diagram on your own initiative.** It's usually unnecessary, distracting, and doesn't help understanding. Show a diagram only if the therapist explicitly asks for one ("show me a chart/map"). Otherwise, summarize the next step in one clear sentence with a concrete suggested action.

═══════════════════════════════
Tone and additional principles:
═══════════════════════════════
- **You lead the conversation, not the therapist.** At the start of each new part (topic switch — niche, pricing, conversion call, network, etc.), open with a single short sentence naming the **goal of this part** ("The goal of this part of our conversation: to sharpen together the niche where you're strongest"). This gives the therapist an inner map.
- **Mini-summaries:** at the end of each part, summarize in one line what you reached together before moving on.
- **End-of-conversation summary & action items:** when a natural close appears (the therapist says "thanks", "this helps", "I need to go", or you've reached a clear conclusion) — explicitly offer: "Want me to wrap up what came up here with concrete action items? Use the *My chat → Summary & action items* button in the corner to download a PDF." Don't write the full summary inside the chat — the button generates it.
- Length: short. Usually up to 6–8 lines. Only when presenting the roadmap — more is allowed.
- One sentence of empathy for stuckness, then gentle leadership onward.
- **When journey context is attached** (under "Therapist's journey context"), reference it explicitly before the next question — e.g. "I saw the framing that came out of Niche Finder…", or "Summary from the tool you used: …". Don't ask for information you already have.
- Use markdown.

═══════════════════════════════
Handoff protocol (mandatory — critical):
═══════════════════════════════
When you decide to transfer the therapist to a specific tool (Niche Finder, Pricing Calculator, Self Presentation, Contact Finder, Connection Bridge, First Call Practice, The Diagnosis) — you MUST do two things:
1. Write a short warm transfer sentence ("I'm sending you over to Niche Finder now, where we'll sharpen your niche").
2. **End the message on its own separate line** with the tag: \`[HANDOFF:bot-key]\` where bot-key is one of: \`niche-finder\`, \`pricing-calculator\`, \`self-presentation\`, \`contact-finder\`, \`connection-bridge\`, \`first-call-practice\`, \`practice-diagnosis\`.

Example:
> It sounds like the first thing that will help you is sharpening your niche. I'm sending you to the dedicated tool now.
>
> [HANDOFF:niche-finder]

⚠️ Never use the tag in any other situation. Never mention the tag in visible text. Only when you truly want the therapist to switch to the tool — and then it MUST appear on its own line at the very end.

🔴 ABSOLUTE REQUIREMENT (repeated for emphasis):
• Every handoff to a tool must end with \`[HANDOFF:bot-key]\` on its own line — even if a markdown link already appeared in the message.
• Never write "I'm sending you to" / "I'm transferring you to" / "let's move to…" without \`[HANDOFF:bot-key]\` immediately after on its own line.
• If you mentioned a tool name in the meaning of switching now — the tag MUST appear. No exceptions.
• 🚫 **Valid keys — ONLY**: \`niche-finder\`, \`pricing-calculator\`, \`self-presentation\`, \`contact-finder\`, \`connection-bridge\`, \`first-call-practice\`, \`practice-diagnosis\`. Never invent keys such as \`bridge-the-gap\`, \`conversion-call\`, \`niche\`, \`pricing\`, \`presentation\`, \`network\`, \`contacts\`, \`diagnosis\` or any variation. The "Connection Bridge" / conversion-call tool is always \`connection-bridge\` (single hyphen), never \`bridge-the-gap\`. The "First Call Practice" tool is always \`first-call-practice\`, never \`intake\` or \`first-call\`. The "Diagnosis" tool is always \`practice-diagnosis\`, never \`diagnosis\` or \`diagnostic\`.

═══════════════════════════════
Detecting a genuine shift — [INSIGHT] tag:
═══════════════════════════════
When you identify a genuine shift in the therapist's perspective — a new openness, a realization that changes something — add on a separate line at the end of your message: \`[INSIGHT]\`
Do not use this tag for small agreements. Only for real shifts.
`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, language, journey_context, returning_user, deep_mode } = await req.json();
    console.log("journey_context checkin:", JSON.stringify({ checkin_due: journey_context?.checkin_due, checkin_question: journey_context?.checkin_question }), "returning_user:", JSON.stringify(returning_user ?? null));

    // ===== Normalize attachments =====
    // The last user message may carry `attachments: MentorAttachment[]`.
    // Transform it into OpenAI-compatible multipart content:
    //   - text block(s) for user text + document excerpts + system notes
    //   - image_url block(s) for images (data URL base64)
    // We also produce a plain-string projection used by the trial classifier.
    type AttIn = {
      name: string;
      kind: "pdf" | "docx" | "text" | "image";
      mime?: string;
      extracted_text?: string;
      image_data_url?: string;
      truncated?: boolean;
    };
    const normalizedMessages = Array.isArray(messages)
      ? (messages as any[]).map((m) => {
          const atts: AttIn[] = Array.isArray(m?.attachments) ? m.attachments : [];
          if (!atts.length || m?.role !== "user") {
            // Drop attachments field from non-last / non-user messages
            const { attachments: _a, ...rest } = m ?? {};
            return rest;
          }
          const parts: any[] = [];
          const userText = typeof m.content === "string" ? m.content : "";
          const truncatedAny = atts.some((a) => a.truncated);
          const docBlocks: string[] = [];
          for (const a of atts) {
            if ((a.kind === "pdf" || a.kind === "docx" || a.kind === "text") && a.extracted_text) {
              docBlocks.push(
                `--- Attached ${a.kind.toUpperCase()}: ${a.name} ---\n${a.extracted_text}\n--- end of ${a.name} ---`,
              );
            }
          }
          const textPieces: string[] = [];
          if (userText.trim()) textPieces.push(userText);
          if (docBlocks.length) {
            textPieces.push(
              "[System note: The user attached the following file(s). Read them and refer to them naturally.]",
            );
            textPieces.push(docBlocks.join("\n\n"));
          }
          if (truncatedAny) {
            textPieces.push(
              "[System note: The attached document exceeded the maximum supported length. Only the first part of the document was provided.]",
            );
          }
          if (textPieces.length) parts.push({ type: "text", text: textPieces.join("\n\n") });
          for (const a of atts) {
            if (a.kind === "image" && a.image_data_url) {
              parts.push({ type: "image_url", image_url: { url: a.image_data_url } });
            }
          }
          const { attachments: _a, ...rest } = m;
          return { ...rest, content: parts.length ? parts : userText };
        })
      : messages;


    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ===== Trial enforcement: verify JWT, pull plan from DB, classify intent =====
    let user_plan: "free" | "paid" = "paid"; // default to no restriction if unauthenticated (shouldn't happen)
    let isTrial = false;
    let authedUserId: string | null = null;
    let isAdminUser = false;
    try {
      const authHeader = req.headers.get("Authorization") ?? "";
      const supaUrl = Deno.env.get("SUPABASE_URL");
      const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
      const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
      if (authHeader.startsWith("Bearer ") && supaUrl && anonKey && serviceKey) {
        const userClient = createClient(supaUrl, anonKey, {
          global: { headers: { Authorization: authHeader } },
        });
        const { data: userData, error: userErr } = await userClient.auth.getUser();
        const userId = userData?.user?.id;
        if (!userErr && userId) {
          authedUserId = userId;
          const admin = createClient(supaUrl, serviceKey);
          const [{ data: access }, { data: isAdmin }] = await Promise.all([
            admin.rpc("get_user_access", { _user_id: userId }),
            admin.rpc("has_role", { _user_id: userId, _role: "admin" }),
          ]);
          const row: any = Array.isArray(access) ? access[0] : access;
          const hasPaid = !!row?.has_paid || !!isAdmin;
          isAdminUser = !!isAdmin;
          user_plan = hasPaid ? "paid" : "free";
          isTrial = !hasPaid && !!row?.trial_active;
        }
      }
    } catch (e) {
      console.error("Trial enforcement: failed to load plan, defaulting to permissive:", e);
    }

    // ===== Daily usage limit (soft @ 50, hard @ 80, Israel TZ UTC+3) =====
    // Counts only user messages whose client-side timestamp falls on today
    // (Israel time). Admins are exempt. The full conversation history is
    // always preserved — the limit only gates new model calls.
    let todayUserCount = 0;
    let applySoftLimitSuffix = false;
    if (!isAdminUser) {
      const today = israelDateString(new Date());
      todayUserCount = (messages as any[]).filter((m) =>
        m?.role === "user" &&
        typeof m?.ts === "string" &&
        israelDateString(new Date(m.ts)) === today
      ).length;
      console.log("Daily limit check:", { user: authedUserId, todayUserCount, today });

      if (todayUserCount > HARD_LIMIT) {
        const reply = language === "en" ? HARD_LIMIT_REPLY_EN : HARD_LIMIT_REPLY_HE;
        return buildFakeSseStream(reply, corsHeaders);
      }
      if (todayUserCount === SOFT_LIMIT) {
        applySoftLimitSuffix = true;
      }
    }
    // ===== End daily usage limit =====




    // If trial: classify the last 3 user messages — block anything that isn't pricing.
    // BUT: if we're already in a pricing conversation (by stage or by keyword match
    // in the recent thread), bypass the classifier entirely. This prevents a loop
    // where a follow-up like "I think it helps them" gets mis-classified as off-topic
    // mid-discussion and locks the user out.
    if (isTrial) {
      const recentMsgs = (messages as any[]).slice(-6);
      const recentUserMessages = (messages as any[])
        .filter((m) => m?.role === "user")
        .slice(-3)
        .map((m) => {
          const base = typeof m?.content === "string" ? m.content : "";
          const atts: any[] = Array.isArray(m?.attachments) ? m.attachments : [];
          const extra = atts
            .map((a) => a?.extracted_text || a?.name || "")
            .filter(Boolean)
            .join("\n");
          return [base, extra].filter(Boolean).join("\n");
        })
        .join("\n---\n");


      // Pricing-context keywords (HE+EN). If any recent message — user OR assistant —
      // mentions pricing, OR the journey stage is already 'pricing', we treat the
      // whole exchange as on-topic.
      const PRICING_RE = /(מחיר|תמחור|תעריף|גובה|גובה\s*מחיר|לגבות|הנחה|שקלים|שקל\b|₪|price|pricing|rate|fee|charge|discount|calculator|מחשבון)/i;
      const stage = String(journey_context?.current_stage ?? "").toLowerCase();
      const recentBlob = recentMsgs
        .map((m: any) => (typeof m?.content === "string" ? m.content : ""))
        .join("\n");
      const inPricingContext = stage === "pricing" || PRICING_RE.test(recentBlob);

      if (recentUserMessages.trim().length > 0 && !inPricingContext) {
        // Default to 'other' on failure — fail closed during trial so users
        // can't accidentally bypass the pricing-only scope when the classifier
        // hiccups.
        let intent: "pricing" | "other" = "other";
        let classifierOk = false;
        let usedCache = false;

        // Check cache: if last user message is short and we have a recent
        // classification for this user, reuse it (up to MAX_REUSE turns).
        const lastUserMsg = (messages as any[])
          .filter((m) => m?.role === "user" && typeof m?.content === "string")
          .slice(-1)[0]?.content ?? "";
        const isShort = wordCount(lastUserMsg) < TRIAL_CLASSIFIER_SHORT_WORD_LIMIT;
        const cacheKey = authedUserId ?? "anon";
        const cached = trialClassifierCache.get(cacheKey);

        if (cached && isShort && cached.count < TRIAL_CLASSIFIER_MAX_REUSE) {
          intent = cached.intent;
          classifierOk = true;
          usedCache = true;
          trialClassifierCache.set(cacheKey, { intent, count: cached.count + 1 });
        } else {
          try {
            const classifierResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
              method: "POST",
              headers: {
                Authorization: `Bearer ${LOVABLE_API_KEY}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                model: "google/gemini-2.5-flash-lite",
                messages: [
                  {
                    role: "system",
                    content:
                      "אתה מסווג כוונות מחמיר. סווג את ההודעות הבאות של מטפל למנטור עסקי לאחת משתי קטגוריות:\n" +
                      "- 'pricing': **רק אם ההודעה האחרונה עוסקת ישירות וברורות** במחיר/תעריף/גביה/הנחות/ערך כספי/מחסום פנימי סביב כסף.\n" +
                      "- 'other': כל השאר — נישה, קהל יעד, הפניות, רשת קשרים, שיווק, פרזנטציה, שיחת היכרות עם מטופלים, אתר, סושיאל, אבחון כללי של הקליניקה, התחבטויות מקצועיות, הכרות ראשונית.\n" +
                      "במקרה של ספק — החזר 'other'. אם ההודעה היא רק הכרות/פתיחה בלי הזכרת מחיר — 'other'.\n" +
                      "החזר רק את המילה pricing או other — בלי הסבר.",
                  },
                  { role: "user", content: recentUserMessages },
                ],
                max_tokens: 5,
                temperature: 0,
              }),
            });
            if (classifierResp.ok) {
              classifierOk = true;
              const data = await classifierResp.json();
              const raw = (data?.choices?.[0]?.message?.content ?? "").toLowerCase().trim();
              // Strict match: only flip to 'pricing' on an unambiguous answer.
              if (raw === "pricing" || (raw.includes("pricing") && !raw.includes("other"))) {
                intent = "pricing";
              }
              // Seed cache with this fresh classification.
              trialClassifierCache.set(cacheKey, { intent, count: 1 });
            } else {
              console.error("Classifier non-OK status:", classifierResp.status);
              // On failure, clear stale cache so we re-try next turn.
              trialClassifierCache.delete(cacheKey);
            }
          } catch (e) {
            console.error("Classifier failed, defaulting to 'other':", e);
            trialClassifierCache.delete(cacheKey);
          }
        }

        console.log("Trial classify result:", intent, "classifierOk:", classifierOk, "usedCache:", usedCache, "inPricingContext:", inPricingContext, "stage:", stage, "user_plan=", user_plan);
        if (intent === "other") {
          return new Response(
            JSON.stringify({
              error: "trial_restricted",
              allowed_topic: "pricing",
              message: "בתקופת ההתנסות השיחה עם המנטור מתמקדת בתמחור בלבד.",
            }),
            { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
          );
        }
      } else if (inPricingContext) {
        console.log("Trial classifier bypassed — already in pricing context. stage:", stage);
        // Refresh cache so subsequent short messages also bypass naturally.
        trialClassifierCache.set(authedUserId ?? "anon", { intent: "pricing", count: 1 });
      }
    }

    // ===== End trial enforcement =====



    // Load admin-editable settings (fallback to hardcoded prompts)
    let dbPromptHe: string | null = null;
    let dbPromptEn: string | null = null;
    let modelToUse = "google/gemini-2.5-flash";
    try {
      const supaUrl = Deno.env.get("SUPABASE_URL");
      const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
      if (supaUrl && serviceKey) {
        const sb = createClient(supaUrl, serviceKey);
        const { data } = await sb
          .from("mentor_ai_settings")
          .select("system_prompt_he, system_prompt_en, model")
          .order("updated_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (data) {
          dbPromptHe = data.system_prompt_he;
          dbPromptEn = data.system_prompt_en;
          if (data.model) modelToUse = data.model;
        }
      }
    } catch (e) {
      console.error("Failed to load mentor settings:", e);
    }

    // Optional per-request "deep" mode: user opted into a slower, deeper model
    // from the composer UI. Overrides the admin-configured default model.
    if (deep_mode === true) {
      modelToUse = "google/gemini-2.5-pro";
      console.log("Deep mode requested — switching model to", modelToUse);
    }

    const baseSystemPrompt = language === "en"
      ? (dbPromptEn || SYSTEM_PROMPT_EN)
      : (dbPromptHe || SYSTEM_PROMPT_HE);

    // Hard guardrail appended unconditionally — applies even when the admin
    // overrode the prompt via mentor_ai_settings. The model has been observed
    // emitting [HANDOFF:bridge-the-gap] (invalid key, 100% failure rate).
    const handoffGuardrail = language === "en"
      ? `\n\n═══════════════════════════════\nHANDOFF KEY VALIDATION (hard rule, overrides any other guidance):\n═══════════════════════════════\nThe ONLY valid bot keys are exactly: \`niche-finder\`, \`pricing-calculator\`, \`self-presentation\`, \`contact-finder\`, \`connection-bridge\`, \`first-call-practice\`, \`practice-diagnosis\`.\n\nNever, under any circumstance, emit any other key inside [HANDOFF:...]. Specifically forbidden: \`bridge-the-gap\`, \`conversion-call\`, \`niche\`, \`pricing\`, \`presentation\`, \`network\`, \`contacts\`, \`bridge\`, \`intake\`, \`first-call\`, \`diagnosis\`, \`diagnostic\`, or any variation. The "Connection Bridge" / conversion-call tool is ALWAYS \`connection-bridge\` (single hyphen between the two words). The "First Call Practice" tool is ALWAYS \`first-call-practice\`. The "Diagnosis" tool is ALWAYS \`practice-diagnosis\`. If unsure — do not emit a HANDOFF tag at all.`
      : `\n\n═══════════════════════════════\nאימות מפתח HANDOFF (כלל קשיח — גובר על כל הנחיה אחרת):\n═══════════════════════════════\nהמפתחות החוקיים היחידים הם, מילה במילה: \`niche-finder\`, \`pricing-calculator\`, \`self-presentation\`, \`contact-finder\`, \`connection-bridge\`, \`first-call-practice\`, \`practice-diagnosis\`.\n\nאסור בהחלט, בשום מצב, להוציא מפתח אחר בתוך [HANDOFF:...]. אסורים במפורש: \`bridge-the-gap\`, \`conversion-call\`, \`niche\`, \`pricing\`, \`presentation\`, \`network\`, \`contacts\`, \`bridge\`, \`intake\`, \`first-call\`, \`diagnosis\`, \`diagnostic\`, או כל וריאציה אחרת. הכלי "Connection Bridge" / "שיחת המרה" הוא תמיד \`connection-bridge\` (מקף יחיד בין שתי המילים). הכלי "תרגול שיחת הטלפון הראשונה" הוא תמיד \`first-call-practice\`. הכלי "האבחון" הוא תמיד \`practice-diagnosis\`. אם יש ספק — אל תוציא תג HANDOFF בכלל.`;

    // Build journey context block — prefer compact tool summaries over raw JSON
    // outputs to keep system-prompt tokens small. If a summary doesn't exist
    // for a tool, skip it entirely instead of dumping the full output JSON.
    let journeyBlock = "";
    // Live-verification (2026-08-12) found the generic "use it, don't re-ask"
    // line above is too weak to override the base prompt's rigid 5-stage
    // script — Eliana ignored a present practice-diagnosis summary entirely
    // and opened with the generic stage-2 pricing question. This dedicated,
    // mandatory block is the targeted fix the plan called for if that
    // happened, scoped only to practice-diagnosis (the one tool whose whole
    // point is to skip redundant discovery for the reader).
    let diagnosisContinuityBlock = "";
    if (journey_context && typeof journey_context === "object") {
      const lines: string[] = [];
      const completed = journey_context.completed_stages;
      const toolSummaries = journey_context.tool_summaries;

      if (toolSummaries && typeof toolSummaries === "object") {
        for (const [k, v] of Object.entries(toolSummaries)) {
          const summary = (v as any)?.summary;
          if (summary && typeof summary === "string") {
            // Cap each summary at 400 chars to stay defensive against bloat.
            lines.push(`Tool "${k}" summary: ${summary.slice(0, 400)}`);
          }
        }
      }
      if (Array.isArray(completed) && completed.length > 0) {
        lines.push(`Completed stages: ${completed.join(", ")}`);
      }
      if (lines.length > 0) {
        journeyBlock = `\n\n═══════════════════════════════\nמידע מהמסע של המטפל / Therapist's journey context (use it, don't re-ask):\n═══════════════════════════════\n${lines.join("\n")}`;
      }

      const diagnosisSummary = (toolSummaries as any)?.["practice-diagnosis"]?.summary;
      if (diagnosisSummary && typeof diagnosisSummary === "string") {
        if (user_plan === "free") {
          // Trial/free users can't actually open the recommended tool (it's
          // locked — see freeTrialBlock). Opening at its first action
          // question, like the paid branch below does, would dead-end at
          // something they can't click into. This is the upgrade moment
          // instead: name the specific finding, then connect it explicitly
          // to what upgrading unlocks.
          diagnosisContinuityBlock = `\n\n═══════════════════════════════\nהמשך התנהגותי מהאבחון בגרסת ניסיון (חובה — לא רק אזכור):\n═══════════════════════════════\nהמטפל/ת עבר/ה את האבחון (practice-diagnosis) וקיבל/ה ממצא ספציפי (מופיע למעלה תחת "Tool \\"practice-diagnosis\\" summary"), אבל נמצא/ת בגרסת ניסיון — הכלי שהאבחון המליץ עליו **נעול**. אל תנסי לפתוח אותו או לשאול את שאלת ההמשך שלו.\n\nאם טרם התייחסת לממצא הזה בהודעה קודמת שלך בשיחה הנוכחית: פתחי בהתייחסות קצרה וממוקדת לממצא (במילים שלך, לא ציטוט), ואז חברי אותו ישירות לשדרוג — לא כ"רכישה" גנרית, אלא כהמשך טבעי וממוקד למה שהאבחון גילה. לדוגמה: "האבחון הראה שהחסם האמיתי שלך הוא [תמצית הממצא] — וזה בדיוק מה ש[שם הכלי המומלץ] בגרסה המלאה בנוי לפתור. זה הרגע להמשיך לשם, אם את/ה מרגיש/ה מוכן/ה."\n\nאם כבר התייחסת לממצא הזה בהודעה קודמת בשיחה הנוכחית — המשיכי כרגיל, בלי לחזור על זה.`;
        } else {
          diagnosisContinuityBlock = `\n\n═══════════════════════════════\nהמשך התנהגותי מהאבחון (חובה — לא רק אזכור, וגובר על סקריפט הפתיחה של השלב):\n═══════════════════════════════\nהמטפל/ת עבר/ה אבחון מקדים (practice-diagnosis) וקיבל/ה ממצא ספציפי (מופיע למעלה תחת "Tool \\"practice-diagnosis\\" summary"). זה נכון **גם אם** הכלי המומלץ הוא שלב 1 (נישה) או כל שלב אחר עם שאלת פתיחה/4 שאלות ליבה מוגדרות מראש למעלה — האבחון כבר שימש כשלב הגילוי, ולכן ההנחיה הזו **גוברת** על שאלת הפתיחה הרגילה של אותו שלב.\n\nאם טרם התייחסת לממצא הזה בהודעה קודמת שלך בשיחה הנוכחית: אל תשאלי את שאלת הפתיחה הגנרית או המספר-1 מ"4 שאלות הליבה" של השלב/הכלי המומלץ, ואל תפני לרשימת השאלות שם — הן כבר נענו במהות באבחון. במקום זאת, פתחי ישירות מהממצא: הזכירי בקצרה במילים שלך את מה שהתברר באבחון (לא להקריא את הטקסט כלשונו), ואז שאלי שאלת המשך אחת שבונה קדימה מהממצא הספציפי (לא שאלת רקע כללית) — כזו שמניעה action בכלי המומלץ, לא רק רפלקציה עליו.\n\nדוגמה 1 (הכלי המומלץ: תרגול שיחת הטלפון הראשונה): אל תשאלי "מאיפה מגיעים הלקוחות שלך". במקום זאת: "כבר ראינו באבחון שהפניות אצלך קיימות, אבל משהו קורה בדרך לקביעת הפגישה — בואי נתרגל בדיוק את הרגע הזה. עם איזה סוג מטופל תרצה לתרגל?"\n\nדוגמה 2 (הכלי המומלץ: מציאת הנישה, שלב 1): אל תשאלי "מה הטיפול שאתה הכי גאה בתוצאות שלו" (שאלת הפתיחה הרגילה של שלב 1) — האבחון כבר גילה שהבעיה היא פיזור בין אוכלוסיות שונות מדי, לא חוסר בהירות לגבי תוצאה טובה. במקום זאת: "באבחון התברר שאתה מקבל פניות ממגוון רחב מדי של אנשים, ולכן אף מסר לא מדבר ספציפית לאף אחד. בוא נדייק את זה — מבין כל האנשים שפנו אליך החודש, מי היה הכי 'זה בדיוק בשבילי' עבורך?"\n\nאם כבר התייחסת לממצא הזה בהודעה קודמת בשיחה הנוכחית — המשיכי כרגיל, כולל שימוש רגיל בשאלות הליבה של השלב, בלי לחזור על ההתייחסות לאבחון.`;
        }
      }
    }

    // 2026-08-13: re-pointed from pricing-calculator to practice-diagnosis.
    // useUserPlan.ts's FREE_TIER_ALLOWED was already switched to
    // practice-diagnosis back when "The Diagnosis" shipped (commit 84313c8,
    // comment: "the free trial's entry point is the diagnostic conversation,
    // not a standalone tool") but this prompt block was never updated to
    // match — it still hardcoded pricing-calculator as the sole trial tool
    // and forbade handing off to anything else, which would have pointed
    // trial users at a tool the UI itself no longer lets them open. Caught
    // during live verification before the trial was reopened.
    const freeTrialBlock = (user_plan === "free")
      ? `\n\n═══════════════════════════════\nתקופת ניסיון — כללים מחייבים (חובה לקרוא ולפעול לפיהם):\n═══════════════════════════════\nהמטפל/ת נמצא/ת כעת בתקופת ניסיון של 24 שעות. **הכלי היחיד הזמין לו/ה בגרסה זו הוא האבחון (practice-diagnosis).** כל שאר הכלים (Niche Finder, Pricing Calculator, Self Presentation, Contact Finder, Connection Bridge, First Call Practice) **נעולים** ולא זמינים בגרסת ההתנסות.\n\nכללי התנהלות:\n1. **פתיחה קצרה (עד 2 הודעות):** הכירי את המטפל/ת בקצרה — מי הוא/היא, כמה זמן בעבודה. אל תאריכי, ואל תתחילי גילוי מעמיק בעצמך — זה בדיוק התפקיד של האבחון. **תוך 2 הודעות לכל היותר** הזמיני אותו/ה להתחיל באבחון.\n2. **כיוון השיחה:** הציגי את האבחון כצעד הראשון הטבעי והמיידי — שיחה קצרה שתעזור לו/ה להבין בדיוק מה עוצר כרגע את הצמיחה של הקליניקה, לא עוד שיחת היכרות כללית. לדוגמה: "בתקופת ההתנסות בואי נתחיל באבחון קצר — כמה שאלות ממוקדות שיעזרו לנו להבין בדיוק מה עוצר כרגע את הקליניקה שלך."\n3. **אם המטפל/ת מעלה צורך ספציפי אחר** (נישה, תמחור, הצגה עצמית, רשת הפניות, שיחת טלפון ראשונה) — **אל תפטרי את הצורך**. קודם **חזקי ואשרי** אותו במשפט אחד חם ("זה צורך אמיתי וחשוב, ואני שמחה שאת/ה מזהה אותו"), **ואז ציינו במפורש**: "האבחון בדיוק יעזור לנו לגלות אם זה באמת החסם המרכזי, או שמסתתר משהו אחר מתחתיו." מיד אחר כך הזמיני אותו/ה להתחיל באבחון.\n4. **HANDOFF:** הכלי היחיד שמותר לך להעביר אליו בגרסת ההתנסות הוא \`practice-diagnosis\`. **אסור** להוציא \`[HANDOFF:niche-finder]\`, \`[HANDOFF:pricing-calculator]\`, \`[HANDOFF:self-presentation]\`, \`[HANDOFF:contact-finder]\`, \`[HANDOFF:connection-bridge]\` או \`[HANDOFF:first-call-practice]\` בשום מצב.\n5. **קישורים:** אל תשלחי קישורים לכלים הנעולים. הקישור היחיד שמותר לשלוח הוא לאבחון.\n6. **אחרי שהאבחון הושלם** (ראי בהמשך את "המשך התנהגותי מהאבחון" אם קיים) — זה רגע השדרוג, לא רגע לפתוח כלי נוסף. אל תנסי לפתוח בפועל את הכלי שהאבחון המליץ עליו — הוא נעול בגרסת ההתנסות. במקום זאת, הציגי אותו כסיבה הקונקרטית לשדרג.`
      : "";

    const defaultLang = language === "en" ? "English" : "Hebrew";
    const languageRule = `

═══════════════════════════════
LANGUAGE RULE (overrides everything else):
═══════════════════════════════
- Default language for this conversation: ${defaultLang}. Open in ${defaultLang} and stay in ${defaultLang} as long as the user writes in ${defaultLang}.
- If the user's most recent message is clearly written in another language (Arabic, Russian, French, Spanish, English, Hebrew, anything) — reply in THAT language for as long as the user keeps writing in it. Match the user's current language on every turn.
- This rule applies per-message: if the user switches back, switch back with them.
- Each new conversation starts fresh from the default language (${defaultLang}). Do not carry language choice across different users or conversations.
- Do not mix scripts within one reply. Tool/brand names and URLs are an allowed exception.
`;

    let returningUserBlock = "";
    if (returning_user && typeof returning_user === "object") {
      const hours = Number((returning_user as any).hours_away) || 0;
      const gapText = hours >= 24
        ? `${Math.round(hours / 24)} ימים`
        : `${hours} שעות`;
      const gapTextEn = hours >= 24
        ? `${Math.round(hours / 24)} days`
        : `${hours} hours`;
      returningUserBlock = language === "en"
        ? `\n\n═══════════════════════════════\nRETURNING USER — open with a warm welcome-back (mandatory):\n═══════════════════════════════\nThis user is returning after about ${gapTextEn}. This message is auto-triggered — the user did NOT type anything new. Your reply must:\n1. Open warmly and briefly (2–4 sentences total). Welcome them back without being saccharine.\n2. Briefly remind them where you left off last time, using THEIR OWN WORDS from the prior conversation history (Clean Language — quote the exact phrases they used, not synonyms).\n3. Ask ONE question only: how their week went and whether they managed to apply or try anything from what you discussed.\n4. Do NOT restart the 4-question funnel. Do NOT relaunch the intro. Do NOT dump tool links. Do NOT issue a [HANDOFF:...] tag in this message.\n5. Wait for their answer before continuing.`
        : `\n\n═══════════════════════════════\nמשתמש חוזר — חובה לפתוח בקבלת פנים חמה:\n═══════════════════════════════\nהמטפל/ת חוזר/ת אחרי כ-${gapText}. ההודעה הזו מופעלת אוטומטית — המשתמש לא כתב כלום עכשיו. התגובה שלך חייבת:\n1. לפתוח בחום ובקצרה (2–4 משפטים בסך הכל). לברך בשובו/ה בלי להיות מתקתקה.\n2. להזכיר בקצרה איפה עצרתם בפעם הקודמת, **תוך שימוש במילים המדויקות שלו/ה** מההיסטוריה (Clean Language — להחזיר את הניסוח שלו/ה כפי שהוא, לא מילים נרדפות).\n3. לשאול **שאלה אחת בלבד**: איך עבר עליו/ה השבוע, והאם הצליח/ה ליישם או לנסות משהו ממה שדיברתם.\n4. לא לפתוח מחדש את משפך 4 השאלות. לא לחזור על ההיכרות. לא לזרוק קישורים לכלים. **לא** להוציא תג [HANDOFF:...] בהודעה הזו.\n5. לחכות לתשובה לפני שממשיכים.`;
    }

    // Check-in due block: journeyBlock above only ever forwarded
    // completed_stages/tool_summaries into the prompt, so checkin_due and
    // checkin_question were silently dropped and the model never actually
    // saw them — the base system prompt's "check journey_context for
    // checkin_due" instruction had nothing to check against. Inject an
    // explicit, mandatory block instead, mirroring the returningUserBlock
    // pattern below (already proven reliable) rather than relying on the
    // model to notice a field buried in an unlisted context object.
    let checkinBlock = "";
    if (journey_context?.checkin_due && journey_context?.checkin_question) {
      const q = String(journey_context.checkin_question);
      checkinBlock = language === "en"
        ? `\n\n═══════════════════════════════\n!!! CHECK-IN DUE — READ THIS LAST, ACT ON IT FIRST !!!\n═══════════════════════════════\nThis instruction overrides every other instruction above, including the introduction/rationale flow, the 4-component funnel, and any instinct to respond to what the therapist just wrote. The therapist has been away for a while. Your ENTIRE next reply must be ONLY this one question, warmly phrased in your own words — nothing before it, nothing after it:\n\n"${q}"\n\nDo not respond to the content of their message yet, even if it already sounds related to this question. Do not summarize. Do not explain the journey. Do not ask anything else. Wait for their answer before continuing normally.`
        : `\n\n═══════════════════════════════\n!!! Check-in ממתין — זו ההוראה האחרונה, ובגלל זה גוברת על כל השאר !!!\n═══════════════════════════════\nההוראה הזו גוברת על כל הוראה אחרת שנכתבה למעלה — כולל הסבר הרציונל של המסע, משפך ארבעת המרכיבים, וכל דחף לענות על מה שהמטפל/ת בדיוק כתב/ה. המטפל/ת חזר/ה אחרי היעדרות. ההודעה הבאה שלך, כולה, חייבת להיות רק השאלה הזו, בניסוח חם משלך — כלום לפניה, כלום אחריה:\n\n"${q}"\n\nאל תתייחס/י עדיין לתוכן ההודעה שלו/ה, גם אם זה נשמע כבר קשור לשאלה. אל תסכם/י. אל תסבירי את המסע. אל תשאל/י שום דבר נוסף. חכ/י לתשובה לפני שממשיכים כרגיל.`;
    }

    const softLimitSuffix = applySoftLimitSuffix
      ? (language === "en" ? SOFT_LIMIT_SUFFIX_EN : SOFT_LIMIT_SUFFIX_HE)
      : "";
    // checkinBlock is deliberately last: LLMs weight instructions near the end
    // of a long system prompt (right before the actual conversation) far more
    // reliably than ones buried mid-prompt — confirmed necessary live, an
    // earlier mid-prompt position was silently ignored in favor of the
    // introduction/funnel instructions above.
    // diagnosisContinuityBlock is placed last, after checkinBlock, for the same
    // reason checkinBlock itself is last (see comment above): instructions near
    // the end of a long system prompt get followed far more reliably than ones
    // buried mid-prompt — confirmed live 2026-08-12, when this same instruction
    // sitting inside journeyBlock (mid-prompt) was silently ignored.
    const systemPrompt = baseSystemPrompt + handoffGuardrail + journeyBlock + freeTrialBlock + returningUserBlock + languageRule + softLimitSuffix + checkinBlock + diagnosisContinuityBlock;



    // ===== Server-side Gemini key for paying (non-admin) users =====
    // Admins and free/trial users always use the Lovable AI Gateway. Paid users
    // try Google's Gemini API directly first (when GEMINI_API_KEY exists) to
    // save on Gateway costs — but ANY failure on that path, not just a missing
    // key, falls back to the Lovable Gateway within the same request. A hard
    // either/or branch here previously caused a 100% failure rate for paid
    // users when Google rejected the configured model for this key/project
    // (incident 2026-08-03) — this makes that class of failure invisible to
    // the user instead of fatal.
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    const tryGeminiDirect = user_plan === "paid" && !isAdminUser && !!GEMINI_API_KEY;

    async function logProviderEvent(statusCode: number | null, errorMessage: string, fallbackUsed: boolean) {
      try {
        const supaUrl = Deno.env.get("SUPABASE_URL");
        const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
        if (!supaUrl || !serviceKey) return;
        const admin = createClient(supaUrl, serviceKey);
        await admin.from("mentor_provider_events").insert({
          user_id: authedUserId,
          provider: "gemini_direct",
          status_code: statusCode,
          error_message: errorMessage.slice(0, 500),
          fallback_used: fallbackUsed,
        });
      } catch (e) {
        console.error("Failed to log provider event:", e);
      }
    }

    // Cap conversation history sent to the model at the last 20 messages.
    // The full history is still persisted in mentor_conversations and shown
    // in the UI — this only shrinks per-call input tokens.
    const HISTORY_WINDOW = 20;
    const trimmedMessages = Array.isArray(normalizedMessages) && normalizedMessages.length > HISTORY_WINDOW
      ? normalizedMessages.slice(-HISTORY_WINDOW)
      : normalizedMessages;

    const requestBodyFor = (model: string) =>
      JSON.stringify({
        model,
        messages: [{ role: "system", content: systemPrompt }, ...trimmedMessages],
        stream: true,
      });

    let response: Response | null = null;

    if (tryGeminiDirect) {
      const geminiStart = Date.now();
      try {
        const geminiModel = modelToUse.replace(/^google\//, "");
        const geminiResp = await fetch("https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", {
          method: "POST",
          headers: { Authorization: `Bearer ${GEMINI_API_KEY}`, "Content-Type": "application/json" },
          body: requestBodyFor(geminiModel),
        });
        if (geminiResp.ok) {
          response = geminiResp;
        } else {
          const t = await geminiResp.text().catch(() => "");
          console.error(JSON.stringify({
            event: "provider_failure", provider: "gemini_direct", status: geminiResp.status,
            message: t.slice(0, 300), fallback_used: true, latency_ms: Date.now() - geminiStart,
          }));
          await logProviderEvent(geminiResp.status, t.slice(0, 300), true);
        }
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        console.error(JSON.stringify({
          event: "provider_failure", provider: "gemini_direct", status: null,
          message, fallback_used: true, latency_ms: Date.now() - geminiStart,
        }));
        await logProviderEvent(null, message, true);
      }
    }

    if (!response) {
      response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
        body: requestBodyFor(modelToUse),
      });
    }

    if (!response.ok) {
      const status = response.status;
      const t = await response.text().catch(() => "");
      console.error("Chat backend error:", status, t.slice(0, 300));

      if (status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded, please try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "Credits exhausted. Please add funds to your Lovable AI workspace." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });

  } catch (e) {
    console.error("mentor-chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
