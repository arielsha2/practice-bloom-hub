
## מה מצאתי

המשתמשת `sabreenkhayatt.sk@gmail.com` (id: `7362671b-2279-4edf-a6de-daee62099336`) — משלמת, מייל מאומת, לא חסומה. יש לה שיחה אחת ב-`mentor_conversations` עם **2,400 הודעות** ופייל־ואד של **~1.9MB**. כל בקשה ל-`mentor-chat` שולחת את המערך המלא, כל כתיבה שומרת את המלא ל-DB ול-localStorage → הבקשות נכשלות/מקרסות (כולל `QuotaExceededError` ב-localStorage). זו הסיבה שהיא לא מצליחה להיכנס בימים האחרונים.

---

## תוכנית מעודכנת (לפי הבקשות שלך)

### 1) מיגרציה — הוספת עמודת ארכיון

הוספה של `messages_archive jsonb` ל-`mentor_conversations` (nullable, default null). זו שינוי סכמה → migration.

```sql
ALTER TABLE public.mentor_conversations
  ADD COLUMN IF NOT EXISTS messages_archive jsonb;
```
בלי שינויי RLS/grants — הטבלה קיימת ומאובטחת.

### 2) תיקון נתונים חד-פעמי (data fix, לא migration)

עבור המשתמשת בלבד: לשמור עותק מלא ל-`messages_archive`, ואז לגזור את `messages` ל-200 האחרונות **בסדר כרונולוגי נכון**:

```sql
WITH src AS (
  SELECT id, messages, jsonb_array_length(messages) AS n
  FROM public.mentor_conversations
  WHERE user_id = '7362671b-2279-4edf-a6de-daee62099336'
),
trimmed AS (
  SELECT
    src.id,
    (
      SELECT jsonb_agg(elem ORDER BY idx)          -- ← סדר כרונולוגי משומר
      FROM jsonb_array_elements(src.messages)
             WITH ORDINALITY AS t(elem, idx)
      WHERE idx > GREATEST(src.n - 200, 0)          -- 200 האחרונות
    ) AS new_messages
  FROM src
)
UPDATE public.mentor_conversations mc
SET messages_archive = COALESCE(mc.messages_archive, mc.messages),  -- ← ארכוב לפני גזירה
    messages         = trimmed.new_messages,
    updated_at       = now()
FROM trimmed
WHERE mc.id = trimmed.id;
```

הערות:
- `COALESCE(messages_archive, messages)` מונע דריסה אם נריץ שוב בטעות.
- `ORDER BY idx` ב-`jsonb_agg` מבטיח שהסדר הכרונולוגי נשמר (הוספה שביקשת).
- מריץ עבור user יחיד — לא נוגע בשאר.

### 3) תיקון שיטתי ב-`src/pages/Mentor.tsx`

כדי שהבעיה לא תחזור לאף אחד:

- קבוע חדש בראש הקובץ:
  ```ts
  const MAX_HISTORY_SENT = 40;      // מה שנשלח ל-edge functions
  const MAX_HISTORY_PERSIST = 500;  // מה שנשמר ב-DB
  const MAX_HISTORY_LOCAL = 200;    // מה שנשמר ב-localStorage
  ```
- **שליחה ל-`mentor-chat` (שורה 1068)** ולקריאות פנימיות (1184, 1229) — לשלוח `slice(-MAX_HISTORY_SENT)` במקום המערך המלא. ה-backend ממילא גוזר ל-20 אחרונות (`HISTORY_WINDOW` ב-`mentor-chat/index.ts:553`), אז זה בטוח לחלוטין.
- **Upsert ל-DB (שורות ~755-785)** — לשמור `messages.slice(-MAX_HISTORY_PERSIST)`.
- **localStorage (שורות 694-702)** — לעטוף ב-`try/catch`, לשמור `slice(-MAX_HISTORY_LOCAL)`, ובכישלון (Quota) לנקות את המפתח בשקט.
- **הידרציה מ-DB (705-745)** — ללא שינוי לוגי; תטען את מה שיש.

ה-UI ממשיך להחזיק את כל ההיסטוריה של הסשן הנוכחי בזיכרון — רק ההתמדה מוגבלת.

---

## מה לא משתנה
- שום שינוי ב-Edge Functions (`mentor-chat`, `mentor-analyze`).
- שום שינוי ב-RLS/grants.
- שום השפעה על משתמשים אחרים.
- הארכיון (`messages_archive`) נשאר זמין אם נרצה בעתיד להציג/לייצא היסטוריה מלאה או לבנות summarization.

## קבצים שאשנה
1. `supabase/migrations/<ts>_add_messages_archive.sql` — עמודה חדשה (דרך migration tool).
2. Data-fix דרך insert tool — ה-`UPDATE` למעלה.
3. `src/pages/Mentor.tsx` — 4 נקודות (constants + send + persist + localStorage).

לאשר להתקדם?
