
## מה משתנה

### 1. איחוד היסטוריה — שיחה אחת רציפה לכל משתמש

**המצב היום:** כל "סשן" (לפי `session_id` שנשמר ב-localStorage) יוצר שורה נפרדת ב-`mentor_conversations`. דפדפן חדש / מכשיר חדש / ניקוי קאש = שיחה חדשה מההתחלה, וההיסטוריה הישנה לא נראית בצ׳אט.

**אחרי השינוי:** שיחה אחת רציפה לכל `(user_id, language)`. גם בכניסה ממכשיר אחר — אותו רצף, ממשיך בדיוק מאיפה שהפסיק.

**צעדים:**

- **Migration:**
  - הוספת עמודה `language text default 'he'` ל-`mentor_conversations` (אם לא קיימת — לבדוק; כרגע אין הפרדה לפי שפה ב-DB).
  - איחוד היסטוריה קיימת: לכל `(user_id, language)` עם מספר שורות — לאחד את כל מערכי `messages` לפי `created_at`, להוריד הודעות עוקבות זהות (dedup לפי role+content), לשמור בשורה אחת (המוקדמת) ולמחוק את היתר. סכימת `insight_count` מחדש מהמערך המאוחד.
  - הוספת `UNIQUE (user_id, language)` אחרי האיחוד.

- **קוד (`src/pages/Mentor.tsx`):**
  - בטעינה ראשונית: לפני קריאת localStorage — לטעון את השיחה המאוחדת מ-DB לפי `(user.id, language)`. אם קיימת ב-DB → להשתמש בה כמקור האמת ולסנכרן ל-localStorage. אם רק localStorage קיים → להעלות ל-DB.
  - הסרת לוגיקת `session_id` הנפרד למסלול השמירה. שמירה תהיה upsert על `(user_id, language)` במקום insert חדש.
  - מחיקת המפתח `mentor-session:${language}:${user.id}` מ-localStorage (לא רלוונטי יותר).

### 2. הורדת PDF + שיתוף ידני

- **כפתור חדש בכותרת הצ׳אט:** "הורד שיחה" (אייקון Download) שפותח תפריט קטן: **הורד PDF** / **העתק טקסט**.
- **PDF:** יצירת PDF בצד-לקוח עם `html2pdf.js` (html2canvas + jsPDF). הסיבה: רנדור DOM ישיר עם תמיכה מלאה ב-RTL ובעברית (Heebo כבר טעון בעמוד), בלי צורך להטמיע פונט ב-jsPDF.
  - שם קובץ: `therapykeys-mentor-{YYYY-MM-DD}.pdf`.
  - תוכן: כותרת ("שיחה עם המנטור — {שם המשתמש} — {תאריך}"), ולאחריה בועות הודעה (User / Mentor) עם תאריך/שעה. ללא תגי `[HANDOFF:...]` ו-`[INSIGHT]` (סינון לפני הרנדור).
  - עיצוב: רקע לבן, צבעי המותג (Deep Purple לכותרות, Coral להדגשות), פונט Heebo, מרווחי הדפסה.
- **שיתוף ידני:** כפתור "העתק טקסט" שמעתיק לפלאוורד את כל השיחה בפורמט פשוט (`**את/ה:** ...\n\n**המנטור:** ...`) כדי שהמשתמש יוכל להדביק בוואטסאפ/מייל.

### 3. UX קטן

- ב-`ResetMentorButton` להוסיף אזהרה ברורה: "פעולה זו תמחק את כל השיחה הצבורה ולא ניתן לשחזר. רוצה להוריד אותה לפני?" עם קישור ישיר לכפתור ההורדה.

---

## פירוט טכני

### Schema

```sql
ALTER TABLE public.mentor_conversations
  ADD COLUMN IF NOT EXISTS language text NOT NULL DEFAULT 'he';

-- מיגרציה חד-פעמית: איחוד שורות קיימות (פונקציה PL/pgSQL שעוברת על
-- כל (user_id, language), מאחדת messages JSONB, מוחקת כפילויות עוקבות,
-- שומרת בשורה הראשונה ומוחקת את היתר).

ALTER TABLE public.mentor_conversations
  ADD CONSTRAINT mentor_conversations_user_language_unique
  UNIQUE (user_id, language);
```

### Save loop ב-Mentor.tsx

החלפת ה-insert/update הקיים ב:

```text
upsert({ user_id, language, messages, insight_count, stage },
       { onConflict: 'user_id,language' })
```

### Load on mount

לפני `useState(initial)` של messages — שאילתה חד-פעמית: `select messages from mentor_conversations where user_id=? and language=? limit 1`. אם ה-DB מכיל יותר הודעות מ-localStorage → לשטוף את localStorage עם תוכן ה-DB.

### תלות חדשה

`bun add html2pdf.js` (~150KB gzipped, lazy-loaded רק כשלוחצים על "הורד").

---

## מה לא נכלל

- ייצוא לשיתוף ציבורי בקישור (לפי הבחירה שלך — רק הורדה ידנית).
- שיחות נפרדות מרובות (threads) — נשארת שיחה אחת ארוכה לכל משפה.
- שינוי בשמירת השיחות של הבוטים (`bot_conversations`) — מחוץ לסקופ.
