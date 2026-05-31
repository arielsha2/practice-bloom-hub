
## המטרה

לאפשר לאדמין להתנסות במנטור כמטפל חדש — להתחיל את המסע מאפס בכל פעם, בלי זיכרון קודם.

## הפתרון

הוספת כפתור **"איפוס המסע והתחלה מחדש"** במצב אדמין בלבד, שמוחק את כל הנתונים האישיים שנצברו על המשתמש הנוכחי במנטור, ומחזיר את החוויה למצב התחלתי.

### מה הכפתור ימחק (עבור user_id של האדמין הנוכחי)

1. **`therapist_journeys`** — שורת המסע (שלבים, נקודות תקיעה, רפלקציות, פלטי נישה והצגה עצמית)
2. **`bot_user_memory`** — כל הזיכרון ארוך-הטווח של הבוטים על המשתמש
3. **`bot_conversations` + `bot_messages`** — היסטוריית שיחות הצ׳אט (המסרים יימחקו דרך מחיקת השיחות)

### איפה הכפתור יופיע

- בעמוד **`/mentor`** (המנטור עצמו) — כפתור קטן בפינה, גלוי רק כש-`useIsAdmin()` מחזיר true
- וגם בעמוד **`/admin/mentor`** (MentorAdmin) — כסקציה ייעודית "בדיקת חוויית מטפל חדש" עם הסבר וכפתור

### הגנות

- **דיאלוג אישור** ("אתה עומד למחוק את כל ההתקדמות שלך במנטור — להמשיך?")
- **רק אדמין** יכול ללחוץ (בדיקת `has_role` גם ב-client וגם ב-RLS)
- מחיקה מתבצעת רק על `user_id = auth.uid()` — בלתי אפשרי למחוק נתונים של מטפל אחר
- אחרי המחיקה: רענון אוטומטי של ה-state והפניה לתחילת המסע

### מבנה טכני

```text
- hook חדש: useResetMentorJourney() — מבצע 3 מחיקות במקביל ומשגר אירוע 'therapist-journey-updated'
- קומפוננטה: ResetMentorButton.tsx — כפתור + AlertDialog לאישור
- שילוב ב-Mentor.tsx (גלוי לאדמין בלבד) וב-MentorAdmin.tsx
- לא נדרשת מיגרציית DB — ה-RLS הקיים (auth.uid() = user_id) כבר מאפשר למשתמש למחוק את הנתונים של עצמו, וטבלת bot_user_memory ו-bot_conversations יש להן policy "Users can manage own ..."
```

### בדיקה אם יש בעיית הרשאות

- `therapist_journeys`: policy "Users manage own journey" עם `auth.uid() = user_id` — ✅ מאפשר DELETE
- `bot_user_memory`: policy "Users can manage own memory" — ✅ מאפשר DELETE
- `bot_conversations`: policy "Users can manage own conversations" — ✅ מאפשר DELETE
- `bot_messages`: policy ALL דרך `bot_conversations` — ✅ יימחקו בקסקייד דרך מחיקת השיחות (אם אין FK cascade, נמחק ידנית קודם את ההודעות)

**הערה:** אין FK declared בטבלאות, אז המחיקה תתבצע בסדר: messages → conversations → memory → journey.

## שאלה אחת לפני יישום

האם הכפתור צריך למחוק גם את **`user_lesson_progress`** ו-**`user_lesson_notes`** (התקדמות בשיעורי הקורס + הערות אישיות), או רק את החלקים שקשורים למנטור והבוטים? לדעתי לא צריך — הקורס זה משהו אחר מהמנטור — אבל כדאי לאשר.
