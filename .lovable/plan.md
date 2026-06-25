## מטרה

להוסיף לטבלת המשתמשים באדמין עמודה שמראה לכל משתמש האם הזין מפתח Gemini תקין, כולל ה-4 ספרות האחרונות ותאריך האימות האחרון.

## איך זה יעבוד

לכל משתמש בטבלה תוצג תווית אחת מתוך שלוש:
- **✓ תקין · ••••XXXX** (ירוק) — קיים מפתח, `last_error` ריק, ויש `last_validated_at`.
- **⚠ שגיאה · ••••XXXX** (אדום) — קיים מפתח אבל `last_error` לא ריק (לרוב invalid/quota).
- **— ללא מפתח** (אפור) — אין שורה ב-`user_ai_keys`.

ב-tooltip יוצג תאריך האימות האחרון והסיבה לשגיאה אם יש.

## שינויים טכניים

1. **RLS / קריאה**: כרגע `user_ai_keys` חשוף רק לבעלים. נוסיף policy `SELECT` לאדמינים בלבד דרך `has_role(auth.uid(), 'admin')`. לא נחשוף את `encrypted_key` ל-UI — נבחר רק `user_id, key_hint, last_validated_at, last_error, updated_at`.

2. **Hook** (`src/hooks/useUsersManagement.ts`):
   - query חדש `admin-user-ai-keys` שמושך את העמודות לעיל לכל המשתמשים.
   - פונקציה `getByokStatus(userId)` שמחזירה `{ status: 'valid'|'error'|'missing', hint, lastValidatedAt, lastError }`.
   - לייצא ב-return.

3. **UI** (`src/components/admin/UsersTable.tsx`):
   - עמודה חדשה "מפתח AI" / "AI Key" בין "התנסות חינם" ל-"פעולות".
   - Badge עם אייקון (`CheckCircle2` / `AlertTriangle` / `KeyRound`) + ה-hint + tooltip.
   - לא נוסיף עריכה — תצוגה בלבד.

4. **Migration** — policy אחת בלבד:
   ```sql
   CREATE POLICY "Admins can view all AI key metadata"
     ON public.user_ai_keys FOR SELECT TO authenticated
     USING (public.has_role(auth.uid(), 'admin'));
   ```

## מה לא נכלל

- אין שינוי באופן שבו המנטור עצמו משתמש במפתח.
- אין כפתור לאדמין למחוק/להחליף מפתח של משתמש (אפשר להוסיף בהמשך אם תרצה).
- ה-`encrypted_key` נשאר חסום לחלוטין — האדמין רואה רק את ה-4 ספרות האחרונות.
