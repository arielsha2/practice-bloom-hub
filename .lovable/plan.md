## החלפת Measurement ID ב-index.html

החלפה של 2 מופעי `GA_MEASUREMENT_ID` ב-`index.html` ל-`G-0S69C9BTJD`:

1. בשורת ה-script של gtag.js:
   `https://www.googletagmanager.com/gtag/js?id=G-0S69C9BTJD`

2. בקריאת `gtag('config', ...)`:
   `gtag('config', 'G-0S69C9BTJD', { send_page_view: true });`

הסרת הערת ה-TODO שמעל הבלוק.

### אימות
- בדיקה בדפדפן ש-`gtag/js?id=G-0S69C9BTJD` נטען בלשונית Network.
- ב-GA4 → Realtime יופיע ביקור בתוך דקה.

### לא נגעים
- סקריפט Clarity, ה-auto-tracker, ושאר תגי ה-meta/JSON-LD נשארים כמו שהם.