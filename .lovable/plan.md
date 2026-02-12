

# הוספת בוט "גשר הקשר" (Connection Bridge)

## סקירה
הוספת בוט AI חדש - מאמן נטוורקינג והפניות למטפלים, עם תהליך מובנה בן 4 שלבים וסרגל התקדמות ייחודי לבוט הזה. פיצ'ר השמע נדחה לשלב מאוחר יותר.

## שינויים נדרשים

### 1. מיגרציית SQL - הוספת הבוט לדאטאבייס
INSERT לטבלת `bot_configurations` עם:
- `bot_key`: `connection-bridge`
- `name_he`: גשר הקשר
- `name_en`: Connection Bridge Bot
- `icon`: Handshake
- `color`: #4A90E2
- `welcome_message_he`: ההודעה שצוינה בבקשה
- `system_prompt`: הפרומפט המלא עם 4 השלבים (מחקר, פרופיל, סימולציה, משוב)

### 2. `src/pages/AIAssistants.tsx`
- הוספת `Handshake` ל-imports מ-lucide-react
- הוספת `{ key: 'connection', icon: Handshake }` למערך `botData`
- הוספת `'connection': 'connection-bridge'` ל-`botKeyMapping`

### 3. `src/contexts/LanguageContext.tsx`
הוספת תרגומים:
- `bots.connection.title` - "Connection Bridge Bot" / "גשר הקשר"
- `bots.connection.desc` - תיאור קצר באנגלית ובעברית

### 4. `src/pages/BotChat.tsx` - סרגל התקדמות
- הוספת `Handshake` ל-imports
- הוספת הבוט ל-`botIcons`
- הוספת קומפוננטת Stepper שמופיעה רק כש-`botKey === 'connection-bridge'`
- הסטפר יציג 4 שלבים: מחקר -> פרופיל -> סימולציה -> משוב
- מעקב אחרי השלב הנוכחי על בסיס ניתוח תוכן ההודעות מהבוט (הפרומפט יכלול סמנים מיוחדים כמו `[STAGE:2]` בתגובות)

### 5. קומפוננטת `src/components/bots/ConnectionBridgeStepper.tsx` (חדש)
- קומפוננטה ויזואלית של 4 שלבים עם אייקונים
- שלב פעיל מודגש, שלבים שהושלמו מסומנים בוי
- עיצוב RTL-friendly עם קווים מחברים בין השלבים

## פרטים טכניים

### System Prompt (יכלול הוראה לסמן שלבים)
הפרומפט יכלול הנחיה לבוט להוסיף סמן שלב בתחילת כל תגובה: `[STAGE:1]`, `[STAGE:2]`, `[STAGE:3]`, `[STAGE:4]`. הסמן יפורסר מהתוכן לפני הצגתו למשתמש, וישמש לעדכון סרגל ההתקדמות.

### זיהוי שלבים בקוד
```text
- הוק useBotChat או BotChat ינתח את תגובות הבוט
- חיפוש תבנית [STAGE:X] בתחילת כל תגובה
- הסמן יוסר מהתוכן המוצג
- state של currentStage יעדכן את הסטפר
```

### קובץ config.toml
הבוט משתמש בפונקציית `bot-chat` הקיימת - אין צורך בשינוי.

## סיכום קבצים

| קובץ | שינוי |
|------|-------|
| מיגרציית SQL | INSERT לטבלת bot_configurations |
| `src/pages/AIAssistants.tsx` | הוספת כרטיס connection עם אייקון Handshake |
| `src/contexts/LanguageContext.tsx` | הוספת תרגומים bots.connection.title ו-desc |
| `src/pages/BotChat.tsx` | הוספת Handshake icon, לוגיקת שלבים, הצגת Stepper |
| `src/components/bots/ConnectionBridgeStepper.tsx` | קומפוננטה חדשה - סרגל התקדמות 4 שלבים |

