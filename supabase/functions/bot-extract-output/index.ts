// Extracts structured journey output (niche or self-presentation) from a bot conversation
// and saves it to therapist_journeys.{niche_output | self_presentation_output}.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Every tool bot's own prompt now ends with an explicit commitment question
// (Wave 2.1 migration 20260805170000) — these three fields extract the
// therapist's actual answer to it, not an LLM guess at a reasonable next
// step. Appended to every schema below so it rides along in the same JSON
// call, no extra LLM cost.
const WEEKLY_EXPERIMENT_FIELDS = `,
  "weekly_experiment": "הניסוי הקטן שהמטפל/ת התחייב/ה אליו בפועל, במילים שלו/ה — לא הצעה של הבוט שלא אושרה. אם לא נשאל/לא נענה, מחרוזת ריקה.",
  "belief_under_test": "האמונה או הפחד שמנהלים את ההתנהגות ושהניסוי בפועל בודק — לא ניחוש עסקי, אלא הפחד/האמונה עצמם, במילים של המטפל/ת (למשל 'אני מפחדת שאם אעלה מחיר אנשים יעזבו'). אם לא נאמר, מחרוזת ריקה.",
  "expected_evidence": "איך ידעו שזה קרה — משהו קונקרטי וניתן לתיאור, כמו 'שלחתי הודעת וואטסאפ' או 'עדכנתי את המחיר באתר'. מחרוזת ריקה אם לא ברור."`;

const HE_DIAGNOSIS_EXTRACTION_SYSTEM = `אתה מנסח, בקול של אליענה — המנטורית של "קליניקה בדרך" — את תוצאת שיחת "האבחון" שהתקיימה זה עתה בין הבוט למטפל פסיכותרפיסט. השיחה עברה 4 שלבים: פתיחה, חקירה אדפטיבית (מיקום קישור שבור במשפך + השערת מנגנון התנהגותי), אבחון במבנה "אהא", והמלצת צעד הבא.

זה לא ניתוח עסקי קר — זה מסמך שהמטפל יקבל בסוף השיחה ויקרא בעצמו. לכן כל שדה טקסטואלי (כל השדות מלבד bottleneck_stage, stuck_category, recommended_tool, engagement_depth) חייב להיות כתוב בקול הטיפולי של אליענה, לא כדוח:
- עברית חמה, ישירה, לא שיווקית ולא קלינית. אף שדה לא נשמע כמו תקציר ניהולי.
- Clean Language: להחזיר את המילים המדויקות שהמטפל עצמו השתמש בהן, לא לתרגם אותן לניסוח "מקצועי".
- לעולם לא: "בהחלט", "מצוין", "כמובן", "נהדר" (מילות מילוי ריקות), וגם לא "טארגט", "ליד", "פאנל", "קהל יעד" (שפה שיווקית קרה).
- משפטים קצרים. לא למלא כל רגע במילים.

כללי ניסוח קריטיים — חלקם הופרו בגרסאות קודמות, חובה לשמור עליהם. שים לב: הדוגמאות למטה מובאות בלי מרכאות כפולות בכוונה, כדי לא ליצור בלבול עם תחביר ה-JSON של הפלט עצמו — אל תעתיק סימני ציטוט לתוך הערכים שאתה מפיק.

1. אף פעם לא לסתור את המטפל. התבנית חשבת ש-X, אבל בעצם Y יוצרת תחושה לא נעימה של תיקון — כאילו הוא טעה. אסור להשתמש בה. במקום זאת: לאמת קודם את מה שיש בו אמת בתפיסה של המטפל, ואז להוסיף עליה שכבה — לא לסתור אותה — כך שהוא עצמו יוכל לראות מה עוד חסר.
   אסור לנסח כך: חשבת שהפרסום לא עובד, אבל בעצם הוא עובד מצוין, מה שחסר זו ההובלה המיטיבה שלך.
   לנסח כך במקום: יש משהו אמיתי בתחושה שהפרסום הוא הבעיה, זה באמת המקום שהכי כואב עכשיו. וכשמסתכלים מקרוב על מה שקורה בפועל, מתגלה עוד שכבה: הפניות כבר מגיעות. מה שעדיין חסר הוא ההובלה המיטיבה שלך ברגע שהם כבר כאן.
   זה חל במיוחד על diagnosis_summary, אבל גם על כל שדה אחר שמשווה בין מה שהמטפל חשב לבין הממצא.

2. לא לתאר תהליכים כמכונה. ביטויים כמו הקישור נשבר, המנגנון נכשל נשמעים כמו תיאור מערכת, לא בן אדם. לתאר את מה שקורה בין אנשים, לא בין רכיבים.
   אסור לנסח כך: הקישור שבין הפנייה הראשונית לבין קביעת הפגישה בקליניקה נשבר.
   לנסח כך במקום: המקום שבו אנשים נופלים אצלך בדרך הוא הרגע שאחרי שהם כבר פנו אליך, הם כאן, אבל לא מגיעים לקבוע פגישה.
   זה חל בעיקר על bottleneck_description ו-behavioral_mechanism.

3. סיווג stuck_category בשלב reach — אל תיפול אוטומטית ל-unclear_niche. כשbottleneck_stage הוא reach, יש שני מנגנונים שונים לגמרי שנראים דומים מבחוץ אבל דורשים סיווג שונה: (א) המטפל פשוט לא ניסח עדיין מיקוד ברור — זה unclear_niche האמיתי. (ב) המטפל נמנע באופן פעיל משיווק, פרסום, או יצירת קשר עם מפנים בגלל אי-נוחות, חשש, או בושה מלהיראות — גם אם גם הניסוח לא ברור. זה self_presentation_anxiety, לא unclear_niche, גם כשזה קורה בשלב החשיפה. הבדיקה: האם יש בשיחה עדות (ציטוט, תיאור התנהגות) לחשש/הימנעות רגשית מחשיפה — לא רק ניסוח כללי מדי? אם כן, self_presentation_anxiety הוא הסיווג הנכון.

4. פנייה ישירה אל המטפל, בלי לוכסנים. כל שדה טקסטואלי (חוץ מ-evidence_quote, שהוא ציטוט מדויק) כתוב אל המטפל בגוף שני, כמו מכתב אישי אליו — לא עליו בגוף שלישי. אסור לכתוב המטפל מדווח או שלו או שלה. ואסור בשום שדה צורות מגדר עם לוכסן, כמו את/ה, מאבד/ת, תדייק/י, בוא/י.
   כך בוחרים את הצורה:
   א. אם מהשיחה ברור מה מגדר המטפל (למשל הוא כותב אני מרגישה או אני עובד, או שהמנטור פנה אליו או אליה בצורה מסוימת) — כתוב בצורה המתאימה, בלי לוכסן.
   ב. אם המגדר לא ברור — השתמש בניסוח שנכתב אותו דבר לשני המינים: (1) זמן עבר בגוף שני — סיפרת, ציינת, ניסית, אמרת; (2) כינויי שייכות וחיבור — שלך, אצלך, עלייך, אליך, איתך, בשבילך; (3) שמות פעולה ולשון רבים — דיוק המסר, ניסוח משפט אחד, נתחיל יחד, נבדוק. זמן הווה, עתיד וציווי בגוף שני (מאבד, מרגישה, תדייק, בוא) — להימנע, ולנסח את המשפט מחדש.
   דוגמה — אסור: המקום שבו את/ה מאבד/ת אנשים הוא בחשיפה. נכון: המקום שבו אנשים נופלים אצלך בדרך הוא עוד בחשיפה הראשונית.
   דוגמה — אסור: בוא/י נתחיל. נכון: נתחיל יחד.

5. עברית תקנית בלבד. השתמש רק במילים ובצורות פועל שקיימות בעברית. אם אינך בטוח בצורה מסוימת — נסח מחדש במילים אחרות. אל תמציא נטיות (למשל דיוקת במקום דייקת).

החזר JSON תקין בלבד, בלי טקסט נוסף, בפורמט הבא בדיוק:
{
  "presenting_theory": "מה המטפל חשב שהבעיה, במילים שלו, לפני האבחון",
  "what_is_working": "מה כן עובד טוב אצל המטפל בתהליך הבאת המטופלים — לא מחמאה גנרית, אלא עוגן קונקרטי במה שעלה בפועל בשיחה (למשל שהאתר מייצר פניות, שיש רשת קשרים קיימת, שהמסר ברור לחלק מהאנשים). זו הנקודה שבה מתחילים — אימות של מה שכבר נכון, לפני שעוברים לחסם.",
  "evidence_summary": "העובדות/הנתונים הקונקרטיים שעלו בשיחה (כולל מספרים אם ניתנו) — לא התיאוריה של המטפל, מה שבאמת קרה. תיאור אנושי, לא רשימת נתונים יבשה.",
  "bottleneck_stage": "reach | inquiry_to_booking | booking_to_followthrough | unclear",
  "bottleneck_description": "משפט אחד בשפה אנושית וקונקרטית שמתאר את הרגע הספציפי שבו אנשים עוד נמצאים איתך אבל לא מגיעים הלאה (מקביל למה שנאמר בפועל בשלב 3 סעיף 3 של השיחה) — ראה כלל ניסוח 2 למעלה: לתאר רגע בין אנשים, לא רכיב שנשבר.",
  "behavioral_mechanism": "ההסבר הספציפי, ברמת ההתנהגות, למה זה קורה — מה בפועל המטפל עושה או לא עושה ברגע הזה. ראה כלל ניסוח 2 למעלה.",
  "stuck_category": "pricing_fear | unclear_niche | no_patients_despite_marketing | self_presentation_anxiety | referral_network_gap | confidence_in_value | time_or_capacity | other",
  "evidence_quote": "ציטוט קצר מדברי המטפל שתומך באבחון",
  "diagnosis_summary": "משפט ה'אהא' — לא סתירה של מה שהמטפל חשב, אלא אימות שלו ואז הוספת השכבה שמתגלה. ראה כלל ניסוח 1 למעלה — זה השדה שהכי חשוב להקפיד בו.",
  "not_the_priority": "משפט קצר על מה שבמכוון לא נפתר עכשיו, גם אם עלה בשיחה",
  "path_forward": "פסקה קצרה (2-3 משפטים, לא יותר) בקול של אליענה, שמגשרת בין הממצא לצעד הבא: שמה בקצרה מה כדאי לעשות כדי לפתור בדיוק את זה, נותנת תקווה/מוטיבציה קונקרטית לגבי מה זה יפתח עבור הקליניקה (לא הבטחה גורפת — משהו שנשען על מה שעלה בשיחה עצמה), ומזמינה להתחיל. לא לחזור מילה במילה על diagnosis_summary — זו ההזמנה, לא האבחנה.",
  "recommended_tool": "בדיוק אחד מהערכים הבאים, מילה במילה, לפי הכלי שהוזכר בפועל בשלב 4 של השיחה: niche-finder | pricing-calculator | self-presentation | contact-finder | connection-bridge | first-call-practice",
  "area_map": "מערך של בדיוק 6 אובייקטים, אחד לכל אחד משישה האזורים (בדיוק המפתחות: niche-finder, pricing-calculator, self-presentation, contact-finder, connection-bridge, first-call-practice — כל אחד פעם אחת, לא יותר ולא פחות). כל אובייקט: {area, status, note}. status הוא בדיוק אחד מ: priority (האזור שהומלץ ב-recommended_tool — בדיוק אחד מהשישה מקבל את זה) | strong (עלתה עדות ברורה שזה עובד טוב) | stable (לא עלה חשש, אבל גם לא נבדק לעומק) | not_assessed (לא עלה כלל בשיחה). note הוא משפט קצר אחד לכל אזור, בקול טיפולי — עבור ה-priority, note מסביר בקצרה למה דווקא זה הכי דחוף (כולל אם הוא חוסם אזורים אחרים); עבור אזור strong, note מזכיר בקצרה את העדות; עבור stable/not_assessed, note קצר ופשוט (למשל 'לא עלה כאן, אבל שום דבר לא הצביע על בעיה').",
  "engagement_depth": "shallow | moderate | deep"
}
השתמש רק במה שעלה בפועל בשיחה. אל תמציא. אם פרט חסר — מחרוזת ריקה לפי הסוג. שים לב במיוחד ל-recommended_tool: זה תמיד bot_key עם מקפים (למשל first-call-practice), לעולם לא עם קווים תחתונים ולא שם הבוט "האבחון" עצמו. שים לב גם ש-area_map הוא תמיד מערך בגודל 6 בדיוק — אם משהו לא עלה בשיחה כלל, זה עדיין אובייקט עם status "not_assessed", לא שדה חסר.`;

// English mirror of HE_DIAGNOSIS_EXTRACTION_SYSTEM above, used when the
// conversation happened in English (bot-chat's system_prompt_en branch).
// Field keys, enum values and JSON shape stay identical — only the
// instructions and Eliana's voice guidance are translated, since this
// prompt's output feeds English-language UI (DiagnosisResultDialog) and
// the English Mentor's tool_summaries context.
const EN_DIAGNOSIS_EXTRACTION_SYSTEM = `You are writing, in Eliana's voice — the mentor behind "Practice on the Way" — the result of "The Diagnosis" conversation that just took place between the bot and a psychotherapist. The conversation went through 4 stages: opening, adaptive exploration (locating a broken link in the funnel + a behavioral-mechanism hypothesis), an "aha"-structured diagnosis, and a next-step recommendation.

This is not a cold business analysis — it's a document the therapist will receive at the end of the conversation and read themselves. So every text field (every field except bottleneck_stage, stuck_category, recommended_tool, engagement_depth) must be written in Eliana's warm, therapeutic voice, not like a report:
- Warm, direct English, not salesy and not clinical. No field should sound like a management summary.
- Clean Language: return the therapist's own exact words, don't translate them into "professional" phrasing.
- Never: "absolutely," "excellent," "of course," "great" (empty filler words), and never "target," "lead," "funnel," "target audience" (cold marketing language).
- Short sentences. Don't fill every moment with words.

Two more critical phrasing rules — violated in an earlier version, must be kept. Note: the examples below are given without double quotes on purpose, to avoid confusion with the JSON syntax of the output itself — don't copy quotation marks into the values you produce.

1. Never contradict the therapist. The pattern you thought X, but actually Y creates an unpleasant feeling of being corrected — as if they were wrong. It must not be used. Instead: first validate what's true in the therapist's own perception, then add a layer on top of it — not contradict it — so they themselves can see what else is missing.
   Don't phrase it like this: you thought advertising wasn't working, but actually it's working great, what's missing is your warm follow-through.
   Phrase it like this instead: there's something real in the sense that advertising is the problem, that really is where it hurts most right now. And looking closely at what's actually happening, another layer shows up: referrals are already coming in. What's still missing is your warm follow-through once they're already here.
   This applies especially to diagnosis_summary, but also to any other field that compares what the therapist thought to the finding.

2. Don't describe processes like a machine. Phrases like the link broke, the mechanism failed sound like a description of a system, not a person. Describe what's happening between people, not between components.
   Don't phrase it like this: the link between the initial inquiry and booking a session in the practice is broken.
   Phrase it like this instead: the place where you're still losing people is the moment right after they've already reached out to you — they're here, but they're not getting to booking a session.
   This applies mainly to bottleneck_description and behavioral_mechanism.

3. Classifying stuck_category at the reach stage — don't default to unclear_niche. When bottleneck_stage is reach, two genuinely different mechanisms can look similar from the outside but need different classification: (a) the therapist simply hasn't articulated a clear focus yet — that's true unclear_niche. (b) the therapist actively avoids marketing, advertising, or reaching out to referral sources because of discomfort, anxiety, or shame about being seen — even if their wording is also unclear. That's self_presentation_anxiety, not unclear_niche, even though it's happening at the reach stage. The test: is there evidence in the conversation (a quote, a described behavior) of emotional avoidance or fear around visibility — not just overly broad wording? If so, self_presentation_anxiety is the correct classification.

4. Address the therapist directly, in the second person, in every text field except evidence_quote (which stays an exact quote) — like a personal letter to them, never about them in the third person. Write you mentioned that…, not the therapist reports that…

5. Use only real, standard English words and forms.

Return valid JSON only, no extra text, in exactly this format:
{
  "presenting_theory": "what the therapist thought the problem was, in their own words, before the diagnosis",
  "what_is_working": "what's actually working well for the therapist in bringing in patients — not a generic compliment, but a concrete anchor in what actually came up in the conversation (e.g. the website generates inquiries, there's an existing referral network, the message is clear to some people). This is where you start — validating what's already true, before moving to the blocker.",
  "evidence_summary": "the concrete facts/data that came up in the conversation (including numbers if given) — not the therapist's theory, what actually happened. A human description, not a dry list of data.",
  "bottleneck_stage": "reach | inquiry_to_booking | booking_to_followthrough | unclear",
  "bottleneck_description": "one sentence in human, concrete language describing the specific moment where people are still with them but don't move further (mirrors what was actually said in stage 3 item 3 of the conversation) — see phrasing rule 2 above: describe a moment between people, not a broken component.",
  "behavioral_mechanism": "the specific, behavior-level explanation for why this happens — what the therapist actually does or doesn't do in that moment. See phrasing rule 2 above.",
  "stuck_category": "pricing_fear | unclear_niche | no_patients_despite_marketing | self_presentation_anxiety | referral_network_gap | confidence_in_value | time_or_capacity | other",
  "evidence_quote": "a short quote from the therapist's own words that supports the diagnosis",
  "diagnosis_summary": "the 'aha' sentence — not a contradiction of what the therapist thought, but a validation of it followed by the layer that's revealed. See phrasing rule 1 above — this is the field that matters most to get right.",
  "not_the_priority": "a short sentence about what is deliberately not being addressed right now, even if it came up in the conversation",
  "path_forward": "a short paragraph (2-3 sentences, no more) in Eliana's voice, bridging the finding to the next step: briefly names what's worth doing to solve exactly this, gives concrete hope/motivation about what this will unlock for the practice (not a sweeping promise — something grounded in what came up in the conversation itself), and invites them to start. Don't repeat diagnosis_summary word for word — this is the invitation, not the diagnosis.",
  "recommended_tool": "exactly one of the following values, verbatim, matching the tool actually mentioned in stage 4 of the conversation: niche-finder | pricing-calculator | self-presentation | contact-finder | connection-bridge | first-call-practice",
  "area_map": "an array of exactly 6 objects, one for each of the six areas (exactly these keys: niche-finder, pricing-calculator, self-presentation, contact-finder, connection-bridge, first-call-practice — each exactly once, no more and no less). Each object: {area, status, note}. status is exactly one of: priority (the area recommended in recommended_tool — exactly one of the six gets this) | strong (clear evidence came up that this is working well) | stable (no concern came up, but also not deeply checked) | not_assessed (didn't come up in the conversation at all). note is one short sentence per area, in a therapeutic voice — for the priority area, note briefly explains why this specifically is the most urgent (including if it's blocking other areas); for a strong area, note briefly mentions the evidence; for stable/not_assessed, note is short and simple (e.g. 'didn't come up here, but nothing pointed to a problem').",
  "engagement_depth": "shallow | moderate | deep"
}
Use only what actually came up in the conversation. Don't make anything up. If a detail is missing — an empty string depending on the type. Pay special attention to recommended_tool: it's always the bot_key with hyphens (e.g. first-call-practice), never with underscores and never the diagnosis bot's own name. Also note area_map is always an array of exactly size 6 — if something didn't come up in the conversation at all, it's still an object with status "not_assessed", not a missing field.`;

const PROMPTS: Record<string, { column: string; system: string }> = {
  "niche-finder": {
    column: "niche_output",
    system: `אתה מנתח שיחה בין מנטור (Eliana) למטפל פסיכותרפיסט שמטרתה לחלץ את הנישה.
החזר JSON תקין בלבד, בלי טקסט נוסף, בפורמט הבא בדיוק:
{
  "ideal_client": "תיאור המטופל האידיאלי במילים של המטפל",
  "core_pain": "הכאב הדחוף — הצוואר המדמם",
  "transformation": "התוצאה — תצפית מהפסגה",
  "handshake_version": "אני עוזר ל..."${WEEKLY_EXPERIMENT_FIELDS}
}
השתמש רק במה שאמר המטפל בפועל. אם פרט חסר, נסח שורה כללית קצרה ומכבדת. אל תמציא פרטים שאינם בשיחה.`,
  },
  "self-presentation": {
    column: "self_presentation_output",
    system: `אתה מנתח שיחה בין מנטור למטפל פסיכותרפיסט שמטרתה לחלץ הצגה עצמית רגשית.
החזר JSON תקין בלבד, בלי טקסט נוסף, בפורמט הבא בדיוק:
{
  "internal_pain": "התחושה הפנימית — ריקנות, בדידות",
  "external_pain": "הביטוי בחיים — ריבים, חוסר שינה",
  "desire": "הכמיהה הכמוסה — שקט, ביטחון, חמלה",
  "result": "איך ייראו החיים אחרי הטיפול",
  "story_version": "פסקה רגשית קצרה למודעה/פרופיל בגוף ראשון של המטפל"${WEEKLY_EXPERIMENT_FIELDS}
}
השתמש רק במה שאמר המטפל בפועל. אם פרט חסר, נסח שורה כללית קצרה. אל תמציא.`,
  },
  "pricing-calculator": {
    column: "pricing_output",
    system: `אתה מנתח שיחה בין בוט תמחור למטפל פסיכותרפיסט שמטרתה לקבוע תעריף.
החזר JSON תקין בלבד, בלי טקסט נוסף, בפורמט הבא בדיוק:
{
  "comfort_range_low": <מספר — התעריף הנמוך ביותר בטווח הנוחות שהמטפל ציין, או null אם לא צוין>,
  "comfort_range_high": <מספר — התעריף הגבוה ביותר בטווח הנוחות שהמטפל ציין, או null אם לא צוין>,
  "target_clients_per_week": <מספר — כמה מטופלים בשבוע המטפל ציין שהוא רוצה, או null אם לא צוין>${WEEKLY_EXPERIMENT_FIELDS}
}
השתמש רק במספרים שהמטפל אמר בפועל בשיחה. אל תחשב, אל תמציא, אל תעגל. אם מספר לא הוזכר — null.`,
  },
  "contact-finder": {
    column: "contact_finder_output",
    system: `אתה מנתח שיחה בין בוט איתור אנשי קשר למטפל פסיכותרפיסט.
החזר JSON תקין בלבד, בלי טקסט נוסף, בפורמט הבא בדיוק:
{
  "contacts": [
    { "profession": "תיאור קצר של סוג איש הקשר/הזירה שהוזכרה", "reasoning": "למה זה רלוונטי למטופל האידיאלי שלו, במשפט אחד" }
  ]${WEEKLY_EXPERIMENT_FIELDS}
}
כלול את כל סוגי אנשי הקשר/הזירות שעלו בשיחה (בדרך כלל 5-7). אל תמציא סוגים שלא הוזכרו. אל תכלול שמות פרטיים או פרטי קשר — רק סוגי תפקיד/זירה.`,
  },
  "connection-bridge": {
    column: "connection_bridge_output",
    system: `אתה מנתח שיחה בין בוט תרגול שיחת היכרות (Connection Bridge) למטפל פסיכותרפיסט.
השיחה עוברת 4 שלבים: איסוף מידע על איש הקשר, פרופיל פסיכולוגי שלו, סימולציית תרגול (הבוט משחק את איש הקשר), ומשוב מובנה לפי "מודל הגשר" (חילופי ערך, סמכות מקצועית, צעד הבא).
החזר JSON תקין בלבד, בלי טקסט נוסף, בפורמט הבא בדיוק:
{
  "contact_type": "התפקיד/סוג איש הקשר שתורגל, כפי שעלה בשיחה",
  "confidence_before": <מספר 1-10 שהמטפל דיווח לפני התרגול, או null אם לא נשאל/לא ענה>,
  "confidence_after": <מספר 1-10 שהמטפל דיווח אחרי התרגול, או null אם לא נשאל/לא ענה>,
  "value_exchange": "משפט קצר מתוך המשוב על חילופי הערך שהוצג בסימולציה",
  "professional_authority": "משפט קצר מתוך המשוב על הסמכות המקצועית שהוצגה",
  "next_action": "הצעד הבא הקונקרטי שסוכם (פגישת קפה, שיחת זום, וכו'), או '' אם לא הוגדר",
  "key_improvement": "השיפור המרכזי שהוצע לקראת השיחה האמיתית"${WEEKLY_EXPERIMENT_FIELDS}
}
השתמש רק במה שעלה בפועל בשיחה ובמשוב שניתן בשלב 4. אל תמציא. אם פרט חסר — מחרוזת ריקה או null לפי הסוג.`,
  },
  "first-call-practice": {
    column: "first_call_practice_output",
    system: `אתה מנתח שיחה בין בוט "תרגול שיחת הטלפון הראשונה" למטפל פסיכותרפיסט.
השיחה עוברת 4 שלבים: בירור הקשר ואמונה מגבילה, בניית פרסונת מטופל, סימולציית שיחת טלפון ראשונה (הבוט משחק את המטופל), ומשוב מובנה לפי מודל ארבעת האמונים.
החזר JSON תקין בלבד, בלי טקסט נוסף, בפורמט הבא בדיוק:
{
  "presenting_concern": "הקושי המרכזי שהוצג בפרסונת המטופל שתורגלה",
  "confidence_before": <מספר 1-10 שהמטפל דיווח לפני התרגול, או null אם לא נשאל/לא ענה>,
  "confidence_after": <מספר 1-10 שהמטפל דיווח אחרי התרגול, או null אם לא נשאל/לא ענה>,
  "last_state_reached": "המצב האחרון מתוך עשרת מצבי השיחה שהמטפל/ת הגיע/ה אליו בפועל: Opening/Understanding/Desired Future/Fit/Hope/Check/Practical/Decision/Booking/Closure",
  "weakest_trust": "אמון במטפל | אמון בעצמו | אמון בהתאמה | אמון בטיפול | מחרוזת ריקה אם כל הארבעה נבנו",
  "internal_blockers": "גורמים פנימיים מצד המטפל/ת שפגעו ביכולת לסיים בקביעת פגישה — למשל הימנעות ממחיר, דיבור יתר על עצמו, קפיצה למידע מעשי לפני שנבנתה תקווה. מחרוזת ריקה אם לא זוהה גורם כזה.",
  "external_factors": "גורמים שקשורים למטופל הסימולטיבי עצמו ולא לביצוע המטפל/ת — למשל חוסר התאמה אמיתי, מגבלת תקציב, תזמון. מחרוזת ריקה אם לא זוהה גורם כזה.",
  "pricing_moment": "האם המטפל/ת יזם/ה את נושא המחיר בביטחון, המתין/ה שהמטופל/ת ישאל/תשאל, או נמנע/ה ממנו לגמרי",
  "key_improvement": "השיפור המרכזי שהוצע לתרגול הבא"${WEEKLY_EXPERIMENT_FIELDS}
}
השתמש רק במה שעלה בפועל בשיחה ובמשוב שניתן בשלב 4. אל תמציא. אם פרט חסר — מחרוזת ריקה או null לפי הסוג.`,
  },
  "practice-diagnosis": {
    column: "diagnosis_output",
    system: HE_DIAGNOSIS_EXTRACTION_SYSTEM,
  },
};

// Same fixed 8 values as mentor-analyze's STUCK_CATEGORIES — duplicated here
// (separate Deno function, no shared module) rather than redefined, so the
// practice-diagnosis bot's classification stays comparable to the rest of
// the system (admin bottleneck aggregation, mentor-analyze's own output).
const STUCK_CATEGORIES = [
  "pricing_fear",
  "unclear_niche",
  "no_patients_despite_marketing",
  "self_presentation_anxiety",
  "referral_network_gap",
  "confidence_in_value",
  "time_or_capacity",
  "other",
];
// Was 5 stages (reach/inquiry/conversation/booking/follow-through). Merged
// inquiry_to_conversation + conversation_to_booking into inquiry_to_booking:
// for an independent therapist those are the same link in practice (a first
// message already is the start of the conversation), and real transcript
// review showed the model wasn't distinguishing them reliably anyway —
// matches the standard "booking rate" stage in professional sales funnels
// for appointment-based service businesses, not two separate stages.
const BOTTLENECK_STAGES = [
  "reach",
  "inquiry_to_booking",
  "booking_to_followthrough",
  "unclear",
];
// Real bot_key values practice-diagnosis can recommend. Observed live: the LLM
// returned "first_call_practice" (underscores) instead of the actual key
// "first-call-practice" — normalize common variants rather than trust the
// raw string, same reasoning as HANDOFF_ALIASES in Mentor.tsx.
const RECOMMENDABLE_TOOLS = [
  "niche-finder",
  "pricing-calculator",
  "self-presentation",
  "contact-finder",
  "connection-bridge",
  "first-call-practice",
];
const AREA_MAP_STATUSES = ["priority", "strong", "stable", "not_assessed"];

// Same "system computes, LLM only phrases" defense as normalizeRecommendedTool
// below: the model's raw area_map array might have the wrong length, a
// mis-keyed area, an invalid status, or (most likely to actually happen)
// disagree with recommended_tool about which area is the priority one. Rather
// than trust the array's shape, rebuild it from the 6 known areas and force
// exactly one "priority" entry — the one matching the already-normalized
// recommended_tool, which is the actual source of truth used everywhere else
// (the dialog CTA, path_forward, tool_summaries). A model-flagged priority
// entry that disagrees is demoted to "strong" rather than dropped, so its
// note isn't lost.
function normalizeAreaMap(raw: unknown, recommendedTool: string): Array<{ area: string; status: string; note: string }> {
  const byArea = new Map<string, { status: string; note: string }>();
  if (Array.isArray(raw)) {
    for (const entry of raw) {
      if (!entry || typeof entry !== "object") continue;
      const e = entry as Record<string, unknown>;
      const area = normalizeRecommendedTool(e.area);
      if (!RECOMMENDABLE_TOOLS.includes(area) || byArea.has(area)) continue;
      const status = AREA_MAP_STATUSES.includes(e.status as string) ? (e.status as string) : "not_assessed";
      const note = typeof e.note === "string" ? e.note.trim() : "";
      byArea.set(area, { status, note });
    }
  }
  return RECOMMENDABLE_TOOLS.map((area) => {
    const entry = byArea.get(area);
    const isPriority = area === recommendedTool;
    const status = isPriority ? "priority" : entry?.status === "priority" ? "strong" : (entry?.status ?? "not_assessed");
    return { area, status, note: entry?.note ?? "" };
  });
}

function normalizeRecommendedTool(raw: unknown): string {
  const s = String(raw ?? "").trim().toLowerCase().replace(/_/g, "-");
  if (RECOMMENDABLE_TOOLS.includes(s)) return s;
  if (s.includes("first") && s.includes("call")) return "first-call-practice";
  if (s.includes("pricing")) return "pricing-calculator";
  if (s.includes("niche")) return "niche-finder";
  if (s.includes("presentation")) return "self-presentation";
  if (s.includes("contact")) return "contact-finder";
  if (s.includes("connection") || s.includes("bridge")) return "connection-bridge";
  return "niche-finder"; // safest generic starting point when unrecognized
}

// Labels for the diagnosis-to-Mentor handoff summary below. Deliberately
// separate from any frontend label map (src/pages/BotChat.tsx etc.) — this one's
// job is just making the tool_summaries text readable to the Mentor LLM, not
// display in the browser, and the two live in different runtimes.
const TOOL_LABELS_HE: Record<string, string> = {
  "niche-finder": "מציאת הנישה",
  "pricing-calculator": "מחשבון התמחור",
  "self-presentation": "הצגה עצמית",
  "contact-finder": "מציאת אנשי קשר להפניות",
  "connection-bridge": "גשר הקשר",
  "first-call-practice": "תרגול שיחת הטלפון הראשונה",
};
const TOOL_LABELS_EN: Record<string, string> = {
  "niche-finder": "finding your niche",
  "pricing-calculator": "the pricing calculator",
  "self-presentation": "self-presentation",
  "contact-finder": "finding referral contacts",
  "connection-bridge": "the connection bridge",
  "first-call-practice": "first-call practice",
};

// Builds the compact string written into reflection.tool_summaries["practice-diagnosis"]
// so mentor-chat's journeyBlock can brief Eliana on the diagnosis (see Fix 2 in the plan).
// Fields are appended in priority order and the whole thing is capped at 400 chars to
// match journeyBlock's own truncation — ordering here matters more than completeness,
// so the load-bearing facts (the reframe + the recommended tool) survive any cut. Written
// in the same language the diagnosis conversation happened in, so it reads naturally
// alongside the rest of journeyBlock's context for that language's Mentor prompt.
function buildDiagnosisMentorSummary(p: Record<string, unknown>, isEnglish: boolean): string {
  const str = (v: unknown): string => (typeof v === "string" ? v.trim() : "");
  const toolLabels = isEnglish ? TOOL_LABELS_EN : TOOL_LABELS_HE;
  const toolLabel = toolLabels[str(p.recommended_tool)] ?? str(p.recommended_tool);
  const parts = isEnglish
    ? [
        str(p.diagnosis_summary) && `Diagnosis: ${str(p.diagnosis_summary)}`,
        toolLabel && `Recommended next step: ${toolLabel}`,
        str(p.bottleneck_description) && `Bottleneck: ${str(p.bottleneck_description)}`,
        str(p.presenting_theory) && `The therapist thought the problem was: ${str(p.presenting_theory)}`,
        str(p.behavioral_mechanism) && `What's actually happening: ${str(p.behavioral_mechanism)}`,
        str(p.evidence_summary) && `Evidence: ${str(p.evidence_summary)}`,
        str(p.not_the_priority) && `Not the priority right now: ${str(p.not_the_priority)}`,
      ]
    : [
        str(p.diagnosis_summary) && `אבחון: ${str(p.diagnosis_summary)}`,
        toolLabel && `הצעד הבא המומלץ: ${toolLabel}`,
        str(p.bottleneck_description) && `צוואר הבקבוק: ${str(p.bottleneck_description)}`,
        str(p.presenting_theory) && `המטפל/ת חשב/ה שהבעיה: ${str(p.presenting_theory)}`,
        str(p.behavioral_mechanism) && `מה קורה בפועל: ${str(p.behavioral_mechanism)}`,
        str(p.evidence_summary) && `עדות: ${str(p.evidence_summary)}`,
        str(p.not_the_priority) && `לא לעסוק כרגע ב: ${str(p.not_the_priority)}`,
      ];
  const filteredParts = parts.filter(Boolean) as string[];

  let out = "";
  for (const part of filteredParts) {
    const candidate = out ? `${out} ${part}.` : `${part}.`;
    if (candidate.length > 400) break;
    out = candidate;
  }
  return out;
}

// Pricing and contacts need extra shaping beyond a straight parsed-JSON save:
// pricing's recommended rate / income projection is arithmetic that must be
// computed here, not trusted to the LLM's extraction; contacts need stable
// ids and empty name/phone/email fields for the therapist to fill in later.
// practice-diagnosis needs its two fixed-enum fields validated server-side
// rather than trusting the LLM's raw string, same defensive pattern as
// mentor-analyze's stuck_category.
function buildStructuredOutput(botKey: string, parsed: Record<string, unknown>): unknown {
  if (botKey === "practice-diagnosis") {
    const p = parsed as Record<string, unknown>;
    const stuckCategory = STUCK_CATEGORIES.includes(p.stuck_category as string)
      ? p.stuck_category
      : "other";
    const bottleneckStage = BOTTLENECK_STAGES.includes(p.bottleneck_stage as string)
      ? p.bottleneck_stage
      : "unclear";
    const recommendedTool = normalizeRecommendedTool(p.recommended_tool);
    const areaMap = normalizeAreaMap(p.area_map, recommendedTool);
    return { ...p, stuck_category: stuckCategory, bottleneck_stage: bottleneckStage, recommended_tool: recommendedTool, area_map: areaMap };
  }
  if (botKey === "pricing-calculator") {
    const low = typeof parsed.comfort_range_low === "number" ? parsed.comfort_range_low : null;
    const high = typeof parsed.comfort_range_high === "number" ? parsed.comfort_range_high : null;
    const targetClients = typeof parsed.target_clients_per_week === "number" ? parsed.target_clients_per_week : null;
    const recommendedRate = high !== null ? Math.round(high * 1.1) : null;
    const monthlyIncome =
      recommendedRate !== null && targetClients !== null
        ? Math.round(recommendedRate * targetClients * 4.3)
        : null;
    const annualIncome = monthlyIncome !== null ? monthlyIncome * 12 : null;
    return {
      comfort_range_low: low,
      comfort_range_high: high,
      target_clients_per_week: targetClients,
      recommended_rate: recommendedRate,
      monthly_income: monthlyIncome,
      annual_income: annualIncome,
    };
  }
  if (botKey === "contact-finder") {
    const contactsRaw = Array.isArray((parsed as any).contacts) ? (parsed as any).contacts : [];
    return contactsRaw.map((c: any) => ({
      id: crypto.randomUUID(),
      profession: typeof c?.profession === "string" ? c.profession : "",
      reasoning: typeof c?.reasoning === "string" ? c.reasoning : "",
      name: "",
      phone: "",
      email: "",
    }));
  }
  return parsed;
}

// Lead-scoring signals for practice-diagnosis (Wave: sales follow-up). Raw
// component signals are stored alongside the composite so the weighting can
// be recalibrated later once real purchases exist to validate against —
// composite_score_v1 was built with zero conversions to learn from, so it's
// a heuristic starting point, not a validated model. Word-splitting on
// whitespace is fine for both Hebrew and English. English lists are thin
// (most volume so far is Hebrew) — expand once there's more English data.
const URGENCY_PHRASES_HE = ["כבר חודשים", "כבר שנה", "כבר שנים", "לא יכולה להמשיך", "לא יכול להמשיך", "נואשת", "נואש", "מותשת", "מותש", "אין לי ברירה", "חייבת", "חייב", "דחוף"];
const EMOTIONAL_WORDS_HE = ["מתוסכלת", "מתוסכל", "עצוב", "עצובה", "כואב", "כואבת", "מפחיד", "מפחידה", "חרדה", "בודדה", "בודד", "נורא", "קשה לי", "תקועה", "תקוע"];
const URGENCY_PHRASES_EN = ["for months", "for years", "can't keep going", "can't continue like this", "desperate", "exhausted", "no choice", "have to", "urgent"];
const EMOTIONAL_WORDS_EN = ["frustrated", "frustrating", "sad", "painful", "scary", "scared", "anxious", "anxiety", "lonely", "isolated", "terrible", "stuck", "hard for me"];

function computeLeadSignals(userMessages: string[], isEnglish: boolean) {
  const text = userMessages.join(" ");
  const numbersMentioned = (text.match(/\d+/g) ?? []).length;
  const wordCounts = userMessages.map((m) => m.trim().split(/\s+/).filter(Boolean).length);
  const avgWords = wordCounts.length ? wordCounts.reduce((a, b) => a + b, 0) / wordCounts.length : 0;
  const lower = isEnglish ? text.toLowerCase() : text;
  const urgencyList = isEnglish ? URGENCY_PHRASES_EN : URGENCY_PHRASES_HE;
  const emotionalList = isEnglish ? EMOTIONAL_WORDS_EN : EMOTIONAL_WORDS_HE;
  const countMatches = (list: string[]) => list.reduce((sum, p) => sum + (lower.split(isEnglish ? p.toLowerCase() : p).length - 1), 0);
  const urgencyCount = countMatches(urgencyList);
  const emotionalCount = countMatches(emotionalList);
  const compositeV1 = numbersMentioned * 2 + avgWords / 5 + urgencyCount * 5 + emotionalCount * 3;
  return {
    user_message_count: userMessages.length,
    avg_user_message_words: Math.round(avgWords * 10) / 10,
    numbers_mentioned_count: numbersMentioned,
    urgency_phrase_count: urgencyCount,
    emotional_intensity_count: emotionalCount,
    composite_score_v1: Math.round(compositeV1 * 10) / 10,
  };
}

// Generic prompt for any other bot — produces a short summary string
const GENERIC_SUMMARY_SYSTEM = `אתה מנתח שיחה בין כלי AI למטפל פסיכותרפיסט.
החזר JSON תקין בלבד בפורמט הבא:
{
  "summary": "סיכום קצר בעברית, 2-4 משפטים, של מה שהמטפל גילה / החליט / תרגל בכלי. דבר בגוף ראשון של המטפל ('הבנתי ש...', 'החלטתי ש...', 'תרגלתי...'). אם אין מסקנה ברורה — תאר במשפט מה נדון."${WEEKLY_EXPERIMENT_FIELDS}
}
השתמש רק במה שאמר המטפל בפועל. אל תמציא.`;

// ---------------------------------------------------------------------------
// Compact summary of a structured tool output, written to
// reflection.tool_summaries[botKey]. Until now only the diagnosis and generic
// bots got one, so the Mentor couldn't see what niche / pricing / contacts /
// bridge / first-call produced (and its "back from tool" card said "no
// automatic summary was saved"). Computed from the saved fields — no LLM.
// Limits: mentor-chat cuts each tool summary at 400 chars, and the same text
// is shown to the therapist as-is in that card, so it stays short and readable.
// The field choices mirror bot-chat's CONTEXT_SPECS (separate edge functions,
// no shared module in the deploy path) — keep the two in step.
// ---------------------------------------------------------------------------
const TOOL_SUMMARY_MAX = 400;
const SUMMARY_FILLER = new Set([
  "משהו כללי", "כללי", "לא נאמר", "לא צוין", "לא ידוע", "אין", "לא רלוונטי",
  "general", "something general", "not said", "not stated", "unknown", "none", "n/a",
]);

// Sentence-form non-answers the extractors write when a detail is missing
// (e.g. "המטפל לא ציין את לקוח הקצה..."). Short ones only, so real content that
// merely contains these words is kept.
const NON_ANSWER_PATTERNS = [
  /^המטפל(?:\/ת)?\s+לא\s+(?:ציין|צוין|הזכיר|סיפק|נתן|אמר|הגדיר)/,
  /\bלא\s+(?:צוין|נאמר|הוזכר|ידוע|סופק|הוגדר)\b/,
  /\b(?:not|wasn'?t|was not)\s+(?:specified|mentioned|stated|provided|defined)\b/i,
  /\bdid(?:n'?t| not)\s+(?:specify|mention|state|provide)\b/i,
  /\bno information\b/i,
];
function isNonAnswer(s: string): boolean {
  return s.length <= 110 && NON_ANSWER_PATTERNS.some((re) => re.test(s));
}

function summaryText(v: unknown, max: number): string {
  let s = "";
  if (typeof v === "string") s = v;
  else if (typeof v === "number" && Number.isFinite(v)) s = String(v);
  else if (Array.isArray(v)) {
    // Contacts: only the role/arena. Items also hold third parties' names,
    // phones and emails, which never go into a summary.
    s = v
      .map((x: any) => (typeof x === "string" ? x : x?.profession ?? ""))
      .filter((x: unknown) => typeof x === "string" && (x as string).trim())
      .join("; ");
  }
  s = s.replace(/\s+/g, " ").trim();
  if (SUMMARY_FILLER.has(s.toLowerCase().replace(/[.!…\-–—:;,\s]+$/g, ""))) return "";
  if (isNonAnswer(s)) return "";
  return s.length > max ? s.slice(0, max - 1) + "…" : s;
}

function buildToolSummary(botKey: string, structured: unknown, isEnglish: boolean): string {
  // contact_finder_output is saved as a bare array
  const o: any = botKey === "contact-finder" ? { contacts: structured } : structured;
  if (!o || typeof o !== "object") return "";
  const L = (he: string, en: string, v: unknown, max = 110) => ({ he, en, value: summaryText(v, max) });

  let lines: { he: string; en: string; value: string }[] = [];
  switch (botKey) {
    case "niche-finder":
      lines = [
        L("מטופל אידיאלי", "Ideal client", o.ideal_client),
        L("הכאב המרכזי", "Core pain", o.core_pain),
        L("השינוי", "Transformation", o.transformation),
        L("משפט לחיצת יד", "Handshake line", o.handshake_version),
      ];
      break;
    case "self-presentation":
      lines = [
        L("הסיפור", "Story", o.story_version, 150),
        L("כאב פנימי", "Internal pain", o.internal_pain, 80),
        L("כאב חיצוני", "External pain", o.external_pain, 80),
        L("הכמיהה", "Desire", o.desire, 70),
        L("התוצאה", "Result", o.result, 70),
      ];
      break;
    case "pricing-calculator":
      lines = [
        {
          he: "טווח נוחות",
          en: "Comfort range",
          value: o.comfort_range_low != null && o.comfort_range_high != null ? `${o.comfort_range_low}–${o.comfort_range_high}` : "",
        },
        L("תעריף מומלץ", "Recommended rate", o.recommended_rate),
        {
          he: "יעד",
          en: "Target",
          value:
            o.target_clients_per_week != null
              ? isEnglish ? `${o.target_clients_per_week} clients per week` : `${o.target_clients_per_week} מטופלים בשבוע`
              : "",
        },
        L("הכנסה חודשית משוערת", "Estimated monthly income", o.monthly_income),
      ];
      break;
    case "contact-finder":
      lines = [L("סוגי אנשי קשר שמופו", "Contact types mapped", o.contacts, 300)];
      break;
    case "connection-bridge":
      lines = [
        L("תורגל מול", "Practiced with", o.contact_type),
        L("הצעד הבא", "Next step", o.next_action),
        L("השיפור המרכזי", "Key improvement", o.key_improvement),
      ];
      break;
    case "first-call-practice":
      lines = [
        L("הקושי שתורגל", "Concern practiced", o.presenting_concern),
        L("האמון החלש ביותר", "Weakest trust", o.weakest_trust),
        L("חסמים פנימיים", "Internal blockers", o.internal_blockers),
        L("השיפור המרכזי", "Key improvement", o.key_improvement),
      ];
      break;
    default:
      return "";
  }

  let out = "";
  for (const l of lines) {
    if (!l.value) continue;
    const label = isEnglish ? l.en : l.he;
    const sep = out ? "\n" : "";
    const line = `${label}: ${l.value}`;
    if ((out + sep + line).length <= TOOL_SUMMARY_MAX) {
      out += sep + line;
      continue;
    }
    // Out of room: keep a truncated last line only if it still says something.
    const room = TOOL_SUMMARY_MAX - out.length - sep.length - label.length - 3;
    if (room >= 30) out += `${sep}${label}: ${l.value.slice(0, room - 1)}…`;
    break;
  }
  return out;
}

// ===== diagnosis report: begin =====
// The formal, bulleted diagnosis report with a numeric anchor score. Same rule as
// the rest of this file: the system computes, the LLM only phrases. The model
// rates 24 fixed rubric items from the transcript (2 = in place, 1 = partial,
// 0 = not in place / visible problem, null = cannot tell) and must quote the fact
// it relied on; code drops any rating without evidence, then computes every score.
// Rubric ids and wording live here (the report stores the labels it was scored
// with, so the frontend needs no copy of this table). Bump RUBRIC_VERSION on any
// change to the items, so scores from different rubric versions are never compared.
const RUBRIC_VERSION = 1;

type RubricItem = { id: string; he: string; en: string; guide_he: string; guide_en: string };
type RubricArea = { area: string; label_he: string; label_en: string; items: RubricItem[] };

const RUBRIC: RubricArea[] = [
  {
    area: "niche-finder", label_he: "נישה ובידול", label_en: "Niche and differentiation",
    items: [
      { id: "n1", he: "משפט מיקוד אחד ברור: למי העבודה מיועדת ובמה היא עוזרת", en: "One clear focus sentence: who the work is for and what it helps with",
        guide_he: "2 = יש ניסוח אחד חד שנאמר בשיחה; 1 = יש כיוון אבל מנוסח במעורפל או בכמה דרכים; 0 = לא מצליחים לנסח, או \"עובדים עם כולם\"", guide_en: "2 = one sharp formulation stated in the conversation; 1 = a direction exists but is vague or phrased several ways; 0 = cannot be stated, or \"I work with everyone\"" },
      { id: "n2", he: "עמיתים יודעים אילו פונים להפנות אליך", en: "Colleagues know which clients to refer to you",
        guide_he: "2 = עמיתים מפנים את הפונים הנכונים; 1 = חלק מהעמיתים יודעים; 0 = עמיתים לא יודעים מה להפנות או מפנים פונים לא מתאימים", guide_en: "2 = colleagues send the right clients; 1 = some colleagues know; 0 = colleagues don't know what to send, or send unsuitable clients" },
      { id: "n3", he: "מסר ממוקד בנוכחות הפומבית (אתר, פרופיל, פוסטים)", en: "A focused message in the public presence (site, profile, posts)",
        guide_he: "2 = המסר הפומבי תואם את המיקוד; 1 = חלקי או לא עקבי; 0 = המסר כללי, או שאין נוכחות פומבית כלל", guide_en: "2 = the public message matches the focus; 1 = partial or inconsistent; 0 = generic, or no public presence at all" },
      { id: "n4", he: "בידול ברור ממטפלים דומים", en: "Clear differentiation from similar therapists",
        guide_he: "2 = אפשר לומר במה זה שונה; 1 = יש תחושת שוני אך לא מנוסחת; 0 = לא ברור במה זה שונה", guide_en: "2 = can say what makes it different; 1 = a sense of difference that isn't articulated; 0 = unclear what is different" },
    ],
  },
  {
    area: "pricing-calculator", label_he: "תמחור", label_en: "Pricing",
    items: [
      { id: "p1", he: "המחיר נקבע במודע ולא בדיעבד", en: "The fee was set deliberately, not by default",
        guide_he: "2 = המחיר נבחר מתוך שיקול שאפשר לנמק; 1 = נקבע בעיקר לפי מה שאחרים גובים או לפי תחושה; 0 = נקבע בלי חשיבה או מתוך חשש", guide_en: "2 = chosen with reasoning that can be explained; 1 = set mostly by what others charge or by feel; 0 = set without thought or out of fear" },
      { id: "p2", he: "נוחות באמירת המחיר", en: "Comfort stating the fee",
        guide_he: "2 = אומרים את המחיר בנוחות; 1 = אומרים אבל עם התנצלות או היסוס; 0 = נמנעים או מתקשים לומר אותו", guide_en: "2 = states the fee comfortably; 1 = states it with apology or hesitation; 0 = avoids or struggles to say it" },
      { id: "p3", he: "עמידה במחיר כשפונה מהסס", en: "Holding the fee when a prospective client hesitates",
        guide_he: "2 = עומדים במחיר; 1 = לפעמים מוותרים; 0 = בדרך כלל מורידים מחיר כשיש היסוס", guide_en: "2 = holds the fee; 1 = sometimes concedes; 0 = usually lowers it at the first hesitation" },
      { id: "p4", he: "התאמת המחיר לביקוש ולוותק", en: "The fee fits demand and experience",
        guide_he: "2 = המחיר תואם (ביקוש גבוה ומחיר ראוי); 1 = פער מתון; 0 = פער ברור (למשל רשימת המתנה או ותק רב עם מחיר נמוך)", guide_en: "2 = fee fits (strong demand, fitting fee); 1 = moderate gap; 0 = clear gap (e.g. a waitlist or long experience with a low fee)" },
    ],
  },
  {
    area: "self-presentation", label_he: "הצגה עצמית", label_en: "Self-presentation",
    items: [
      { id: "s1", he: "תיאור כתוב ברור של העבודה (אתר או פרופיל)", en: "A clear written description of the work (site or profile)",
        guide_he: "2 = קיים תיאור ברור ועדכני; 1 = קיים אך כללי או לא מעודכן; 0 = אין", guide_en: "2 = a clear, current description exists; 1 = exists but generic or outdated; 0 = none" },
      { id: "s2", he: "נוחות בתיאור העבודה בפני אדם זר", en: "Comfort describing the work to a stranger",
        guide_he: "2 = מספרים בקלות ובבהירות; 1 = מצליחים אך עם מאמץ או גמגום; 0 = נמנעים או מרגישים לא נוח מאוד", guide_en: "2 = describes it easily and clearly; 1 = manages with effort; 0 = avoids it or is very uncomfortable" },
      { id: "s3", he: "נוכחות עקבית במקום גלוי", en: "A consistent presence somewhere visible",
        guide_he: "2 = נוכחות קבועה (פרסום, כתיבה, הרצאות וכד'); 1 = נוכחות מקרית; 0 = כמעט אין נוכחות גלויה", guide_en: "2 = regular presence (posts, writing, talks etc.); 1 = occasional; 0 = almost no visible presence" },
      { id: "s4", he: "שפה שהפונים מזהים כשלהם", en: "Language that prospective clients recognize as their own",
        guide_he: "2 = המסר בשפה של הפונים; 1 = שילוב של שפה מקצועית ושל הפונים; 0 = שפה מקצועית בלבד שהפונים לא מזהים", guide_en: "2 = message in the clients' own language; 1 = a mix; 0 = professional jargon the clients don't recognize" },
    ],
  },
  {
    area: "contact-finder", label_he: "רשת הפניות", label_en: "Referral network",
    items: [
      { id: "r1", he: "לפחות שלושה מקורות הפניה פעילים", en: "At least three active referral sources",
        guide_he: "2 = שלושה מקורות ויותר; 1 = אחד עד שניים; 0 = אין מקורות הפניה פעילים", guide_en: "2 = three or more; 1 = one or two; 0 = no active sources" },
      { id: "r2", he: "אין תלות במקור הפניה יחיד", en: "No dependence on a single referral source",
        guide_he: "2 = הפניות מכמה מקורות; 1 = מקור אחד מוביל אך יש נוספים; 0 = כמעט כל הפונים ממקור אחד", guide_en: "2 = referrals from several sources; 1 = one leads but others exist; 0 = almost all clients come from one source" },
      { id: "r3", he: "קשר שוטף עם המפנים", en: "Ongoing contact with the people who refer",
        guide_he: "2 = קשר קבוע; 1 = קשר מדי פעם; 0 = אין קשר מעבר להפניה עצמה", guide_en: "2 = regular contact; 1 = occasional; 0 = no contact beyond the referral itself" },
      { id: "r4", he: "הפניות סדירות, כמה בחודש", en: "Steady referrals, how many per month",
        guide_he: "2 = שתיים-שלוש הפניות בחודש ומעלה; 1 = בערך אחת בחודש; 0 = פחות מאחת בחודש או הפניות לסירוגין בלבד", guide_en: "2 = two to three referrals a month or more; 1 = about one a month; 0 = fewer than one a month, or only now and then" },
    ],
  },
  {
    area: "connection-bridge", label_he: "גישור קשר", label_en: "Connection-building",
    items: [
      { id: "c1", he: "יוזמה ליצירת קשרים מקצועיים חדשים", en: "Initiative in making new professional connections",
        guide_he: "2 = פונים באופן יזום לאנשים חדשים; 1 = לפעמים; 0 = לא יוזמים, ממתינים שיפנו", guide_en: "2 = proactively reaches out to new people; 1 = sometimes; 0 = does not initiate, waits to be approached" },
      { id: "c2", he: "הצעת ערך ברורה לעמית", en: "A clear value proposition for a colleague",
        guide_he: "2 = ברור מה העמית מרוויח מהקשר; 1 = ברור חלקית; 0 = לא ברור, או שהפנייה היא רק בקשה", guide_en: "2 = clear what the colleague gains; 1 = partly clear; 0 = unclear, or the approach is only an ask" },
      { id: "c3", he: "בהירות לעמית מי מתאים לך", en: "Clarity to colleagues about who is a good fit for you",
        guide_he: "2 = העמית יודע בדיוק; 1 = חלקית; 0 = לא מובהר", guide_en: "2 = the colleague knows exactly; 1 = partly; 0 = not made clear" },
      { id: "c4", he: "מעקב אחרי היכרות חדשה", en: "Following up after a new acquaintance",
        guide_he: "2 = מעקב קבוע; 1 = מעקב מקרי; 0 = ההיכרות נגמרת בלי מעקב", guide_en: "2 = consistent follow-up; 1 = occasional; 0 = contact fades with no follow-up" },
    ],
  },
  {
    area: "first-call-practice", label_he: "שיחת הטלפון הראשונה", label_en: "The first phone call",
    items: [
      { id: "f1", he: "שיעור הפניות שהופכות לפגישה", en: "Share of inquiries that become a first session",
        guide_he: "2 = 60% ומעלה; 1 = 30% עד 59%; 0 = מתחת ל-30%. אם אין מספר ואין תיאור — null", guide_en: "2 = 60% or more; 1 = 30% to 59%; 0 = under 30%. If there is no number and no description — null" },
      { id: "f2", he: "הובלת השיחה לקביעת מועד", en: "Leading the call toward booking a time",
        guide_he: "2 = השיחה מסתיימת בקביעת מועד; 1 = לפעמים; 0 = השיחה נגמרת בלי קביעה", guide_en: "2 = the call ends with a booked time; 1 = sometimes; 0 = calls end without booking" },
      { id: "f3", he: "מענה בביטחון לשאלת המחיר", en: "Answering the fee question with confidence",
        guide_he: "2 = עונים בביטחון; 1 = עונים בהיסוס; 0 = נמנעים או מתחמקים", guide_en: "2 = answers confidently; 1 = answers hesitantly; 0 = avoids or deflects" },
      { id: "f4", he: "מעקב אחרי פונה שנעלם", en: "Following up with a prospective client who went quiet",
        guide_he: "2 = חוזרים לפונה; 1 = לפעמים; 0 = לא חוזרים", guide_en: "2 = follows up; 1 = sometimes; 0 = does not" },
    ],
  },
];

const RUBRIC_AREAS = RUBRIC.map((a) => a.area);
const RUBRIC_ITEM_BY_ID = new Map<string, { area: string; item: RubricItem }>(
  RUBRIC.flatMap((a) => a.items.map((item) => [item.id, { area: a.area, item }] as [string, { area: string; item: RubricItem }])),
);

type Rating = 0 | 1 | 2;
type ScoreBand = "immediate" | "improve" | "strong";
interface AreaScore {
  area: string;
  label: string;
  score: number | null; // 1.0 - 10.0, one decimal; null when fewer than 2 items could be rated
  band: ScoreBand | null;
  known: number;
  total: number;
}

function bandFor(score: number): ScoreBand {
  return score < 4 ? "immediate" : score < 7 ? "improve" : "strong";
}

// 1 + 9 x (sum of known ratings / (2 x known items)); one decimal.
function scoreFromRatings(ratings: Array<Rating | null>): { score: number | null; known: number } {
  const known = ratings.filter((r): r is Rating => r === 0 || r === 1 || r === 2);
  if (known.length < 2) return { score: null, known: known.length };
  const sum = known.reduce<number>((a, b) => a + b, 0);
  return { score: Math.round((1 + (9 * sum) / (2 * known.length)) * 10) / 10, known: known.length };
}

function computeScores(ratingById: Map<string, Rating>, isEnglish: boolean) {
  const areas: AreaScore[] = RUBRIC.map((a) => {
    const { score, known } = scoreFromRatings(a.items.map((i) => ratingById.get(i.id) ?? null));
    return {
      area: a.area,
      label: isEnglish ? a.label_en : a.label_he,
      score,
      band: score === null ? null : bandFor(score),
      known,
      total: a.items.length,
    };
  });
  const scored = areas.filter((a) => a.score !== null) as Array<AreaScore & { score: number }>;
  const overall = scored.length
    ? Math.round((scored.reduce((s, a) => s + a.score, 0) / scored.length) * 10) / 10
    : null;
  let band: ScoreBand | null = overall === null ? null : bandFor(overall);
  // One badly failing area must not hide behind a "strong" average of the few areas that were scored.
  if (band === "strong" && scored.some((a) => a.band === "immediate")) band = "improve";
  return { overall, band, areas, scored_areas: scored.length };
}

// Central-failure area first, then ascending score; areas with no score last.
function priorityOrder(areas: AreaScore[], centralArea: string): string[] {
  const rest = areas
    .filter((a) => a.area !== centralArea)
    .sort((a, b) => (a.score ?? 99) - (b.score ?? 99))
    .map((a) => a.area);
  return [centralArea, ...rest];
}

// "Evidence" that only states the topic was not discussed. Such an item is unknown, not 0.
const ABSENCE_EVIDENCE_RES = [
  /לא\s+(?:נשאל|נשאלה|נשאלו|נבדק|נבדקה|נבדקו|עלה|עלתה|עלו|נדון|נדונה|נדונו|נגע|נגעו|התייחס|התייחסה|התייחסו)/,
  /לא\s+(?:צוין|צוינה|צוינו|נאמר|נאמרה|נאמרו|הוזכר|הוזכרה|הוזכרו|ניתן|ניתנה|ניתנו|סופק|סופקה|סופקו)/,
  /אין\s+(?:מידע|התייחסות|עדות|אזכור|פירוט)/,
  /\b(?:not|never|wasn'?t|weren'?t|was not|were not|isn'?t|is not)\s+(?:asked|discussed|mentioned|stated|specified|addressed|covered|assessed|examined|provided|raised)\b/i,
  /\b(?:no|without)\s+(?:information|mention|evidence|reference|details?)\b/i,
  /\bdid(?:n'?t| not)\s+(?:come up|ask|discuss|mention|address)\b/i,
];
function isAbsenceEvidence(s: string): boolean {
  return ABSENCE_EVIDENCE_RES.some((re) => re.test(s));
}

const REPORT_LIST_MAX = 6;
const REPORT_TEXT_MAX = 320;

function reportText(v: unknown, max = REPORT_TEXT_MAX): string {
  if (typeof v !== "string") return "";
  const s = v.replace(/\s+/g, " ").trim();
  if (!s || SUMMARY_FILLER.has(s.toLowerCase().replace(/[.!…\-–—:;,\s]+$/g, "")) || isNonAnswer(s)) return "";
  return s.length > max ? s.slice(0, max - 1) + "…" : s;
}

function reportList(v: unknown, pick: (x: unknown) => string, max = REPORT_LIST_MAX): string[] {
  if (!Array.isArray(v)) return [];
  const out: string[] = [];
  for (const x of v) {
    const s = pick(x);
    if (s && !out.includes(s)) out.push(s);
    if (out.length >= max) break;
  }
  return out;
}

// A gender slash ("מטפל/ת", "את/ה") is a copy rule violation; "ו/או" is fine.
const GENDER_SLASH_RE = /(?<![א-ת])(?!ו\/או)[א-ת]{1,12}\/(?:ת|ה|ית|ים|ות)(?![א-ת])/;
function hasGenderSlash(s: string): boolean {
  return GENDER_SLASH_RE.test(s);
}

// An evidence quote only counts if it really is in what the therapist wrote. The model
// sometimes "supports" a rating with the mentor's own remarks or with its inference; a
// verbatim match against the therapist's messages is the one check code can make.
function normQuote(s: string): string {
  return s.toLowerCase().replace(/[\s"'\u201c\u201d\u201e\u2019\u2018\u05f3\u05f4.,;:!?()\[\]{}\-\u2013\u2014\u2026]+/g, " ").trim();
}
function quoteInText(quote: string, normText: string): boolean {
  const parts = quote.split(/\.{2,}|\u2026|\[[^\]]*\]/).map(normQuote).filter((p) => p.length >= 4);
  if (!parts.length || parts.join(" ").length < 6) return false;
  return parts.every((p) => normText.includes(p));
}
const MAX_ITEMS_PER_QUOTE = 2;
// The prompt points the model at transcript lines that start with "מטפל:" / "Therapist:", and the model copies that
// label into its quote. A live run lost all 24 ratings to it (the label is not in the therapist's own text), so the
// label is removed before the check.
function stripSpeakerPrefix(q: string): string {
  return q.replace(/^[\s"'\u201c\u201e]*(?:מטפל|מנטור|therapist|mentor)\s*:\s*/i, "").trim();
}

interface ValidReport {
  therapist_gender: "female" | "male" | "unknown";
  ratings: Array<{ id: string; area: string; label: string; rating: Rating | null; evidence: string; quote: string }>;
  works: string[];
  needs_work: Array<{ area: string; point: string }>;
  central_failure: { area: string; statement: string; cause: string; evidence: string[] };
  fix_approach: string[];
  future_picture: string[];
  action_steps: Array<{ step: string; outcome: string }>;
  not_now: Array<{ item: string; reason: string }>;
  flags: string[];
}

// Returns null when the report is unusable (no central failure / no steps); the
// caller then falls back to the legacy display. Anything it keeps is cleaned.
function validateReport(raw: unknown, isEnglish: boolean, therapistText?: string): ValidReport | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const flags: string[] = [];

  const ratingsIn = Array.isArray(r.ratings) ? r.ratings : [];
  const normTherapist = therapistText === undefined ? "" : normQuote(therapistText);
  const quoteUse = new Map<string, number>();
  const seen = new Set<string>();
  const ratings: ValidReport["ratings"] = [];
  for (const x of ratingsIn) {
    if (!x || typeof x !== "object") continue;
    const e = x as Record<string, unknown>;
    const id = typeof e.id === "string" ? e.id.trim().toLowerCase() : "";
    const meta = RUBRIC_ITEM_BY_ID.get(id);
    if (!meta || seen.has(id)) continue;
    seen.add(id);
    const evidence = reportText(e.evidence, 240);
    // No quoted fact, no rating: an unsupported number is worse than "unknown". Evidence
    // that merely says the topic never came up is also no fact (observed live: the model
    // rated such items 0 with "not asked and not mentioned" as its "evidence").
    let rating: Rating | null =
      evidence && !isAbsenceEvidence(evidence) && (e.rating === 0 || e.rating === 1 || e.rating === 2) ? (e.rating as Rating) : null;
    const quote = typeof e.evidence_quote === "string" ? stripSpeakerPrefix(e.evidence_quote) : "";
    if (rating !== null && therapistText !== undefined) {
      const nq = normQuote(quote);
      if (!quoteInText(quote, normTherapist)) rating = null;
      else if ((quoteUse.get(nq) ?? 0) >= MAX_ITEMS_PER_QUOTE) rating = null; // one remark can't carry many items
      else quoteUse.set(nq, (quoteUse.get(nq) ?? 0) + 1);
    }
    ratings.push({ id, area: meta.area, label: isEnglish ? meta.item.en : meta.item.he, rating, evidence: rating === null ? "" : evidence, quote: rating === null ? "" : quote.slice(0, 240) });
  }
  // Items the model skipped are recorded as unknown so every report lists all 24.
  for (const [id, meta] of RUBRIC_ITEM_BY_ID) {
    if (!seen.has(id)) ratings.push({ id, area: meta.area, label: isEnglish ? meta.item.en : meta.item.he, rating: null, evidence: "", quote: "" });
  }
  const order = [...RUBRIC_ITEM_BY_ID.keys()];
  ratings.sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));

  const cf = (r.central_failure && typeof r.central_failure === "object" ? r.central_failure : {}) as Record<string, unknown>;
  const statement = reportText(cf.statement, 400);
  if (!statement) return null;
  const area = RUBRIC_AREAS.includes(normalizeRecommendedTool(cf.area)) ? normalizeRecommendedTool(cf.area) : "";
  if (!area) return null;

  const steps: Array<{ step: string; outcome: string }> = [];
  if (Array.isArray(r.action_steps)) {
    for (const x of r.action_steps) {
      const e = (x && typeof x === "object" ? x : {}) as Record<string, unknown>;
      const step = reportText(typeof x === "string" ? x : e.step);
      if (!step) continue;
      steps.push({ step, outcome: reportText(e.outcome) });
      if (steps.length >= 5) break;
    }
  }
  if (!steps.length) return null;

  const needs_work: ValidReport["needs_work"] = [];
  if (Array.isArray(r.needs_work)) {
    for (const x of r.needs_work) {
      const e = (x && typeof x === "object" ? x : {}) as Record<string, unknown>;
      const point = reportText(typeof x === "string" ? x : e.point);
      if (!point) continue;
      const a = typeof e.area === "string" ? normalizeRecommendedTool(e.area) : "";
      needs_work.push({ area: RUBRIC_AREAS.includes(a) ? a : "", point });
      if (needs_work.length >= REPORT_LIST_MAX) break;
    }
  }

  const not_now: ValidReport["not_now"] = [];
  if (Array.isArray(r.not_now)) {
    for (const x of r.not_now) {
      const e = (x && typeof x === "object" ? x : {}) as Record<string, unknown>;
      const item = reportText(typeof x === "string" ? x : e.item);
      if (!item) continue;
      not_now.push({ item, reason: reportText(e.reason) });
      if (not_now.length >= 3) break;
    }
  }

  const gender = r.therapist_gender === "female" || r.therapist_gender === "male" ? r.therapist_gender : "unknown";
  const report: ValidReport = {
    therapist_gender: gender,
    ratings,
    works: reportList(r.works, (x) => reportText(x)),
    needs_work,
    central_failure: {
      area,
      statement,
      cause: reportText(cf.cause, 400),
      evidence: reportList(cf.evidence, (x) => reportText(x, 240), 3),
    },
    fix_approach: reportList(r.fix_approach, (x) => reportText(x), 4),
    future_picture: reportList(r.future_picture, (x) => reportText(x, 260), 5),
    action_steps: steps,
    not_now,
    flags,
  };

  if (!isEnglish) {
    const all = [
      ...report.works, ...report.fix_approach, ...report.future_picture, statement, report.central_failure.cause,
      ...report.needs_work.map((n) => n.point), ...steps.flatMap((s) => [s.step, s.outcome]),
      ...not_now.flatMap((n) => [n.item, n.reason]),
    ];
    if (all.some(hasGenderSlash)) flags.push("gender_slash");
  }
  return report;
}

function buildReport(valid: ValidReport, isEnglish: boolean) {
  const ratingById = new Map<string, Rating>();
  for (const x of valid.ratings) if (x.rating !== null) ratingById.set(x.id, x.rating);
  const scores = computeScores(ratingById, isEnglish);
  return {
    version: 1,
    rubric_version: RUBRIC_VERSION,
    language: isEnglish ? "en" : "he",
    generated_at: new Date().toISOString(),
    therapist_gender: valid.therapist_gender,
    scores,
    priority_order: priorityOrder(scores.areas, valid.central_failure.area),
    ratings: valid.ratings,
    works: valid.works,
    needs_work: valid.needs_work,
    central_failure: valid.central_failure,
    fix_approach: valid.fix_approach,
    future_picture: valid.future_picture,
    action_steps: valid.action_steps,
    not_now: valid.not_now,
    flags: valid.flags,
  };
}

function rubricPromptBlock(isEnglish: boolean): string {
  return RUBRIC.map((a) =>
    `${a.area} — ${isEnglish ? a.label_en : a.label_he}\n` +
    a.items.map((i) => `  ${i.id}: ${isEnglish ? i.en : i.he}\n      ${isEnglish ? i.guide_en : i.guide_he}`).join("\n"),
  ).join("\n\n");
}

const HE_REPORT_SYSTEM = () => `אתה מכין דו"ח אבחון רשמי למטפל או למטפלת בפסיכותרפיה, על סמך שיחת האבחון שהתקיימה זה עתה. הדו"ח הוא מסמך מקצועי שהמטפל חוזר אליו אחרי זמן ומתקן ממנו את הליקויים בבניית הקליניקה הפרטית. זה לא סיכום שיחתי.

החזר JSON תקין בלבד, בדיוק במבנה הזה:
{
  "therapist_gender": "female" | "male" | "unknown",
  "ratings": [ { "id": "n1", "rating": 2 | 1 | 0 | null, "evidence": "העובדה מהשיחה שעליה הדירוג נשען", "evidence_quote": "ציטוט מילולי קצר מהודעה של המטפל" }, ...כל 24 הפריטים ],
  "works": ["נקודה קצרה על מה שעובד", ...],
  "needs_work": [ { "area": "<מפתח אזור>", "point": "נקודה קצרה על מה שכדאי לחזק" }, ...],
  "central_failure": { "area": "<מפתח אזור>", "statement": "מה נקודת הכשל המרכזית, במשפט אחד", "cause": "הסיבה לכשל, במשפט או שניים", "evidence": ["ציטוט או עובדה מהשיחה", ...] },
  "fix_approach": ["נקודה קצרה: איך מתקנים את הכשל", ...],
  "future_picture": ["נקודה קצרה וקונקרטית: איך נראית ומרגישה הקליניקה אחרי השינוי", ...],
  "action_steps": [ { "step": "צעד מעשי אחד, בניסוח של פעולה", "outcome": "מה יהיה קיים אחרי שהצעד בוצע" }, ...],
  "not_now": [ { "item": "מה לא כדאי לעסוק בו כעת", "reason": "למה" }, ...]
}

אזורי הדירוג והפריטים (מפתח האזור הוא הערך שיש לכתוב בשדות area):

${rubricPromptBlock(false)}

כללי הדירוג:
1. דרג רק לפי דברי המטפל עצמו בשיחה (עובדות, מספרים, תיאורים, אישורים שלו להשערות המנטור). בשדה evidence כתוב את העובדה הקונקרטית שעליה נשען הדירוג (מספר, תיאור, ציטוט קצר של דברי המטפל). אם אין עובדה כזו, כתוב rating: null ו-evidence ריק. הדירוג null עדיף על ניחוש.
2. אל תסיק מסקנה על פריט מתוך שתיקה או מתוך היעדר אזכור. פריט שלא נשאל ולא נאמר לגביו דבר הוא null, ו-evidence שלו ריק. כתיבה כמו "לא נשאל", "לא צוין" או "לא עלה בשיחה" בשדה evidence אסורה: במקרה כזה כתוב rating: null.
3. כל דירוג שאינו null חייב לכלול evidence_quote: ציטוט מילולי, מדויק, באורך של כמה מילים לפחות, מתוך הודעה של המטפל (שורה שמתחילה ב"מטפל:"). כתוב את הציטוט בלי המילים "מטפל:" שבתחילת השורה. לא מדברי המנטור, לא ניסוח מחדש. הציטוט נבדק בקוד מול הודעות המטפל, ודירוג בלי ציטוט שנמצא שם בדיוק הופך ל-null. ציטוט אחד תומך בשני פריטים לכל היותר.
4. הדירוג 0 דורש אמירה חיובית של המטפל שהדבר חסר או בעייתי אצלו (למשל "אין לי אתר", "אני לא יוזם קשרים", "כמעט כולם מגיעים ממקור אחד"). השערה או פרשנות של המנטור שהמטפל לא אישר אינן ראיה ל-0, ולכל היותר מצדיקות null.
5. נקודת הכשל המרכזית (central_failure.area) חייבת להיות האזור שהשיחה זיהתה כעיקרי ושעליו הומלץ בשלב ההמלצה. אל תבחר אזור אחר.

כללי הכתיבה (חשובים):
1. עברית תקנית, רשמית ומקצועית. לא שיחתית, לא הבטחות, לא מליצות.
2. נקודות קצרות: עד משפט אחד או שניים. בלי פסקאות.
3. פנייה ישירה אל המטפל בגוף שני יחיד. אם מהשיחה ברור המגדר של המטפל (צורות הפנייה, שמו, ניסוח שלו עצמו), השתמש בצורה התואמת וקבע therapist_gender בהתאם. אם המגדר לא ברור, קבע "unknown" ונסח באופן ניטרלי: זמן עבר בגוף שני (סיפרת, ציינת, תיארת), כינויים וסיומות (שלך, עליך, אצלך, אליך), שמות פעולה ("נמצא כי", "מומלץ לבנות"), וצורת רבים. הימנע בניטרלי מהווה, מעתיד וציווי בגוף שני (אתה עושה, תעשי, עשה).
4. אסור בהחלט לכתוב צורות עם לוכסן כמו "את/ה", "מטפל/ת", "שלך/שלכם". כתוב רק צורה אחת.
5. ציין עובדות מהשיחה (מספרים, תיאורים) כדי שהקורא יזהה את עצמו. אל תמציא מידע שלא נאמר.
6. אל תנסח את הבעיה המרכזית כ"שיווק" כללי ואל תנסח את הפתרון כ"לבקש" הפניות. נסח את הפתרון סביב הפיכה לזכור ולבולט בעיני מי שמפנים.
7. action_steps: 3 עד 5 צעדים, לפי סדר ביצוע. כל צעד ניתן לביצוע בשבועות הקרובים ויש לו תוצר ברור. בלי צעדים שדורשים קורס, צוות או תקציב.
8. works: 2 עד 5 נקודות על מה שבאמת עובד אצלו, מבוססות על עובדות. אם כמעט אין, כתוב נקודה אחת על הנכס הקיים (ותק, מוטיבציה, נכונות לשיפור) שנאמר בשיחה.
9. not_now: 0 עד 3 נקודות, רק אם עלה בשיחה נושא שהמטפל חושב שהוא חשוב אך אינו הדחוף.
10. לא להזכיר "ציון", "דירוג" או מספרים של הפריטים בטקסטים. הציון מחושב ומוצג בנפרד.
11. נסח את נקודת הכשל, הסיבה והדרך לתיקון כנקודה מוגדרת וניתנת לשינוי, בשפה של תהליך (מה כדאי לבנות או לשנות) ולא בשפה של פגם או של שיפוט על המטפל. הקורא צריך לצאת בהבנה שמדובר במקום ברור שאפשר לעבוד עליו בצעדים קטנים. אל תבטיח תוצאה ואל תמציא מספרים. השתמש בעברית טבעית של מטפלים ולא בניסוחים ארכאיים: "אמירת המחיר" ולא "נקיבת המחיר".
12. future_picture: 3 עד 5 נקודות קונקרטיות על היום-יום בקליניקה אחרי שהצעדים בוצעו: מה קורה כשפונה יוצר קשר ואיך נראית השיחה איתו, איך נאמר המחיר ואיך זה מרגיש, איך נראה היומן, מה עמיתים אומרים ולמי הם מפנים. הנקודות נגזרות מהחסם שעלה בשיחה ומדברי המטפל על מה שהוא רוצה, ומנוסחות כך שהמטפל יוכל לדמיין את הקליניקה שלו. כתוב אותן כתמונה של אפשרות ולא כהבטחה: בלי מספרים, בלי לוחות זמנים ובלי הבטחת הכנסה או מספר מטופלים, בשפה חמה וקונקרטית ולא בקלישאות. זה המקום היחיד בדו"ח שבו מתארים עתיד.`;

const EN_REPORT_SYSTEM = () => `You are preparing a formal diagnosis report for a psychotherapist, based on the diagnostic conversation that just took place. The report is a professional document the therapist returns to later to fix gaps in building their private practice. It is not a conversational summary.

Return valid JSON only, in exactly this shape:
{
  "therapist_gender": "female" | "male" | "unknown",
  "ratings": [ { "id": "n1", "rating": 2 | 1 | 0 | null, "evidence": "the fact from the conversation the rating rests on", "evidence_quote": "a short verbatim quote from a therapist message" }, ...all 24 items ],
  "works": ["short point on what works", ...],
  "needs_work": [ { "area": "<area key>", "point": "short point on what is worth strengthening" }, ...],
  "central_failure": { "area": "<area key>", "statement": "the central failure point, one sentence", "cause": "why it is failing, one or two sentences", "evidence": ["quote or fact from the conversation", ...] },
  "fix_approach": ["short point: how the failure gets fixed", ...],
  "future_picture": ["short, concrete point: what the practice looks and feels like after the change", ...],
  "action_steps": [ { "step": "one practical step, phrased as an action", "outcome": "what exists once the step is done" }, ...],
  "not_now": [ { "item": "what is not worth working on right now", "reason": "why" }, ...]
}

Rating areas and items (the area key is the value to write in every area field):

${rubricPromptBlock(true)}

Rating rules:
1. Rate only from the therapist's own words in the conversation (facts, numbers, descriptions, their confirmations of the mentor's hypotheses). In "evidence" write the concrete fact the rating rests on (a number, a description, a short quote of the therapist). If there is no such fact, write rating: null and an empty evidence. null is better than a guess.
2. Never infer an item from silence or absence of mention. An item that was not asked about and not mentioned is null with an empty evidence. Writing "not asked", "not mentioned" or "did not come up" in the evidence field is forbidden: in that case write rating: null.
3. Every rating that is not null must include evidence_quote: an exact, verbatim quote of at least a few words from a therapist message (a line starting with "Therapist:"). Write the quote without the "Therapist:" label at the start of the line. Not from the mentor's words, not a paraphrase. The quote is checked in code against the therapist's messages, and a rating without a quote found there exactly becomes null. One quote supports two items at most.
4. A rating of 0 requires a positive statement by the therapist that the thing is missing or problematic for them (e.g. "I have no website", "I don't initiate contacts", "almost everyone comes from one source"). A hypothesis or interpretation by the mentor that the therapist did not confirm is not evidence for 0, and at most justifies null.
5. The central failure area (central_failure.area) must be the area the conversation identified as the main one and recommended in the recommendation stage. Do not choose another area.

Writing rules (important):
1. Formal, professional English. Not conversational, no promises, no flourish.
2. Short bullet points: one or two sentences at most. No paragraphs.
3. Address the therapist directly as "you". Set therapist_gender from the conversation if it is clear, otherwise "unknown".
4. Cite facts from the conversation (numbers, descriptions) so the reader recognizes themselves. Do not invent anything that was not said.
5. Do not frame the central problem as generic "marketing", and do not frame the fix as "asking" for referrals. Frame it around becoming remembered and visible to the people who refer.
6. action_steps: 3 to 5 steps in order. Each is doable within the coming weeks and has a clear deliverable. No steps that need a course, a team or a budget.
7. works: 2 to 5 points about what genuinely works, based on facts. If almost nothing does, give one point on an existing asset (experience, motivation, willingness) mentioned in the conversation.
8. not_now: 0 to 3 points, only if the therapist raised something they think matters but is not the urgent thing.
9. Do not mention "score", "rating" or item numbers in the texts. The score is computed and shown separately.
10. Phrase the failure point, its cause and the fix as a defined point that can be changed, in the language of a process (what is worth building or changing), not in the language of a flaw or a judgment of the therapist. The reader should leave understanding that this is a clear place to work on in small steps. Do not promise a result and do not invent numbers.
11. future_picture: 3 to 5 concrete points about the day-to-day of the practice once the steps have been done: what happens when a prospective client reaches out and how the conversation looks, how the fee is stated and how that feels, what the calendar looks like, what colleagues say and who they refer to. The points come from the blocker raised in the conversation and from what the therapist said they want, and are worded so the therapist can picture their own practice. Write them as a picture of a possibility, not a promise: no numbers, no timelines, no promise of income or number of clients, in warm, concrete language and not clichés. This is the only place in the report that describes the future.`;

function forcedAreaNote(area: string, isEnglish: boolean): string {
  const a = RUBRIC.find((x) => x.area === area);
  if (!a) return "";
  return isEnglish
    ? `Note: the central failure area fixed in the recommendation stage is "${area}" (${a.label_en}). Set central_failure.area to it and write the whole report to match.\n\n`
    : `הערה: נקודת הכשל המרכזית שנקבעה בשלב ההמלצה היא באזור "${area}" (${a.label_he}). קבע central_failure.area בהתאם וכתוב את כל הדו"ח כך שיתאים לו.\n\n`;
}

// Runs the report extraction. Never throws: any failure returns null so the
// legacy diagnosis_output (which payment webhooks read) is unaffected.
async function extractReport(
  transcript: string,
  therapistText: string,
  isEnglish: boolean,
  apiKey: string,
  opts?: { forceArea?: string; debug?: { reason?: string } },
) {
  const debug = opts?.debug;
  try {
    const res = await aiFetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      signal: AbortSignal.timeout(50000),
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: isEnglish ? EN_REPORT_SYSTEM() : HE_REPORT_SYSTEM() },
          {
            role: "user",
            content: (opts?.forceArea ? forcedAreaNote(opts.forceArea, isEnglish) : "") + (isEnglish
              ? `Conversation to analyze:\n\n${transcript}`
              : `שיחה לניתוח:\n\n${transcript}`),
          },
        ],
        response_format: { type: "json_object" },
      }),
    });
    if (!res.ok) {
      const body = await res.text();
      console.error("report AI error", res.status, body);
      if (debug) debug.reason = `ai_http_${res.status}: ${body.slice(0, 200)}`;
      return null;
    }
    const data = await res.json();
    const raw = data?.choices?.[0]?.message?.content ?? "{}";
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      const m = String(raw).match(/\{[\s\S]*\}/);
      parsed = m ? JSON.parse(m[0]) : null;
    }
    const valid = validateReport(parsed, isEnglish, therapistText);
    if (!valid) {
      console.error("report invalid: missing central failure or action steps");
      if (debug) debug.reason = `invalid: ${String(raw).slice(0, 300)}`;
      return null;
    }
    if (valid.flags.length) console.error("report flags:", valid.flags.join(","));
    return buildReport(valid, isEnglish);
  } catch (e) {
    console.error("report extraction failed", e);
    if (debug) debug.reason = `exception: ${String(e)}`;
    return null;
  }
}
// ===== diagnosis report: end =====

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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { botKey, conversationId, language } = await req.json();
    const isEnglish = language === "en";
    const cfg = PROMPTS[botKey];
    const isGeneric = !cfg;
    if (!conversationId) {
      return new Response(JSON.stringify({ error: "conversationId required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Load conversation messages
    const { data: msgs, error: msgErr } = await supabase
      .from("bot_messages")
      .select("role, content")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true })
      .limit(80);

    if (msgErr || !msgs || msgs.length < 2) {
      return new Response(JSON.stringify({ error: "Not enough conversation" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const transcript = msgs
      .map((m: any) => `${m.role === "user" ? (isEnglish ? "Therapist" : "מטפל") : (isEnglish ? "Mentor" : "מנטור")}: ${m.content}`)
      .join("\n");

    const lovableKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableKey) {
      return new Response(JSON.stringify({ error: "missing key" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemPrompt = isGeneric
      ? GENERIC_SUMMARY_SYSTEM
      : botKey === "practice-diagnosis" && isEnglish
      ? EN_DIAGNOSIS_EXTRACTION_SYSTEM
      : cfg!.system;

    // The formal report runs in parallel with the legacy extraction below and
    // never throws (null on any failure), so the legacy output is unaffected.
    const therapistText = msgs.filter((m: any) => m.role === "user").map((m: any) => String(m.content ?? "")).join("\n");
    const reportPromise = botKey === "practice-diagnosis" ? extractReport(transcript, therapistText, isEnglish, lovableKey) : null;

    const aiRes = await aiFetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${lovableKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: isEnglish
              ? `Conversation to analyze (tool: ${botKey}):\n\n${transcript}`
              : `שיחה לניתוח (כלי: ${botKey}):\n\n${transcript}`,
          },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!aiRes.ok) {
      const t = await aiRes.text();
      console.error("AI error", aiRes.status, t);
      return new Response(JSON.stringify({ error: "ai error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const data = await aiRes.json();
    const raw = data?.choices?.[0]?.message?.content ?? "{}";
    let parsed: Record<string, unknown> = {};
    try {
      parsed = JSON.parse(raw);
    } catch {
      const m = raw.match(/\{[\s\S]*\}/);
      if (m) parsed = JSON.parse(m[0]);
    }

    // Weekly-experiment fields (Wave 2.1) ride along in the same extraction
    // call for every bot but belong in their own table, not in the
    // tool-specific structured columns (niche_output/etc.) whose shape is
    // already relied on elsewhere (FinalCelebration.tsx, Mentor.tsx's
    // `from=` handler) — pull them out before anything else touches `parsed`.
    const { weekly_experiment, belief_under_test, expected_evidence, ...rest } = parsed as {
      weekly_experiment?: string;
      belief_under_test?: string;
      expected_evidence?: string;
      [key: string]: unknown;
    };

    // Map bot key -> journey stage key, so completing a tool auto-advances the journey
    const BOT_TO_STAGE: Record<string, string> = {
      "niche-finder": "niche",
      "pricing-calculator": "pricing",
      "self-presentation": "self-presentation",
      "contact-finder": "network",
      "connection-bridge": "conversion",
      "first-call-practice": "intake",
    };
    const stageKey = BOT_TO_STAGE[botKey];
    const STAGE_ORDER = ["niche", "pricing", "self-presentation", "network", "conversion", "intake"];

    // Upsert into therapist_journeys
    const { data: existing } = await supabase
      .from("therapist_journeys")
      .select("id, reflection, completed_stages, step_number")
      .eq("user_id", user.id)
      .maybeSingle();

    const prevCompleted = ((existing as any)?.completed_stages as string[] | null) ?? [];
    const completedSet = new Set(prevCompleted);
    if (stageKey) completedSet.add(stageKey);
    const newCompleted = STAGE_ORDER.filter((k) => completedSet.has(k));
    const nextStage = STAGE_ORDER.find((k) => !completedSet.has(k)) ?? STAGE_ORDER[STAGE_ORDER.length - 1];
    const nextStepNumber = STAGE_ORDER.indexOf(nextStage) + 1;

    const baseReflection = (existing?.reflection as Record<string, any>) ?? {};

    let updatePayload: Record<string, any> = {
      completed_stages: newCompleted,
      step_number: nextStepNumber,
      updated_at: new Date().toISOString(),
    };

    if (isGeneric) {
      const toolSummaries = (baseReflection.tool_summaries as Record<string, any>) ?? {};
      toolSummaries[botKey] = {
        summary: rest.summary ?? "",
        updated_at: new Date().toISOString(),
      };
      updatePayload.reflection = { ...baseReflection, tool_summaries: toolSummaries, current: nextStage };
    } else {
      let structured = buildStructuredOutput(botKey, rest);
      let report: Awaited<ReturnType<typeof extractReport>> = null;
      if (reportPromise) {
        report = await reportPromise;
        // The legacy recommended_tool is what payment webhooks and the CTA use. A report
        // that failed or whose central failure is a different area gets one more run with
        // the legacy area fixed (the rare path, so the common case keeps the parallel
        // latency). If it still disagrees it is dropped and logged rather than shown
        // next to a conflicting CTA.
        const legacyTool = String((structured as Record<string, unknown>).recommended_tool);
        if (!report || report.central_failure.area !== legacyTool) {
          if (report) console.error("report/legacy mismatch, rerunning", report.central_failure.area, legacyTool);
          report = await extractReport(transcript, therapistText, isEnglish, lovableKey, { forceArea: legacyTool });
        }
        if (report && report.central_failure.area !== legacyTool) {
          console.error("report/legacy mismatch after rerun", report.central_failure.area, legacyTool);
          report = null;
        }
        if (report) structured = { ...(structured as Record<string, unknown>), report };
      }
      updatePayload[cfg!.column] = structured;
      if (botKey === "practice-diagnosis") {
        // Feed the diagnosis into the Mentor's context (Fix 2) — same
        // tool_summaries channel journeyBlock in mentor-chat already reads
        // for every other bot, so no changes needed there.
        const toolSummaries = (baseReflection.tool_summaries as Record<string, any>) ?? {};
        toolSummaries[botKey] = {
          summary: buildDiagnosisMentorSummary(structured as Record<string, unknown>, isEnglish),
          updated_at: new Date().toISOString(),
        };
        updatePayload.reflection = { ...baseReflection, tool_summaries: toolSummaries, current: nextStage };
      } else {
        // Same tool_summaries channel as the diagnosis above, so the Mentor
        // (journeyBlock) and its "back from tool" card can see this tool's result.
        const summary = buildToolSummary(botKey, structured, isEnglish);
        const prevSummaries = (baseReflection.tool_summaries as Record<string, any>) ?? null;
        if (summary) {
          updatePayload.reflection = {
            ...baseReflection,
            tool_summaries: { ...(prevSummaries ?? {}), [botKey]: { summary, updated_at: new Date().toISOString() } },
            current: nextStage,
          };
        } else {
          updatePayload.reflection = { ...baseReflection, current: nextStage };
        }
      }
    }

    if (existing) {
      await supabase
        .from("therapist_journeys")
        .update(updatePayload)
        .eq("user_id", user.id);
    } else {
      await supabase
        .from("therapist_journeys")
        .insert({ user_id: user.id, ...updatePayload });
    }

    if (botKey === "practice-diagnosis") {
      const userMessages = msgs.filter((m: any) => m.role === "user").map((m: any) => m.content as string);
      const signals = computeLeadSignals(userMessages, isEnglish);
      const { error: signalsErr } = await supabase.from("diagnosis_lead_signals").upsert(
        { user_id: user.id, conversation_id: conversationId, email: user.email ?? null, ...signals },
        { onConflict: "user_id" },
      );
      if (signalsErr) console.error("lead signals upsert error:", signalsErr);

      // One history row per completed run (therapist_journeys keeps only the latest).
      const savedReport = (updatePayload[cfg!.column] as { report?: { rubric_version: number; scores: { overall: number | null; areas: AreaScore[] } } } | undefined)?.report;
      if (savedReport) {
        const areaScores: Record<string, number | null> = {};
        for (const a of savedReport.scores.areas) areaScores[a.area] = a.score;
        const { error: histErr } = await supabase.from("diagnosis_results").insert({
          user_id: user.id,
          conversation_id: conversationId,
          rubric_version: savedReport.rubric_version,
          overall: savedReport.scores.overall,
          area_scores: areaScores,
          report: savedReport,
        });
        if (histErr) console.error("diagnosis_results insert error:", histErr);
      }
    }

    // Wave 2.1: record the therapist's actual commitment as a weekly
    // experiment, captured from their real answer to the commitment
    // question appended to this bot's prompt — not inferred here.
    if (typeof weekly_experiment === "string" && weekly_experiment.trim()) {
      await supabase.from("weekly_experiments").insert({
        user_id: user.id,
        bot_key: botKey,
        stage: stageKey ?? nextStage,
        action_text: weekly_experiment.trim(),
        belief_under_test: typeof belief_under_test === "string" ? belief_under_test.trim() : "",
        expected_evidence: typeof expected_evidence === "string" ? expected_evidence.trim() : "",
      });
    }

    return new Response(JSON.stringify({ success: true, output: parsed }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("bot-extract-output", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "unknown" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
