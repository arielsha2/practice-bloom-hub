## Plan

הבעיה החדשה כבר יותר ממוקדת: `mentor-analyze` כן מריץ את `mentor-score`, אבל שולח לו `Authorization: Bearer ...` עם ערך שה־Edge Runtime רואה כ־JWT לא תקין.

### מה אתקן

1. **לתקן את הקריאה ל־mentor-score בתוך `mentor-analyze`**
   - להשתמש ב־`SUPABASE_ANON_KEY` כטוקן Bearer.
   - להוסיף fallback בטוח ל־`SUPABASE_PUBLISHABLE_KEY`, כי בפרויקט הזה קיימים שני שמות סוד אפשריים.
   - אם אין אף מפתח, להדפיס לוג ברור ולא לשלוח `Bearer ""` או ערך לא תקין.

2. **להסיר קונפיג מטעה של פונקציה שלא קיימת בקוד**
   - ב־`supabase/config.toml` יש `[functions.mentor-score] verify_jwt = false`, אבל בתיקיית `supabase/functions` אין פונקציית `mentor-score` מקומית.
   - אשאיר את הפתרון בקריאה עצמה, כי `mentor-score` כנראה קיימת בצד Supabase/Production אבל לא בקוד המקומי.

3. **להוסיף לוג אבחוני בטוח**
   - לא להדפיס את המפתח עצמו.
   - כן להדפיס איזה secret נבחר ואורך הטוקן, כדי לוודא שהוא לא ריק/לא malformed.

### תוצאה צפויה

במקום:

```text
mentor-score response 401 {"code":"UNAUTHORIZED_INVALID_JWT_FORMAT","message":"Invalid JWT"}
```

הלוג הבא אמור להראות ש־`mentor-score` קיבל Bearer token תקין, ואז או להחזיר הצלחה או שגיאה עניינית מתוך `mentor-score` עצמה.