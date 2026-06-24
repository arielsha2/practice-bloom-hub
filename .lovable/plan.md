## הבעיה

ב-Supabase Auth מוגדר Custom SMTP דרך Brevo, אבל המיילים לא מגיעים (כל הקריאות ל-`/otp` חוזרות 200 — Supabase שלח, אבל המייל נופל בדרך — כנראה sender לא מאומת ב-Brevo, או הטמפלייט של ה-Magic Link לא כולל את הקוד). זו תלות חיצונית שלא נוכל לדבג בקלות מתוך הקוד.

## הפתרון

נשתלט על שליחת ה-OTP בעצמנו ונחתוך לחלוטין את הזרימה של Supabase Auth Email. נייצר קוד 6-ספרות, נשמור hash בטבלה, ונשלח את המייל דרך **Brevo connector** (כבר מחובר ב-secrets — `BREVO_API_KEY`) — כך שאם המייל לא מגיע, יש לנו לוג מלא של מה Brevo החזיר.

## ארכיטקטורה

```text
[Step 1: Email/Name]
   ↓ POST /functions/v1/signup-send-otp { email, name, consent }
   ↓   - rate-limit (60s lock per email; 3 attempts / 10 min)
   ↓   - generate 6-digit code
   ↓   - INSERT signup_otp_codes (email, code_hash, expires_at = now()+10m)
   ↓   - send via Brevo connector gateway
[Step 2: OTP entry]
   ↓ POST /functions/v1/signup-verify-otp { email, code }
   ↓   - compare hash, mark consumed
   ↓   - admin.createUser OR admin.generateLink (magiclink) → returns session
   ↓   - return { access_token, refresh_token }
   ↓ client: supabase.auth.setSession(...)
[Step 3: Set password]  (existing flow continues)
[Step 4: BYOK or pending banner]  (existing flow continues)
```

## שינויים

### חדש: טבלה `signup_otp_codes`
- עמודות: `email`, `code_hash`, `expires_at`, `consumed_at`, `attempts`, `last_sent_at`
- אינדקס על `email`; cleanup של רשומות ישנות
- RLS: service_role בלבד (אף client לא נוגע)

### חדש: Edge Function `signup-send-otp` (verify_jwt = false)
- input: `{ email, name?, mailing_list_consent? }`
- בודק rate limit מול `last_sent_at`
- מייצר קוד אקראי 6 ספרות, שומר hash (SHA-256 + salt)
- שולח HTML email דרך Brevo:
  ```
  POST https://connector-gateway.lovable.dev/brevo/smtp/email
  Authorization: Bearer $LOVABLE_API_KEY
  X-Connection-Api-Key: $BREVO_API_KEY
  ```
- sender: `noreply@therapykeys.co.il` (יתאם לשולח המאומת ב-Brevo — נחזיר שגיאה ברורה אם לא מאומת)
- HTML בעברית, RTL, brand colors, קוד 6-ספרות גדול וברור
- מחזיר `{ ok: true }`

### חדש: Edge Function `signup-verify-otp` (verify_jwt = false)
- input: `{ email, code }`
- מאמת hash + לא פג + לא נוצל; מסמן `consumed_at`
- אם המשתמש לא קיים ב-auth: `supabase.auth.admin.createUser({ email, email_confirm: true, user_metadata: { display_name, mailing_list_consent } })`
- מייצר session: `supabase.auth.admin.generateLink({ type: 'magiclink', email })` → ממיר ל-`access_token` + `refresh_token` (או דרך `signInWithOtp` עם custom flow). פתרון פשוט יותר: מחזירים `email + one-time login token` ע"י `generateLink` ומפעילים `verifyOtp` בצד client עם ה-token שהתקבל.
- מחזיר `{ access_token, refresh_token, is_new_user }`

### עדכון: `SignupFlow.tsx`
- `handleSendOtp`: במקום `supabase.auth.signInWithOtp` → קריאה ל-`signup-send-otp`
- `handleVerifyOtp`: במקום `supabase.auth.verifyOtp` → קריאה ל-`signup-verify-otp` + `supabase.auth.setSession(...)`
- `resendOtp`: קריאה חוזרת ל-`signup-send-otp`
- הודעות שגיאה מאוחדות (להמשיך עם הנוסחים הקיימים)

### לא נוגעים
- `Auth.tsx` (login רגיל עם סיסמה)
- `Mentor.tsx` (Realtime banner + BYOK)
- `admin-set-user-plan` ו-`plan_changes`
- Supabase Auth SMTP — נשאיר כמו שזה לטובת password reset (שזה מסלול נפרד שעובד טוב יותר, ויש כבר custom SMTP מוגדר)

## דברים שצריך לוודא לפני שמתחילים

**מקור האימייל (sender) חייב להיות מאומת ב-Brevo.** אם הדומיין `therapykeys.co.il` או כתובת `noreply@therapykeys.co.il` לא מאומתים בפאנל של Brevo — המייל ייכשל גם דרך הזרימה החדשה. ה-edge function תחזיר שגיאת Brevo מפורשת ונדע מיד.

אם תרצה, אחרי הביצוע אבדוק את ה-status מול Brevo עם קריאת test, ואם יש בעיית sender — אכוון אותך לתקן.

## קבצים

**חדשים:**
- `supabase/migrations/...` — טבלת `signup_otp_codes` + RLS
- `supabase/functions/signup-send-otp/index.ts`
- `supabase/functions/signup-verify-otp/index.ts`

**מעודכנים:**
- `src/components/auth/SignupFlow.tsx` — החלפת 2 הקריאות ל-Supabase auth ב-edge functions
- `supabase/config.toml` — שתי פונקציות עם `verify_jwt = false`
