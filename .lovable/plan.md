## שלוש משימות

### 1. הסרת ההירו הישן + הוספת קישור התחברות
- מסירים את ה־legacy hero בעברית מ-`src/pages/Mentor.tsx` (השורות שמרנדרות את הבלוק "המנטור לקליניקה / ליווי AI אישי / לרכישת המנטור"). הדף יתחיל ישירות ב-`MentorSalesPage`.
- ב-`MentorSalesPage.tsx`, הוספת הקישור **"כבר רשומה? להתחברות"** (HE) / **"Already signed up? Log in"** (EN) **מתחת לכפתור ה־CTA** של ההירו (כמו בתמונה 3). כרגע הקישור באנגלית מופיע בפינה הימנית־עליונה — נעביר אותו למקום הזה גם באנגלית.

### 2. קרוסלת עדויות + עורך עדויות באדמין
**טבלת DB חדשה: `mentor_testimonials`**
```
id uuid pk
language text ('he' | 'en')
quote text
author_name text nullable
author_details text nullable
image_url text nullable     -- אופציונלי, מ-Supabase Storage
display_order int default 0
is_published boolean default true
created_at, updated_at timestamps
```
- RLS: קריאה לכולם (SELECT public), כתיבה רק לאדמינים (`has_role(auth.uid(),'admin')`).
- GRANTs: `SELECT` ל-anon+authenticated; `ALL` ל-service_role+authenticated (RLS חוסם לא-אדמינים).
- שימוש ב-bucket קיים `media` להעלאת תמונות.

**Seed**: זריעת העדויות הקיימות מ-`MentorSalesPage` (גם HE: שני הציטוטים שב-`COPY.he.proof.quotes`, וגם EN: 7 הציטוטים שב-`COPY.en.proof.cards`).

**רכיב קרוסלה חדש**: `src/components/mentor/MentorTestimonialsCarousel.tsx`
- שולף לפי שפה נוכחית, ממוין לפי `display_order`.
- שימוש ב-`embla-carousel` הקיים בפרויקט (shadcn `carousel.tsx`).
- מציג ציטוט גדול + שם/פרטים + תמונה עגולה אם קיימת. חיצי ניווט ונקודות.
- מחליף את הסקשן הקיים "מהשטח / What therapists say" ב-`MentorSalesPage.tsx` (גם HE וגם EN).

**עמוד אדמין חדש**: `src/pages/MentorTestimonialsAdmin.tsx` בנתיב `/admin/testimonials`
- כותרת **"עורך עדויות"**.
- טאבים HE / EN.
- טבלה עם: ציטוט, שם, סדר, פורסם, תמונה. כפתורי הוספה/עריכה/מחיקה/החלפת סדר.
- דיאלוג עריכה: textarea לציטוט, inputים לשם ופרטים, העלאת תמונה ל-Storage, switch לפרסום, מספר סדר.
- מקושר מ-`UsersAdmin` או מ-side-nav של האדמין שכבר קיים (אוסיף קישור איפה שהקישורים האחרים יושבים).

### 3. עדכוני אנגלית
- אותם שינויים בדיוק לחלק האנגלי: קישור login יעבור מהפינה אל מתחת ל-CTA, הקרוסלה תשמש גם באנגלית עם הציטוטים הקיימים (אפשר להוסיף תמונות מאוחר יותר דרך האדמין).

### Technical notes
- Carousel UI: shadcn `Carousel` (embla).
- Image uploads: Supabase Storage bucket `media` (קיים).
- בקרוסלה אם אין שורות ב-DB → fallback לציטוטים שב-COPY כדי לא להציג ריק.
- לא נוגעים בלוגיקת ה-mentor-chat / paywall / trial.

מאשר ואני יוצא לדרך?