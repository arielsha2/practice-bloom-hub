

# יצירת בוט הצגה עצמית (Self-Presentation Bot)

## סקירה
בוט חדש שמלווה מטפלים בבניית הצגה עצמית מקצועית — תיאור קצר שניתן להשתמש בו בע"פ (מפגשים, שיחות רשת) או בכתב (מודעות, פרופילים). הבוט עובד בשיטת שאלה-אחת-בכל-פעם לפי מבנה קבוע של 4 שלבים.

---

## שינויים נדרשים

### 1. הוספת רשומה בטבלת `bot_configurations` (Supabase)
הכנסת בוט חדש עם:
- **bot_key**: `self-presentation`
- **name_he**: `בוט הצגה עצמית`
- **name_en**: `Self-Presentation Bot`
- **icon**: `Mic` (מייצג דיבור/הצגה)
- **color**: `#B07D62` (גוון חם, אותנטי)
- **model**: `google/gemini-3-flash-preview`
- **temperature**: `0.7`
- **system_prompt**: פרומפט מלא בעברית הכולל את כל ההנחיות שסיפקת — 4 השאלות בסדר, ההבחנה בין כאב פנימי לחיצוני, נקודות למחשבה, והכללים לפנייה ספציפית ותוצאה מוחשית

### 2. עדכון דף AI Assistants — `src/pages/AIAssistants.tsx`
- הוספת `Mic` ל-imports מ-lucide-react
- הוספת אובייקט בוט חדש ל-`botData`: `{ key: 'presentation', icon: Mic }`
- הוספת מיפוי ל-`botKeyMapping`: `'presentation': 'self-presentation'`

### 3. עדכון תרגומים — `src/contexts/LanguageContext.tsx`
הוספת מפתחות תרגום:
- **עברית**: `bots.presentation.title` = "בוט הצגה עצמית", `bots.presentation.desc` = "בנו הצגה עצמית מקצועית שמדברת בשפת הלקוח — לשימוש בשיחות, מפגשים ומודעות"
- **אנגלית**: `bots.presentation.title` = "Self-Presentation Bot", `bots.presentation.desc` = "Craft a professional self-presentation that speaks your client's language — for meetings, networking, and ads"

### 4. הודעת פתיחה ו-System Prompt
**הודעת פתיחה (welcome_message_he)**:
"שלום! 👋 אני כאן כדי לעזור לך לבנות הצגה עצמית מקצועית — תיאור קצר וממוקד שאפשר להשתמש בו כשמישהו שואל 'מה את/ה עושה?' או כשכותבים מודעה קצרה. נעבוד יחד שלב אחר שלב. מוכן/ה?"

**System Prompt** — יכלול:
- הוראה לשאול שאלה אחת בכל פעם, בסדר הקבוע
- שלב 1: למי אני פונה — תיאור שהאדם יזהה את עצמו בתוכו (לא מינוחים מקצועיים)
- שלב 2: הכאב והמצוקה — הבחנה בין כאב פנימי (ריקנות, דיכאון, בדידות) לכאב חיצוני (השלכות על יחסים, עבודה, שינה)
- שלב 3: הכמיהה — הרצון הפנימי (שקט, ביטחון, מרחב נשימה, קבלה עצמית)
- שלב 4: תוצאה קונקרטית — שילוב היבט רגשי ומוחשי בשפה פשוטה
- נקודות למחשבה בסוף — מה לא הוזכר, במי התמקדנו ובמי לא
- בסיום: הצגת ההצגה העצמית המלאה בפורמט מוכן לשימוש

---

## פרטים טכניים
- לא נדרשים שינויי DB schema — הבוט משתמש בטבלאות הקיימות (`bot_configurations`, `bot_conversations`, `bot_messages`, `bot_user_memory`)
- לא נדרש שינוי ב-Edge Function — `bot-chat` כבר דינמי ועובד עם כל בוט לפי `bot_key`
- הגריד בדף AI Assistants יציג 6 בוטים (2 שורות של 3)

