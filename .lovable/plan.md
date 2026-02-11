
# מסך לימוד מפוצל: וידאו + מצגת + הערות אישיות

## סקירה כללית

שדרוג דף השיעור (`LessonDetail`) כך שבמסך רחב (דסקטופ) התוכן יוצג בתצורה מפוצלת:
- **צד ימין (60%)**: נגן הוידאו
- **צד שמאל (40%)**: מציג המצגת (PDF) של אותו שיעור
- **מתחת**: אזור הערות אישיות של הסטודנט, שנשמרות במסד הנתונים

במסכים צרים (מובייל/טאבלט) התצוגה תהיה אנכית (וידאו מעל, מצגת מתחת).

## מה צריך לבנות

### 1. טבלת מסד נתונים חדשה: `user_lesson_notes`

טבלה לשמירת הערות אישיות של סטודנטים לכל שיעור:

```text
user_lesson_notes
-----------------
id            uuid (PK)
user_id       uuid (NOT NULL)
lesson_id     uuid (NOT NULL, FK -> lessons)
content       text (default '')
updated_at    timestamptz
created_at    timestamptz
UNIQUE(user_id, lesson_id)
```

מדיניות RLS:
- סטודנטים יכולים לראות, ליצור ולעדכן רק את ההערות שלהם
- אדמינים יכולים לצפות בכל ההערות

### 2. רכיב מציג מצגת (PresentationViewer)

רכיב חדש `src/components/portal/PresentationViewer.tsx` שמציג PDF באמצעות iframe:
- יפיק signed URL מ-Supabase Storage עבור קובץ המצגת
- יציג את ה-PDF ב-iframe עם גלילה
- יציג הודעה אם אין מצגת זמינה לשיעור

### 3. רכיב הערות אישיות (LessonNotes)

רכיב חדש `src/components/portal/LessonNotes.tsx`:
- Textarea עם `dir="auto"` לתמיכת RTL
- שמירה אוטומטית (auto-save) אחרי 2 שניות של הפסקת הקלדה (debounce)
- אינדיקציית "נשמר" / "שומר..."
- טעינת ההערות הקיימות בעת כניסה לשיעור

### 4. שינוי תצוגת דף השיעור (LessonDetail)

שינוי הלייאוט הראשי מתצוגה אנכית לתצוגה מפוצלת:

```text
+--------------------------------------------------+
|  סרגל ניווט (כותרת + חצים קדימה/אחורה)            |
+--------------------------------------------------+
|                    |                              |
|   מצגת PDF (40%)   |      וידאו (60%)             |
|                    |                              |
+--------------------------------------------------+
|  הערות אישיות + כותרת השיעור + טאבים             |
+--------------------------------------------------+
```

- שימוש ב-CSS Grid/Flex עם `w-[60%]` ו-`w-[40%]`
- במובייל: תצוגה אנכית (וידאו מעל, מצגת מתחת)
- המצגת תזוהה אוטומטית מתוך ה-resources של השיעור (סוג `presentation`)

### 5. Hook חדש: `useLessonNotes`

`src/hooks/useLessonNotes.ts` - hook לניהול הערות:
- טעינה מ-Supabase
- שמירה עם debounce
- מצב שמירה (saving/saved)

## פירוט טכני

### מיגרציית SQL

```sql
CREATE TABLE public.user_lesson_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  lesson_id uuid NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  content text NOT NULL DEFAULT '',
  updated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, lesson_id)
);

ALTER TABLE public.user_lesson_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notes"
  ON public.user_lesson_notes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notes"
  ON public.user_lesson_notes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notes"
  ON public.user_lesson_notes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all notes"
  ON public.user_lesson_notes FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));
```

### זיהוי מצגת

המצגת תזוהה מתוך ה-resources הקיימים של השיעור:
```typescript
const presentation = resources.find(r => r.type === 'presentation');
```
ללא צורך בשינוי מבנה הנתונים.

### Auto-save עם Debounce

ההערות יישמרו אוטומטית אחרי 2 שניות ללא הקלדה באמצעות `upsert` על הצירוף הייחודי `(user_id, lesson_id)`.

### Responsive Layout

- דסקטופ (מעל 1024px): פיצול אופקי 60/40
- מובייל/טאבלט: תצוגה אנכית, וידאו מעל מצגת

## קבצים לעדכון/יצירה

| קובץ | פעולה |
|------|-------|
| מיגרציית SQL | יצירת טבלת `user_lesson_notes` עם RLS |
| `src/components/portal/PresentationViewer.tsx` | רכיב חדש - מציג PDF |
| `src/components/portal/LessonNotes.tsx` | רכיב חדש - הערות אישיות |
| `src/hooks/useLessonNotes.ts` | Hook חדש - ניהול הערות |
| `src/pages/LessonDetail.tsx` | שינוי לייאוט מפוצל |
| `src/integrations/supabase/types.ts` | עדכון טיפוסים |
