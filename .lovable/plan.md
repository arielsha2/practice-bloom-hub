
## `HandoffManager` אחיד — בלי האוברלי

### עיקרון
כל 6 נקודות ההפעלה של `setActiveBotKey` ב-`Mentor.tsx` עוברות דרך פונקציה אחת: `triggerHandoff(botKey, source)`. שום קומפוננטה לא קוראת ל-`setActiveBotKey` ישירות יותר.

### נקודות החלפה ב-`Mentor.tsx`
| שורה | מקור (`source`) |
|---|---|
| 1087-1099 | `auto-tag` (זיהוי תג HANDOFF בסטרים) |
| 1277-1278 | `map` (סיידבר דסקטופ) |
| 1555 | `message-link` (קליק על קישור-בוט בהודעה) |
| 1616-1617 | `suggested-banner` (הבאנר הקיים "המנטור רוצה להעביר אותך") |
| 1673-1674 | `map` (אקורדיון מובייל) |
| 1697-1699 | `map` (מפת המסע המלאה) |

### מבנה
**Hook חדש** `src/hooks/useHandoffManager.ts`:
- `triggerHandoff(botKey, source)` — מעדכן `lastHandoffAt`, קורא ל-`onActivate(botKey)`, פותח Sheet במובייל, גולל ל-iframe (`scrollIntoView({block:'center'})`) בדסקטופ, שולח לוג `emitted`.
- `handleIframeLoad()` — נקרא מ-`onLoad` של ה-iframe; מסמן `iframeLoaded=true`, שולח לוג `opened`.
- `notifyUserSentMentorMessage()` — נקרא מתוך `send()` ב-`Mentor.tsx` בתחילת כל הודעה למנטור; אם נשלח handoff בתוך 60ש׳ ו-`iframeLoaded===false` → לוג `failed` + מציג באנר.
- `retry()` / `dismissFailure()` — לפעולות הבאנר.

**קומפוננטות חדשות:**
- `src/components/mentor/HandoffFailureBanner.tsx` — באנר אדום מעל ה-Composer: "נראה שלא הצלחת להגיע ל[שם]. [פתחי שוב] [X]". מובחן ויזואלית מה-`suggestedBotKey` הקיים.
- `src/components/mentor/MobileBotSheet.tsx` — `<Sheet side="bottom" h-[100dvh]>` שעוטף את ה-iframe; מוצג רק במובייל (`useIsMobile() === true`).

**Edge function חדש** `supabase/functions/mentor-handoff-log/index.ts` — POST `{bot_key, source, status, conversation_id}`, מאמת JWT, ומכניס שורה ל-`mentor_handoff_events` עם service-role.

**שינויים ב-`Mentor.tsx`:**
- `iframeRef = useRef<HTMLIFrameElement>(null)` + `onLoad={handleIframeLoad}` על ה-iframe בשורה 1469.
- במובייל: רנדור `<MobileBotSheet>` במקום ה-iframe ה-inline (`useIsMobile()` קובע).
- ה-iframe inline בדסקטופ נשאר אבל מקבל `ref={iframeRef}` ו-`onLoad`.
- בתחילת `send()` קריאה ל-`notifyUserSentMentorMessage()`.
- מחיקת ה-`setTimeout(1200ms)` ושל ה-toast המקורי.
- מחיקת `chatCardRef.scrollIntoView` משש המקומות (עובר ל-Manager שגולל ל-`iframeRef`).
- רנדור `<HandoffFailureBanner>` כשיש `state.failedKey`.

### מה לא משתנה
- `detectHandoff`, `normalizeBotKey`, `HANDOFF_ALIASES`, `BOT_KEYS` — לא נוגעים.
- חוזה ה-iframe (URL `/ai-assistants/:key?kickoff=1&from=mentor`) — לא משתנה. `BotChat.tsx` לא יודע על ה-Manager.
- הפרומפט של `mentor-chat` — לא נוגע. אם הלוג יראה שעדיין יש חזרות מיותרות על `HANDOFF` באותה שיחה, נטפל בזה בצעד נפרד.
- **ללא אוברלי 800ms** — כפי שביקשת. נחזור לזה אם הלוג יראה שעדיין מפספסים.

### בסיס הנתונים
טבלה `mentor_handoff_events` כבר נוצרה (`emitted` / `opened` / `failed`, עם RLS לקריאה לבעלים+אדמין, INSERT דרך service-role בלבד).

---

מאשר לבנות את שאר הקבצים?
