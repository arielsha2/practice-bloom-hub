
# הוספת תמיכה בקישורי וידאו מ-Google Drive

## סקירה כללית
הוספת אפשרות להעלות קישורי וידאו מ-Google Drive לספריית המדיה. Google Drive תומך בהטמעה (embed) של סרטונים, כך שהם יוצגו ישירות במערכת בדומה ל-YouTube ו-Vimeo.

## שינויים נדרשים

### 1. עדכון טיפוסי וידאו (`src/lib/videoUtils.ts`)

**הוספת Google Drive לרשימת המקורות:**
```typescript
export type VideoSource = 'file' | 'youtube' | 'vimeo' | 'zoom' | 'gdrive';
```

**הוספת פונקציה לחילוץ ID מקישור Google Drive:**
- תמיכה בפורמטים:
  - `https://drive.google.com/file/d/FILE_ID/view`
  - `https://drive.google.com/open?id=FILE_ID`
  - `https://docs.google.com/file/d/FILE_ID/...`

**יצירת URL להטמעה:**
```typescript
// Format: https://drive.google.com/file/d/{FILE_ID}/preview
```

### 2. עדכון דיאלוג העלאת מדיה (`src/components/portal/admin/MediaUploadDialog.tsx`)

**הוספת אפשרות Google Drive בבחירת מקור וידאו:**
- הוספת רדיו באטן עם אייקון של Google Drive
- placeholder מתאים: `https://drive.google.com/file/d/.../view`

### 3. עדכון נגן הוידאו (`src/components/portal/VideoPlayerInline.tsx`)

**הוספת טיפול ב-Google Drive:**
- שימוש ב-iframe עם URL מסוג `/preview`
- Google Drive נפתח ב-embed כמו YouTube/Vimeo

### 4. עדכון ResourceItem (`src/components/portal/ResourceItem.tsx`)

**הוספת אייקון ותווית עבור Google Drive**

### 5. עדכון תרגומים (`src/contexts/LanguageContext.tsx`)

**הוספת מחרוזות:**
- `portal.googleDrive` - תווית לתצוגה
- `portal.admin.gdriveWarning` - אזהרה על הרשאות שיתוף

---

## פרטים טכניים

### חילוץ FILE_ID מ-Google Drive URL
```typescript
export function extractGoogleDriveId(url: string): string | null {
  const patterns = [
    // drive.google.com/file/d/FILE_ID/...
    /drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/,
    // drive.google.com/open?id=FILE_ID
    /drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/,
    // docs.google.com/file/d/FILE_ID/...
    /docs\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/,
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match?.[1]) return match[1];
  }
  return null;
}
```

### יצירת Embed URL
```typescript
// Input: https://drive.google.com/file/d/1ABC123xyz/view
// Output: https://drive.google.com/file/d/1ABC123xyz/preview
```

### הערה חשובה למשתמש
כדי שוידאו מ-Google Drive יעבוד במערכת, הקובץ חייב להיות משותף בהרשאה "Anyone with the link". אם הקובץ פרטי, הנגן יציג שגיאה.

---

## קבצים שישתנו

| קובץ | שינוי |
|------|-------|
| `src/lib/videoUtils.ts` | הוספת פונקציות לזיהוי וחילוץ Google Drive |
| `src/components/portal/admin/MediaUploadDialog.tsx` | הוספת אפשרות Google Drive בבחירת מקור |
| `src/components/portal/VideoPlayerInline.tsx` | תמיכה בהטמעת Google Drive |
| `src/components/portal/ResourceItem.tsx` | אייקון ותווית ל-Google Drive |
| `src/contexts/LanguageContext.tsx` | תרגומים חדשים |

## זרימת עבודה אחרי השינוי
```
1. מנהל פותח את ספריית המדיה
2. לוחץ "העלאה חדשה"
3. בוחר סוג: וידאו
4. בוחר מקור: Google Drive
5. מדביק קישור לקובץ משותף
6. המערכת מאמתת את הפורמט
7. הוידאו נשמר ויוצג ב-embed בעמוד השיעור
```
