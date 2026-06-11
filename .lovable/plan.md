
# מסלול משתמש חדש לניסיון החינמי של המנטור

## מה קיים היום
- הרשמה ב-`/auth` יוצרת אוטומטית `profile` עם `plan='free'` ו-`trial_start_date=now()` → 8 ימי ניסיון מתחילים מיד.
- בתקופת הניסיון: `/mentor` ו-`pricing-calculator` נגישים; שאר הבוטים מציגים `UpgradeGate`.
- **חסר:** אין CTA ייעודי "ניסיון חינם" בהירו, אין מסך ברוכים-הבאים שמסביר את ה-8 ימים, ואין באנר שמראה כמה ימים נותרו.

## מה נבנה

### 1. CTA "התחילי 8 ימי ניסיון חינם עם המנטור" בהירו
- ב-`src/components/landing/Hero.tsx`: כפתור ראשי חדש (קורל) שמוביל ל-`/auth?mode=signup&intent=trial`.
- מתחתיו microcopy קטן: "ללא כרטיס אשראי · גישה מלאה למנטור אליענה · 8 ימים".
- כפתור משני שני שמוביל ל-`#how-it-works` (נשמר הזרם הקיים).
- ב-`src/components/landing/Header.tsx`: עדכון הכפתור הקיים בנאב לאותו יעד (`/auth?intent=trial`).

### 2. דף `/auth` — מצב "intent=trial"
- ב-`src/pages/Auth.tsx`: כשהפרמטר `intent=trial` קיים, להציג כותרת אחרת ("התחילי את 8 הימים שלך עם המנטור") + 3 בולטים קצרים (מנטור 24/7, מחשבון תמחור, היסטוריה נשמרת).
- אחרי signup מוצלח: לנווט ל-`/welcome?intent=trial` במקום ליעד הברירת-מחדל.

### 3. מסך Onboarding חדש `/welcome`
- קובץ חדש: `src/pages/Welcome.tsx`, רוט חדש ב-`src/App.tsx`.
- שלוש כרטיסיות קצרות:
  1. "8 ימים מתנה" — הסבר על מה כלול (מנטור + מחשבון תמחור).
  2. "מה נשאר נעול" — תצוגה מקדימה של שאר הבוטים עם אייקון מנעול ושורה אחת על כל אחד.
  3. "החיסכון שלך" — מה קורה אחרי 8 ימים + קישור לתשלום משולם (שימוש חוזר ב-`PAY_URL` מ-`UpgradeGate`).
- CTA ראשי: "התחילי עכשיו עם המנטור" → `/mentor`.
- מציג רק למשתמש מחובר; אם כבר `hasPaidAccess` → ריידיירקט ל-`/mentor`.

### 4. באנר סטטוס ניסיון בפורטל
- קומפוננטה חדשה: `src/components/access/TrialBanner.tsx`.
- שימוש ב-`useUserPlan` הקיים — מוצג רק כש-`trialActive===true && !hasPaidAccess`.
- טקסט: "נשארו לך {N} ימים בניסיון החינמי" + כפתור משני "שדרגי עכשיו" (PAY_URL).
- שילוב ב-`src/pages/Mentor.tsx` ו-`src/pages/AIAssistants.tsx` בראש העמוד.
- מיקרו-וריאנט: ביום האחרון (N≤1) הבאנר עובר לקורל כדי להבליט דחיפות.

## מה לא בתכולה (כי כבר עובד)
- ה-trial מתחיל אוטומטית מ-`handle_new_user` — לא נגעים.
- `UpgradeGate` על בוטים נעולים — נשאר כפי שהוא.
- מייל תזכורת ניסיון דרך Brevo + cron — כבר מוגדרים.

## פרטים טכניים
- אין שינויים ב-DB ואין מיגרציות.
- אין שינויים בלוגיקת ההרשאות — רק UI/ניווט.
- שימוש בטוקנים של עיצוב הקיימים (Purple/Lavender/Coral); RTL דרך `dir="rtl"`, ללא `order` ידני.
- קבצים שייווצרו: `src/pages/Welcome.tsx`, `src/components/access/TrialBanner.tsx`.
- קבצים שייערכו: `src/components/landing/Hero.tsx`, `src/components/landing/Header.tsx`, `src/pages/Auth.tsx`, `src/App.tsx`, `src/pages/Mentor.tsx`, `src/pages/AIAssistants.tsx`.
