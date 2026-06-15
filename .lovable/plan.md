## ממצאים

בדקתי את הקוד:

1. **`src/integrations/supabase/client.ts`** — קיים `persistSession: true`, `storage: localStorage`, `autoRefreshToken: true`, אבל **חסר `detectSessionInUrl: true`**. בלעדיו, קישורי magic-link/password-recovery לא תמיד מולידים סשן בעלייה הראשונה — מה שיכול להתבטא כ"נדרש להתחבר מחדש".
2. **`signOut`** — נקרא רק בלחיצה מפורשת של המשתמש על "התנתקות" ב-`Header.tsx:15` וב-`Mentor.tsx:56`. אין קריאה אוטומטית בטעות.
3. **`localStorage`** — אין שום מקום שמנקה את כל ה-storage. ההסרות היחידות הן ממוקדות למפתחות `mentor-chat:he/en` בלבד (איפוס מסע המנטור), ולא נוגעות במפתחות של Supabase Auth.
4. **Refresh token** — `autoRefreshToken: true` כבר פעיל; ה-SDK מטפל בחידוש אוטומטי.

## מה אשנה

**קובץ יחיד — `src/integrations/supabase/client.ts`:** הוספת `detectSessionInUrl: true` לאובייקט ה-`auth`.

```ts
auth: {
  storage: localStorage,
  persistSession: true,
  autoRefreshToken: true,
  detectSessionInUrl: true,
}
```

## מה לא אשנה

- `AuthContext` — תקין.
- שום `signOut` קיים — כולם פעולות משתמש מכוונות.
- `useResetMentorJourney` ו-`Mentor.tsx` — מוחקים רק מפתחות של המנטור, לא נוגעים ב-Auth.
- שום קובץ אחר.

## בדיקה

לאחר השינוי: רענון דף או חזרה לאתר אחרי סגירת טאב — הסשן נשמר ב-`localStorage` (`sb-umtqmhzzxbfvokbiwsmr-auth-token`) ומשוחזר אוטומטית; אין צורך בהתחברות מחדש.
