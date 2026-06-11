## הבעיה והפתרון

כיום המנטור עונה לפעמים בערבית במקום בעברית, כי ה־prompt של האדמין ב־DB לא כולל הוראת שפה קשיחה, ו־Gemini 2.5 Pro דולף לערבית כשמדבר עברית.

הפתרון: להוסיף ב־edge function `supabase/functions/mentor-chat/index.ts` שכבת "הוראת שפה" קצרה שמתנהגת בדיוק כפי שביקשת.

## ההתנהגות החדשה

| מצב | התנהגות המנטור |
|---|---|
| המשתמש נכנס דרך טאב **עב** (`language="he"`) | מתחיל ועונה בעברית |
| המשתמש נכנס דרך טאב **EN** (`language="en"`) | מתחיל ועונה באנגלית |
| המטפל כותב הודעה בשפה אחרת (למשל אנגלית באמצע שיחה בעברית) | המנטור עובר לשפה שלו ונשאר בה — **רק בשיחה הזו** |
| בכל מצב | אף פעם לא ערבית או שפה שלישית |

נעילה לשיחה הספציפית מתבצעת באופן טבעי, כי כל בקשה ל־edge function נושאת את היסטוריית ההודעות של אותה שיחה בלבד — אין שיתוף בין משתמשים.

## השינוי בקוד

קובץ יחיד: `supabase/functions/mentor-chat/index.ts`, מיד אחרי בניית `baseSystemPrompt` (סביבות שורה 210):

```ts
const defaultLang = language === "en" ? "English" : "Hebrew";

const languageRule = `

═══════════════════════════════
LANGUAGE RULE (overrides everything else):
═══════════════════════════════
- Default language for this conversation: ${defaultLang}.
- Reply in ${defaultLang} unless the user's most recent message is clearly written in another language.
- If the user writes in another language (e.g. switches from Hebrew to English mid-conversation), match their language for the rest of this conversation.
- NEVER reply in Arabic. NEVER use Arabic script. If you find yourself drafting Arabic, rewrite in ${defaultLang} before sending.
- Hebrew = Hebrew script (אבגד). English = Latin script. Do not mix scripts within one reply.
- Tool names, brand names, and URLs may stay in their original language.
`;

const systemPrompt = baseSystemPrompt + journeyBlock + freeTrialBlock + languageRule;
```

זהו. אין שינוי במודל, ב־UI, או ב־prompt של האדמין.

## מה לא משתנה

- ה־prompt של האדמין ב־`mentor_ai_settings` — נשאר בידיו.
- ה־UI ב־`Mentor.tsx` ובחירת השפה ב־`LanguageContext` — ללא שינוי. הם כבר שולחים נכון את `language` הפעיל לפי הטאב.
- שאר הבוטים — לא נוגעים בהם בשלב הזה (אפשר להוסיף שם את אותו בלוק אם הבעיה חוזרת גם בהם).
