

# כתובות URL ישירות לטאבים ועמודים פנימיים

## מצב נוכחי
- **נקודת המפנה** (`/portal`): טאבים של "שיעורים" ו"שאלות ותשובות" מנוהלים ב-state מקומי — אין URL ייחודי לכל טאב
- **עוזרי AI** (`/ai-assistants`): לכל בוט כבר יש URL ייחודי (`/ai-assistants/:botKey`) ✓
- **תכנים** (`/contents`): סינון לפי קטגוריה מנוהל ב-state — אין URL ייחודי לקטגוריה

## שינויים מתוכננים

### 1. פורטל — טאבים עם URL
שינוי `StudentPortal.tsx` לסנכרון הטאב עם URL:
- `/portal` או `/portal/lessons` → טאב שיעורים
- `/portal/qa` → טאב שאלות ותשובות

שימוש ב-`useParams` או `useSearchParams` לקריאת הטאב מה-URL. הוספת routes חדשים ב-`App.tsx`:
```
/portal/:tab?  (optional param: lessons | qa)
```

### 2. תכנים — קטגוריה ב-URL
שינוי `Contents.tsx` לסנכרון הקטגוריה עם query params:
- `/contents` → כל התכנים
- `/contents?category=slug` → תכנים מסוננים לפי קטגוריה

שימוש ב-`useSearchParams` לקריאה וכתיבה של הקטגוריה הנבחרת.

### 3. עוזרי AI — כבר עובד ✓
כל בוט כבר נגיש דרך `/ai-assistants/:botKey`. אין צורך בשינוי.

## קבצים שישתנו
- `src/App.tsx` — הוספת route עם param אופציונלי לפורטל
- `src/pages/StudentPortal.tsx` — סנכרון טאב עם URL param
- `src/pages/Contents.tsx` — סנכרון קטגוריה עם search params

