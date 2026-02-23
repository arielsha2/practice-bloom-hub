

# הטמעת סרטון YouTube בעמוד הבית

## מה ישתנה
ה-placeholder של הסרטון בסקציית Hero יוחלף בנגן YouTube מוטמע עם הסרטון `https://youtu.be/Q1YXKvx6orI`.

## שינוי יחיד

**קובץ: `src/components/landing/Hero.tsx`**

החלפת ה-div של ה-Video Placeholder (שורות 93-115 בערך) ב-iframe של YouTube:

- הסרת כפתור ה-Play המזויף והטקסט "videoPlaceholder"
- הוספת iframe עם `src="https://www.youtube.com/embed/Q1YXKvx6orI"` בתוך מיכל `aspect-video` עם פינות מעוגלות וצל
- שמירה על האנימציה והעיצוב הקיימים (rounded-2xl, shadow, border)

## תוצאה
במקום placeholder סטטי עם אייקון Play, המבקרים יראו את סרטון ההיכרות מוטמע ישירות בעמוד הבית.

