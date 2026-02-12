

# תיקון באג ההיעלמות של תשובות הבוט - גרסה סופית

## שורש הבעיה (שתי בעיות)

### בעיה 1: שליחה כפולה
שתי בקשות POST זהות נשלחות במקביל לאותה הודעה (`conversationId: null`). זה יוצר שתי שיחות חדשות בו-זמנית. הסיבה האפשרית: React StrictMode או לחיצה כפולה.

### בעיה 2: Race Condition (הבעיה העיקרית)
1. המשתמש שולח הודעה עם `conversationId: null`
2. הסטרימינג מתחיל - הודעת assistant מתחילה להתמלא מקומית
3. **באמצע הסטרימינג**: ה-header `X-Conversation-Id` מגיע -> `onConversationCreated` נקרא -> `setActiveConversationId(newId)` 
4. זה מפעיל את `useBotMessages(newId)` -> query לדאטאבייס
5. הדאטאבייס מחזיר רק את הודעת המשתמש (ה-assistant עדיין בסטרימינג)
6. ה-useEffect רואה ש-`savedMessages` (1 הודעה) שונה מ-`messages` (2 הודעות) -> מחליף -> **התשובה נעלמת**

## הפתרון

### 1. `src/hooks/useBotChat.ts` - עיכוב `onConversationCreated` + מניעת שליחה כפולה

**מניעת שליחה כפולה**: בתחילת `sendMessage`, אם `isLoading` כבר true - לא לשלוח שוב.

**עיכוב הודעה על שיחה חדשה**: במקום לקרוא ל-`onConversationCreated` ברגע שה-header מגיע (באמצע הסטרימינג), לשמור את ה-ID החדש במשתנה מקומי ולקרוא ל-`onConversationCreated` רק **אחרי שהסטרימינג מסתיים**. כך ה-`activeConversationId` לא ישתנה באמצע סטרימינג ולא יגרום לטעינת הודעות מהדאטאבייס.

### 2. `src/pages/BotChat.tsx` - הגנה נוספת עם `chatLoading`

הוספת `chatLoading` כתנאי ישיר (לא רק דרך ref) ב-useEffect של סנכרון ההודעות. אם `chatLoading` הוא true - לא לסנכרן.

## קבצים לעדכון

| קובץ | שינוי |
|------|-------|
| `src/hooks/useBotChat.ts` | 1. Guard נגד שליחה כפולה 2. העברת `onConversationCreated` לאחרי סיום הסטרימינג |
| `src/pages/BotChat.tsx` | הוספת `chatLoading` כתנאי ישיר ב-useEffect |

