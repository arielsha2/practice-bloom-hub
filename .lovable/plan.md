## הבעיה
ב-`src/components/portal/landing/TurningPointVideo.tsx` ה-iframe מצביע על `https://youtu.be/JIF15JF_XbQ` — זה לינק שיתוף ולא URL להטמעה. YouTube חוסם הטמעה של דפי הצפייה הרגילים (`X-Frame-Options: SAMEORIGIN`), ולכן ה-iframe מציג ריבוע אפור ריק עם אייקון קובץ שבור.

## התיקון
שינוי יחיד בקובץ `src/components/portal/landing/TurningPointVideo.tsx`:

החלפת ה-`src` של ה-iframe מ:
```
https://youtu.be/JIF15JF_XbQ
```
ל:
```
https://www.youtube.com/embed/JIF15JF_XbQ
```

זהו פורמט ה-embed הרשמי של YouTube שמותר להטמעה ב-iframes ויציג את הסרטון כראוי.

לא נדרשים שינויים נוספים — שאר ה-attributes (`allow`, `allowFullScreen`, `loading="lazy"`) כבר מוגדרים נכון.
