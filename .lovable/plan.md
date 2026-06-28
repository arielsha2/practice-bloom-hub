## מטרה

החזרת אפשרות התנסות חינם במנטור — הפעם **יום אחד בלבד** וממוקדת אך ורק בנושא **תמחור**. כניסה עצמית לכל מי שנרשם, ואפשרות לאדמין להוסיף ידנית מתוך ניהול המשתמשים.

---

## מה כבר קיים (לא נוגעים)

- המנטור יודע לזהות משתמש בניסיון ולהגביל אותו לכלי `pricing-calculator` בלבד (system prompt חזק, גם בעברית וגם באנגלית).
- `useUserPlan` + `useBotAccess` כבר מבחינים בין `paid`, `trialActive`, ו-`mentor-only`.
- בטבלת `profiles` יש כבר `trial_start_date` ו-`trial_reminder_sent_at`.
- בדשבורד אדמין יש כפתור "הענק התנסות" (`grantFreeTrial`) ב-UsersTable.
- פונקציית edge `send-trial-reminders` קיימת.

---

## השינויים

### 1. משך ההתנסות: 8 ימים → 24 שעות

**קובץ:** מיגרציית SQL.
- עדכון פונקציה `public.get_user_access` — להחליף `interval '8 days'` ב-`interval '1 day'` (גם בחישוב `trial_active` וגם ב-`trial_ends_at`).

**קובץ:** `src/hooks/useUsersManagement.ts` (תצוגת סטטוס לאדמין)
- בפונקציה `getTrialStatus` להחליף `8 * 24 * 60 * 60 * 1000` ל-`24 * 60 * 60 * 1000`.

**קבצים:** `src/pages/Mentor.tsx`, `supabase/functions/mentor-chat/index.ts`
- בהודעת ה"מה אני יכולה לעזור" וב-system prompt: לעדכן את המילים "8 ימים" / "8-day trial" ל"יום אחד" / "24-hour trial".

### 2. הפעלת ההתנסות אוטומטית בהרשמה

**קובץ:** מיגרציה — עדכון הטריגר `handle_new_user`.
- כיום הוא קובע `trial_start_date = NULL` (מאז שכיבית את ההתנסות).
- נחזיר: `trial_start_date = now()` למשתמש חדש, רק אם אין לו כבר רשומת `student_enrollments` בתשלום.
- כך כל הרשמה עצמית מקבלת אוטומטית 24 שעות גישה.

### 3. כפתור CTA לעצמאיים על עמוד המכירה

**קובץ:** `src/components/mentor/MentorSalesPage.tsx`
- מתחת לכפתורי "רכישת המנטור" (HE + EN) להוסיף שורת קישור משנית: **"רוצה להתנסות 24 שעות חינם בנושא תמחור? התחבר/י כאן"** → `/auth?mode=signup` (או הלינק הקיים להרשמה).
- בעברית: "התנסות חינם — 24 שעות, מיקוד בתמחור".
- באנגלית: "Try free for 24 hours — pricing focus".
- אסתטיקה צנועה (link/secondary button), לא מתחרה בכפתור התשלום.

### 4. כפתור אדמין "הענק התנסות" — נשאר כפי שהוא

הכפתור קיים ועובד דרך `grantFreeTrial` — מגדיר `trial_start_date = now()`. אחרי שינוי משך ההתנסות בנקודה 1, אותו כפתור אוטומטית מעניק 24 שעות.

טקסט הכפתור / טולטיפ יתעדכן: "הענק התנסות 24 שעות (תמחור)" / "Grant 24h trial (pricing)".

### 5. ניקוי קופי "8 ימים" בכל מקום

חיפוש גלובלי על "8 ימים", "8 days", "8-day" — עדכון לכל אזכור (Mentor.tsx, mentor-chat system prompt, אימייל תזכורת ב-`send-trial-reminders` אם רלוונטי).

### 6. תזכורת תפוגה (אופציונלי, לאישור)

`send-trial-reminders` כיום בנוי ל-8 ימים. אפשרויות:
- **א.** להשבית את התזכורת לגמרי — 24 שעות זה קצר מדי, אין טעם.
- **ב.** לשלוח תזכורת אחת ~3 שעות לפני תפוגה.
- **ג.** להשאיר כמו שהוא ולא להפעיל cron.

הצעתי: **א** — לא מפעילים cron, ההתנסות קצרה ולא דורשת תזכורת.

---

## מה משתמש יחווה

**משתמש חדש שנרשם דרך כפתור "התנסות חינם":**
1. הרשמה רגילה (OTP) →
2. נכנס ל-`/mentor` →
3. המנטור פוגש בברכה קצרה, שואל 2-3 שאלות היכרות, ומכוון מהר אל מחשבון התמחור →
4. כל ניסיון לגעת בנושא שאינו תמחור — המנטור מאשר את הצורך, מציין שזה זמין בגרסה המלאה, ומחזיר לתמחור →
5. אחרי 24 שעות — ההתנסות פגה, ה-CTA מציע רכישה.

**אדמין שמוסיף משתמש ידנית:**
- בטבלת המשתמשים → כפתור "הענק התנסות 24 שעות" שכבר קיים.

---

## פרטים טכניים (לעיון)

**שינוי במיגרציה (טיוטה):**
```sql
CREATE OR REPLACE FUNCTION public.get_user_access(_user_id uuid)
RETURNS TABLE(plan text, trial_active boolean, has_paid boolean, trial_ends_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT
    p.plan,
    (p.plan = 'free' AND p.trial_start_date IS NOT NULL
       AND now() < p.trial_start_date + interval '1 day') AS trial_active,
    (p.plan = 'paid' OR public.has_role(_user_id, 'admin')) AS has_paid,
    CASE WHEN p.trial_start_date IS NOT NULL
         THEN p.trial_start_date + interval '1 day'
         ELSE NULL END AS trial_ends_at
  FROM public.profiles p WHERE p.id = _user_id
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user() ... -- מחזיר trial_start_date = now()
```

**קבצים שיתעדכנו:**
- `src/components/mentor/MentorSalesPage.tsx` — CTA חדש להתנסות
- `src/pages/Mentor.tsx` — קופי "8 ימים" → "24 שעות"
- `src/hooks/useUsersManagement.ts` — חישוב סטטוס trial
- `src/components/admin/UsersTable.tsx` — טקסט הכפתור והבאדג'
- `supabase/functions/mentor-chat/index.ts` — system prompt: "8 ימים" → "24 שעות"
- מיגרציה אחת: `get_user_access` + `handle_new_user`

---

## שאלה לפני הביצוע

האם להשבית את ה-cron של תזכורות תפוגה (`send-trial-reminders`)? בהתנסות של 24 שעות אין הרבה זמן לתזכורת — הצעתי להשבית.
