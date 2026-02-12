

# הוספת העלאת קבצים (PDF / DOC) לטופס יצירת מאמר

## סקירה
הוספת אזור גרירה/העלאת קובץ בתוך טופס יצירת המאמר (ContentForm) שמאפשר לייבא תוכן מקובצי PDF או DOCX ישירות לעורך הטקסט העשיר, במקום להעתיק טקסט ידנית.

## איך זה יעבוד
1. מתחת לשדה התוכן (או מעליו) יופיע אזור גרירה קטן עם הכיתוב "גרור קובץ PDF או DOC לכאן, או לחץ לבחירה"
2. לאחר בחירת/גרירת קובץ, המערכת תפרסר את התוכן ותמלא אוטומטית את עורך הטקסט
3. אם שדה הכותרת ריק, גם הוא יתמלא אוטומטית מהקובץ
4. קבצי DOCX ישתמשו בספריית mammoth (כבר מותקנת) - כולל חילוץ תמונות לסטורג'
5. קבצי PDF ישתמשו ב-pdf.js לחילוץ טקסט מהקובץ

## שינויים נדרשים

### 1. התקנת תלות חדשה
- `pdfjs-dist` - לפרסור קבצי PDF וחילוץ טקסט

### 2. `src/components/contents/FileContentImport.tsx` (חדש)
קומפוננטה חדשה עם:
- אזור drag-and-drop (בסגנון דומה ל-BulkImportDialog)
- קבלת קבצי .pdf ו-.docx
- פרסור הקובץ (שימוש חוזר בלוגיקת mammoth מ-BulkImportDialog עבור DOCX, ו-pdfjs עבור PDF)
- החזרת title + content דרך callback `onContentImported`
- הצגת מצב טעינה בזמן הפרסור
- הודעת שגיאה אם הפרסור נכשל

### 3. `src/components/contents/ContentForm.tsx`
- ייבוא הקומפוננטה החדשה FileContentImport
- הוספתה מעל עורך הטקסט העשיר
- כש-callback `onContentImported` נקרא: מילוי title (אם ריק) ו-contentText

## פרטים טכניים

### פרסור PDF
שימוש ב-pdfjs-dist לחילוץ טקסט מכל הדפים, עם שמירה על פסקאות ומבנה בסיסי. הטקסט יומר ל-HTML פשוט (פסקאות).

### פרסור DOCX
שימוש חוזר באותה לוגיקת mammoth שכבר קיימת ב-BulkImportDialog, כולל חילוץ תמונות והעלאתן ל-Supabase Storage.

### עיצוב אזור הגרירה
אזור קומפקטי (לא גדול כמו ב-Bulk Import) עם אייקון Upload, טקסט קצר, ומצב hover/drag מודגש. יופיע כאפשרות משלימה לעורך הטקסט.

## סיכום קבצים

| קובץ | שינוי |
|------|-------|
| package.json | התקנת pdfjs-dist |
| `src/components/contents/FileContentImport.tsx` | קומפוננטה חדשה - אזור גרירה + פרסור PDF/DOCX |
| `src/components/contents/ContentForm.tsx` | הוספת FileContentImport מעל העורך |
| `src/contexts/LanguageContext.tsx` | תרגומים לטקסטי העלאה (אופציונלי) |

