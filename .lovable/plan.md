
שכתוב מלא של `src/pages/Mentor.tsx` לפי המפרט שלך. הצ'אט הופך ללב העמוד — תמיד פתוח, ממורכז, עם אווטר אליענה, וכל היתר תומך סביבו.

## שינויים

**`src/pages/Mentor.tsx`** — שכתוב מלא:
- הסרה מוחלטת של `Dialog` ו-state `chatOpen`. הצ'אט inline, תמיד גלוי.
- רקע: `bg-gradient-to-b from-mentor-bg to-[hsl(var(--mentor-bg)/0.7)]`.
- שורת פתיח רכה ממורכזת: "אליענה כאן. אשמח לשמוע מה על הלב — ונתחיל בדיוק משם." / EN מקביל.
- Grid דסקטופ: סיידבר `lg:w-56` משמאל/ימין (לפי `dir`) + פאנל צ'אט `flex-1`. מובייל: סטאק אנכי, צ'אט קודם.
- **JourneyRail** — רכיב מקומי חדש בתוך הקובץ, קומפקטי אנכי, 5 שלבים (`niche/pricing/self-presentation/network/conversion`) עם אייקונים (Compass/Tag/User/Users/Sparkles), וי על הושלמו, נקודה פועמת על הפעיל, opacity-50 על עתידיים. לחיצה על הושלם/פעיל → `setActiveBotKey(botKey)`. שורת Trophy בתחתית. `ResetMentorButton` בראש הכרטיס.
- **כרטיס צ'אט** — `rounded-3xl`, `shadow-xl`, גובה `clamp(520px,72vh,720px)`, כותרת עם אווטר אליענה (`/images/eliana-avatar.png` + `onError`), שם "אליענה" + "מקשיבה ✦", כפתור "מפה מלאה" שגולל ל-`#full-journey-map`.
- **הודעת פתיחה מגדרית-נייטרלית**: "בוקר טוב ✨ איזה יופי שהגעת. אשמח לשמוע קצת עליך — מה התחום שלך, ואיפה הקליניקה שלך נמצאת עכשיו?" עם אווטר לידה.
- **STARTERS_HE** נשאר (כבר נייטרלי יחסית), פרט לעדכון אם נדרש.
- **בועות**: assistant עם אווטר w-7 ו-`rounded-ss-none`; user עם `rounded-ee-none` ב-`bg-mentor-accent`.
- **Typing indicator** — שלוש נקודות bounce ליד אווטר אליענה, מוצג בזמן `isLoading`.
- **כפתור "חדש"** בשורת הקלט כשיש הודעות → מנקה `messages` ו-`input`.
- **Pending return card** מעל הצ'אט עם הניסוח החדש ("סיימת לעבוד עם...", "ממשיכים", "המשך את השיחה עם אליענה").
- **אקורדיונים** "מה תקבל מהמסע" / "לאן המסע מוביל" — בתוך הסיידבר בדסקטופ, ומתחת לצ'אט במובייל (`lg:hidden`). הסרת ה-section הנפרד של Benefits/Outcomes.
- **Full JourneyMap** מתחת לפולד ב-`id="full-journey-map"` (משתמש ברכיב הקיים).
- `WebsiteBuilderCTA`, Paywall, `MentorTopBar`, `Footer`, לוגיקת `send()`/`mentor-analyze`/localStorage/RTL — ללא שינוי.

**`public/images/eliana-avatar.png`** — נכין placeholder עם `onError` שמסתיר אם חסר. אם יש לך קובץ אמיתי להעלות, אעדכן ברגע שתשלח/י (או אשתמש בדמות placeholder יצירתית עד אז).

## ניסוח עברי

כל הטקסטים בעברית נכתבים בלי ציווי ובלי לשון רבים: שאלות והצהרות עם "שלך/אליך/לך" שזהים לשני המגדרים. כותרות אקורדיון: "מה תקבל מהמסע" / "לאן המסע מוביל". (אם תעדיף ניסוח אחר לחלוטין נייטרלי — אפשר להחליף ל"מה המסע נותן" / "לאן המסע מוביל".)

## פירוט טכני

- אין שינוי ב-DB, RLS, edge functions, hooks.
- `dir={isRTL ? "rtl" : "ltr"}` בלבד לכיוון; ללא `order` ידני (לפי זיכרון הפרויקט).
- שימוש בטוקנים סמנטיים בלבד: `mentor-accent`, `mentor-surface`, `mentor-border`, `mentor-bg`.
- אייקונים מ-`lucide-react` (Compass, Tag, User, Users, Sparkles, Trophy, MessageCircle, Map, CheckCircle2, Send).
- אווטר: `<img>` רגיל עם `onError` להסתרה — לא נופל אם הקובץ חסר.

## שאלה אחת לפני שמיישמים

יש לך כבר קובץ אווטר של אליענה להעלות? אם כן — צרף/י, ואשתמש בו. אחרת אפעיל את ה-`onError` fallback כך שהממשק עובד גם בלי תמונה, ותוכל/י להעלות אחר כך.
