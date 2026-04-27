## Problem

הקישור לקבוצת הוואטסאפ עובד כשפותחים אותו ידנית בכרטיסייה חדשה, אבל לא נפתח כשלוחצים על הכפתור בתצוגה המקדימה של Lovable. הסיבה: התצוגה המקדימה רצה בתוך `iframe`, וקריאת `window.open(...)` עלולה להיחסם או להיכשל בשקט בתוך iframes (במיוחד עם דומיינים כמו `chat.whatsapp.com`).

## Fix

ב-`src/components/landing/Hero.tsx`, בתוך ה-`Dialog` של "הצטרפות לקהילה":

החלפת שני כפתורי ה-`window.open` בכפתורי `<Button asChild>` שעוטפים תגית `<a target="_blank" rel="noopener noreferrer">`. ניווט עם תגית `<a>` אמיתית הוא הדרך האמינה ביותר לפתוח קישור חיצוני מתוך iframe — הדפדפן מתייחס אליה כפעולת משתמש ישירה ולא חוסם אותה.

- כפתור הניוזלטר: `<a href="https://sfat.myflodesk.com/c6d2334e-ea5d-4f2a-bc16-0fb3fc548d93" target="_blank" rel="noopener noreferrer">`
- כפתור הוואטסאפ: `<a href="https://chat.whatsapp.com/LIFDBs6thhtH3L7LqMTfdv" target="_blank" rel="noopener noreferrer">`

נוסיף `onClick={() => setOpen(false)}` על כל קישור כדי שה-Dialog ייסגר אחרי הלחיצה.

## Files

- `src/components/landing/Hero.tsx` — שינוי שני הכפתורים בלבד; שאר הקובץ ללא שינוי.
