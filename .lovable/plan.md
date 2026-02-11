
# תיקון תצוגת מצגת - "הדף הזה נחסם על ידי Chrome"

## הבעיה

Chrome חוסם טעינת PDF ב-iframe כשה-URL מגיע מדומיין אחר (Supabase Storage signed URL). זו הגבלת אבטחה של הדפדפן.

## הפתרון

שימוש ב-Google Docs Viewer כעטיפה להצגת ה-PDF. Google Docs Viewer יודע לטעון PDFs מכל URL ולהציג אותם בתוך iframe.

## שינויים בקובץ: `src/components/portal/PresentationViewer.tsx`

**1. שינוי ה-iframe src:**

במקום לטעון את ה-PDF ישירות:
```
src={pdfUrl}
```

נעטוף אותו ב-Google Docs Viewer:
```
src={`https://docs.google.com/gview?url=${encodeURIComponent(pdfUrl)}&embedded=true`}
```

**2. הוספת כפתור "פתח בחלון חדש":**

כפתור קטן מעל ה-iframe שמאפשר לפתוח את ה-PDF בטאב חדש, למקרה שגם Google Docs Viewer לא עובד.

**3. הוספת fallback:**

אם ה-iframe לא נטען, תוצג אפשרות להוריד את הקובץ ישירות.

## קובץ אחד לעדכון

| קובץ | שינוי |
|------|-------|
| `src/components/portal/PresentationViewer.tsx` | Google Docs Viewer wrapper + כפתור פתיחה בחלון חדש |
