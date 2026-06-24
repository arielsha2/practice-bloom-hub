
## המטרה
זרימת הרשמה ליניארית של 4 שלבים: מייל → אימות OTP → בחירת סיסמה → BYOK (מותנה). הרשאת תשלום מגיעה משולם (webhook) או מאדמין (ידני, עם audit). חוויית כניסה ברורה גם למשתמשים קיימים.

---

## 1. זרימת הרשמה — 4 שלבים עם stepper

`/auth?mode=signup` עם state-machine פנימי:

```text
[1 מייל] → [2 קוד אימות] → [3 סיסמה] → [4 מפתח Gemini — רק paid]
```

- **שלב 1:** מייל + שם + הסכמת רשימת תפוצה. שולח OTP.
- **שלב 2:** קוד 6 ספרות. `verifyOtp({ type: 'email' })` יוצר session.
  - "שלח שוב" מושבת ל-60 שניות עם countdown. אחרי 3 שליחות: "שלחנו מספר קודים. בדוק/י ספאם או חכה/י כמה דקות."
  - כפתור "מייל שגוי? התחל מחדש".
- **שלב 3:** סיסמה + וידוא + מד חוזק. `updateUser({ password })`. בהצלחה מעדכן `profiles.password_set = true`.
- **שלב 4 (מותנה ב-`profiles.plan`):**
  - `paid` → BYOK inline (חובה לסיום).
  - `free` → דילוג, ניווט ל-`/mentor` עם banner "ממתין לאישור תשלום".

---

## 2. נתיב שני ל-BYOK — משתמש קיים שסומן כ-paid

ב-`Mentor.tsx`: אם `plan = 'paid'`, לא admin, אין שורה ב-`user_ai_keys` עם `key_hint` → פותח `ByokKeyDialog` אוטומטית. אם `free` → מציג את ה-banner.

---

## 3. מסך התחברות — בלי user enumeration

`/auth?mode=login` — מייל + סיסמה + "שכחתי סיסמה". **החלטת אבטחה (מתועדת בקוד):** המערכת ציבורית, אז לא בודקים אם המייל קיים. שגיאת `Invalid credentials` → הודעה אחידה תמיד:
> "פרטים שגויים. אם נרשמת בעבר דרך קישור מייל ללא סיסמה — [אפס/י סיסמה כדי להגדיר אחת לראשונה]."

קישור מעביר ל-`mode=forgot` עם המייל מולא מראש.

---

## 4. איפוס סיסמה
`mode=forgot` נפרד; המייל מפנה ל-`/auth?mode=reset`.

---

## 5. Banner ב-`/mentor` — בזמן אמת

- `plan = 'free'` → banner: "הרשמתך הושלמה. גישתך למנטור תינתן לאחר אישור תשלום."
- **Realtime:** `postgres_changes` על `profiles` עם פילטר `id=eq.<user.id>`. שינוי ל-`paid` → banner נעלם, BYOK נפתח אוטומטית.
- Fallback: re-fetch של `profiles.plan` ב-`visibilitychange`.
- מיגרציה: `ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;` + `REPLICA IDENTITY FULL`.
- invalidate של `queryKey: ['user-plan', userId]` כשמקבלים שינוי.

---

## 6. הרשאת paid — אוטומטית או ידנית, עם audit

- **אוטומטי:** webhook משולם + טריגרים קיימים — ללא שינוי.
- **ידני (אדמין):** ב-`UsersTable` פעולת "סמן כמשלם / בטל" → `admin-set-user-plan` edge function:
  1. אימות admin (`has_role`).
  2. קריאת `old_plan`.
  3. כתיבה ל-`plan_changes` (`user_id, changed_by, old_plan, new_plan, source='admin', changed_at`).
  4. עדכון `profiles.plan` + `plan_updated_at`.
- טבלת `plan_changes` עם RLS: קריאה רק ל-admin, כתיבה רק דרך service_role.

---

## 7. עמידות בכשל שלב 3

- עמודה חדשה `profiles.password_set boolean not null default false`.
- **מיגרציה זהירה — לא ברירת מחדל גלובלית בשתי פעולות נפרדות:**
  ```sql
  ALTER TABLE profiles ADD COLUMN password_set boolean NOT NULL DEFAULT false;
  UPDATE profiles SET password_set = true;  -- כל הקיימים: true
  -- חדשים: handle_new_user יכניס false במפורש
  ```
  עדכון `handle_new_user` להוסיף `password_set = false` ב-INSERT — מונע race condition שבו משתמש חדש יקבל את הברירת המחדל הישנה (true) לרגע.
- בטעינת `Auth.tsx`: session פעיל + `password_set = false` → הצגת שלב 3 ישירות.
- בלוגין מוצלח: בדיקת `password_set`; אם false, ניווט לשלב 3.

---

## 8. אנליטיקס מלא לזיהוי צוואר בקבוק

- `trackEvent('signup_step_complete', { step: 1|2|3 })` — לכל שלב חובה.
- `trackEvent('signup_step_4_shown', { plan: 'paid' })` — כמה הגיעו ל-BYOK.
- `trackEvent('signup_step_4_skipped', { plan: 'free' })` — כמה דילגו כי לא משלמים.
- `trackEvent('signup_step_4_complete')` — שמירת מפתח Gemini הצליחה.
- `trackEvent('signup_complete', { had_byok: boolean })` — סיום כל הזרימה.
- `trackEvent('signup_otp_resent', { attempt: n })`, `trackEvent('signup_otp_failed')`.

ההפרדה בין `shown` ל-`skipped` ל-`complete` נחוצה כי בלעדיה דילוג לגיטימי (free) נראה זהה לנשירה (paid שלא סיים BYOK).

---

## 9. שיפורים נוספים

- **נירמול מייל:** `email.trim().toLowerCase()` בכל הקלטים.
- **Autofocus + מקלדת:** focus אוטומטי בכל שלב; ב-OTP `inputMode="numeric"` + `autoComplete="one-time-code"`.
- **Race webhook באמצע signup:** הלוגיקה כבר מטפלת — קריאה טרייה ל-`plan` לפני שלב 4.
- **שגיאות רשת:** wrapper אחיד עם toast עברי.
- **RTL & a11y:** stepper, OTP, הודעות — aria-current, aria-live, בדיקת RTL.

---

## פרטים טכניים

**קבצים חדשים:**
- `src/pages/Signup.tsx` או `<SignupFlow />`
- `src/components/auth/SignupStepper.tsx`
- `src/components/auth/OtpResendButton.tsx`
- `src/components/mentor/PaymentPendingBanner.tsx`
- `supabase/functions/admin-set-user-plan/index.ts`

**קבצים שיתעדכנו:**
- `src/pages/Auth.tsx` — login/forgot/reset + טיפול ב-`password_set=false`
- `src/pages/Mentor.tsx` — banner + Realtime + BYOK אוטומטי
- `src/components/admin/UsersTable.tsx` — "סמן כמשלם"
- `src/components/mentor/ByokKeyDialog.tsx` — מצב inline

**מיגרציות:**
1. `profiles.password_set` (ADD COLUMN default false → UPDATE קיימים ל-true → עדכון `handle_new_user`).
2. טבלת `plan_changes` עם RLS וגרנטים.
3. הוספת `profiles` ל-`supabase_realtime` + `REPLICA IDENTITY FULL`.

---

## בדיקות
1. הרשמת free → 3 שלבים → `/mentor` עם banner. אין BYOK.
2. אדמין מסמן כ-paid תוך כדי שהמשתמש ב-`/mentor` → banner נעלם, BYOK נפתח, ללא refresh.
3. הרשמה עם webhook מקדים → שלב 4 BYOK נדרש.
4. OTP — 60s lock, 3 ניסיונות → הודעת המתנה.
5. כשל רשת בשלב 3 → חזרה ל-`/auth` ממשיכה בשלב 3.
6. לוגין למשתמש בלי סיסמה → הודעה אחידה + קישור איפוס.
7. אדמין משנה plan → שורה ב-`plan_changes`. משתמש רגיל לא יכול לקרוא.
8. נירמול מייל: `User@X.com` ו-`user@x.com` → אותה רשומה.
9. אנליטיקס: כל 5 האירועים של signup נורים נכון בכל תרחיש (free / paid / paid-מקדים).
