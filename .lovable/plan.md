# תיקון: עדכון הרשאת מנטור לא משתקף ב-UI

## הבעיה האמיתית

ב-`public.user_roles` יש כיום רק policy SELECT אחת:
```
Users can view own roles  →  USING (auth.uid() = user_id)
```

המשמעות: גם אדמין מחובר מקבל מ-`select * from user_roles` רק את השורות **שלו עצמו**. לכן:
- `hasMentorAccess(otherUserId)` תמיד מחזיר `false` עבור משתמשים אחרים.
- `getUserRole(otherUserId)` תמיד מחזיר `"none"` עבור משתמשים אחרים.
- ה-Switch בדיאלוג "שינוי תפקיד" לא זז גם אחרי שה-INSERT/DELETE הצליח (ולכן ה-toast "הרשאת המנטור עודכנה" מופיע אבל ה-UI לא מתעדכן).
- כנראה גם עמודת התפקיד בטבלת המשתמשים מציגה ערכים שגויים לכולם.

המוטציה עצמה ב-`toggleMentorAccess` תקינה — היא מצליחה כי policy ה-INSERT/DELETE כבר משתמשת ב-`has_role(auth.uid(), 'admin')`. רק ה-SELECT חסר.

## הפתרון

מיגרציה אחת שמוסיפה policy SELECT נוספת על `public.user_roles` שמאפשרת לאדמינים לראות את כל השורות:

```sql
CREATE POLICY "Admins can view all user roles"
  ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
```

ה-policy הקיימת "Users can view own roles" נשארת — משתמש רגיל ממשיך לראות רק את עצמו, אדמין רואה הכל (PostgreSQL מאחד policies של SELECT עם OR).

לא נדרשים שינויי קוד נוספים — ברגע שהשאילתה תחזיר את כל השורות, `useUsersManagement` כבר מתבסס עליהן נכון וה-Switch יתעדכן אוטומטית.

## למה זה בטוח

- `has_role` היא `SECURITY DEFINER` קיימת — אין רקורסיה.
- אנשי מנטור/סטודנט רגילים ממשיכים לראות רק את עצמם.
- אין שינוי ב-INSERT/UPDATE/DELETE.
