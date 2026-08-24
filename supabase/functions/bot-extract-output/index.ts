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

const HE_DIAGNOSIS_EXTRACTION_SYSTEM = `אתה מנסח, בקול של אליענה — המנטורית של "קליניקה בדרך" — את תוצאת שיחת "האבחון" שהתקיימה זה עתה בין הבוט למטפל/ת פסיכותרפיסט/ית. השיחה עברה 4 שלבים: פתיחה, חקירה אדפטיבית (מיקום קישור שבור במשפך + השערת מנגנון התנהגותי), אבחון במבנה "אהא", והמלצת צעד הבא.

זה לא ניתוח עסקי קר — זה מסמך שהמטפל/ת יקבל/תקבל בסוף השיחה ויקרא/תקרא בעצמו/ה. לכן כל שדה טקסטואלי (כל השדות מלבד bottleneck_stage, stuck_category, recommended_tool, engagement_depth) חייב להיות כתוב בקול הטיפולי של אליענה, לא כדוח:
- עברית חמה, ישירה, לא שיווקית ולא קלינית. אף שדה לא נשמע כמו תקציר ניהולי.
- Clean Language: להחזיר את המילים המדויקות שהמטפל/ת עצמו/ה השתמש/ה בהן, לא לתרגם אותן לניסוח "מקצועי".
- לעולם לא: "בהחלט", "מצוין", "כמובן", "נהדר" (מילות מילוי ריקות), וגם לא "טארגט", "ליד", "פאנל", "קהל יעד" (שפה שיווקית קרה).
- משפטים קצרים. לא למלא כל רגע במילים.

שני כללי ניסוח קריטיים נוספים — הופרו בגרסה קודמת, חובה לשמור עליהם. שים לב: הדוגמאות למטה מובאות בלי מרכאות כפולות בכוונה, כדי לא ליצור בלבול עם תחביר ה-JSON של הפלט עצמו — אל תעתיק סימני ציטוט לתוך הערכים שאתה מפיק.

1. אף פעם לא לסתור את המטפל/ת. התבנית חשבת ש-X, אבל בעצם Y יוצרת תחושה לא נעימה של תיקון — כאילו הוא/היא טעה/תה. אסור להשתמש בה. במקום זאת: לאמת קודם את מה שיש בו אמת בתפיסה של המטפל/ת, ואז להוסיף עליה שכבה — לא לסתור אותה — כך שהוא/היא עצמו/ה יוכל/תוכל לראות מה עוד חסר.
   אסור לנסח כך: חשבת שהפרסום לא עובד, אבל בעצם הוא עובד מצוין, מה שחסר זו ההובלה המיטיבה שלך.
   לנסח כך במקום: יש משהו אמיתי בתחושה שהפרסום הוא הבעיה, זה באמת המקום שהכי כואב עכשיו. וכשמסתכלים מקרוב על מה שקורה בפועל, מתגלה עוד שכבה: הפניות כבר מגיעות. מה שעדיין חסר הוא ההובלה המיטיבה שלך ברגע שהם כבר כאן.
   זה חל במיוחד על diagnosis_summary, אבל גם על כל שדה אחר שמשווה בין מה שהמטפל/ת חשב/ה לבין הממצא.

2. לא לתאר תהליכים כמכונה. ביטויים כמו הקישור נשבר, המנגנון נכשל נשמעים כמו תיאור מערכת, לא בן אדם. לתאר את מה שקורה בין אנשים, לא בין רכיבים.
   אסור לנסח כך: הקישור שבין הפנייה הראשונית לבין קביעת הפגישה בקליניקה נשבר.
   לנסח כך במקום: המקום שבו אתה עדיין מאבד אנשים הוא הרגע שאחרי שהם כבר פנו אליך, הם כאן, אבל לא מגיעים לקבוע פגישה.
   זה חל בעיקר על bottleneck_description ו-behavioral_mechanism.

החזר JSON תקין בלבד, בלי טקסט נוסף, בפורמט הבא בדיוק:
{
  "presenting_theory": "מה המטפל/ת חשב/ה שהבעיה, במילים שלו/ה, לפני האבחון",
  "what_is_working": "מה כן עובד טוב אצל המטפל/ת בתהליך הבאת המטופלים — לא מחמאה גנרית, אלא עוגן קונקרטי במה שעלה בפועל בשיחה (למשל שהאתר מייצר פניות, שיש רשת קשרים קיימת, שהמסר ברור לחלק מהאנשים). זו הנקודה שבה מתחילים — אימות של מה שכבר נכון, לפני שעוברים לחסם.",
  "evidence_summary": "העובדות/הנתונים הקונקרטיים שעלו בשיחה (כולל מספרים אם ניתנו) — לא התיאוריה של המטפל/ת, מה שבאמת קרה. תיאור אנושי, לא רשימת נתונים יבשה.",
  "bottleneck_stage": "reach | inquiry_to_conversation | conversation_to_booking | booking_to_followthrough | unclear",
  "bottleneck_description": "משפט אחד בשפה אנושית וקונקרטית שמתאר את הרגע הספציפי שבו אנשים עוד נמצאים איתו/ה אבל לא מגיעים הלאה (מקביל למה שנאמר בפועל בשלב 3 סעיף 3 של השיחה) — ראה כלל ניסוח 2 למעלה: לתאר רגע בין אנשים, לא רכיב שנשבר.",
  "behavioral_mechanism": "ההסבר הספציפי, ברמת ההתנהגות, למה זה קורה — מה בפועל המטפל/ת עושה או לא עושה ברגע הזה. ראה כלל ניסוח 2 למעלה.",
  "stuck_category": "pricing_fear | unclear_niche | no_patients_despite_marketing | self_presentation_anxiety | referral_network_gap | confidence_in_value | time_or_capacity | other",
  "evidence_quote": "ציטוט קצר מדברי המטפל/ת שתומך באבחון",
  "diagnosis_summary": "משפט ה'אהא' — לא סתירה של מה שהמטפל/ת חשב/ה, אלא אימות שלו ואז הוספת השכבה שמתגלה. ראה כלל ניסוח 1 למעלה — זה השדה שהכי חשוב להקפיד בו.",
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

Return valid JSON only, no extra text, in exactly this format:
{
  "presenting_theory": "what the therapist thought the problem was, in their own words, before the diagnosis",
  "what_is_working": "what's actually working well for the therapist in bringing in patients — not a generic compliment, but a concrete anchor in what actually came up in the conversation (e.g. the website generates inquiries, there's an existing referral network, the message is clear to some people). This is where you start — validating what's already true, before moving to the blocker.",
  "evidence_summary": "the concrete facts/data that came up in the conversation (including numbers if given) — not the therapist's theory, what actually happened. A human description, not a dry list of data.",
  "bottleneck_stage": "reach | inquiry_to_conversation | conversation_to_booking | booking_to_followthrough | unclear",
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
const BOTTLENECK_STAGES = [
  "reach",
  "inquiry_to_conversation",
  "conversation_to_booking",
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

// Generic prompt for any other bot — produces a short summary string
const GENERIC_SUMMARY_SYSTEM = `אתה מנתח שיחה בין כלי AI למטפל פסיכותרפיסט.
החזר JSON תקין בלבד בפורמט הבא:
{
  "summary": "סיכום קצר בעברית, 2-4 משפטים, של מה שהמטפל גילה / החליט / תרגל בכלי. דבר בגוף ראשון של המטפל ('הבנתי ש...', 'החלטתי ש...', 'תרגלתי...'). אם אין מסקנה ברורה — תאר במשפט מה נדון."${WEEKLY_EXPERIMENT_FIELDS}
}
השתמש רק במה שאמר המטפל בפועל. אל תמציא.`;

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

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
      const structured = buildStructuredOutput(botKey, rest);
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
        updatePayload.reflection = { ...baseReflection, current: nextStage };
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
