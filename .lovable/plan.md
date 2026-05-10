## הבעיה

כשהמנטור שולח את המטפל לעבוד עם כלי (Niche Finder, Self Presentation, Pricing, Connection Bridge וכו'), שלוש בעיות:

1. **אין דרך ברורה לחזור** — בעמוד הכלי אין כפתור "חזרה למנטור".
2. **המנטור לא יודע שעבדת** — חוזרים לשיחה והמנטור ממשיך כאילו כלום לא קרה.
3. **למנטור אין גישה לתוצאות** — צריך להעתיק/לתאר ידנית את מה שהכלי הפיק.

## הפתרון בקצרה

נחבר את הכלים והמנטור באמצעות שלושה שינויים מתואמים:

1. **כפתור "חזרה למנטור"** בעמוד כל כלי (`/ai-assistants/:botKey`).
2. **שמירה אוטומטית של תוצרי הכלי** ל-`therapist_journeys` כך שהמנטור יראה אותן.
3. **טעינת ההקשר ב-mentor-chat** — בכל הודעה למנטור נצרף את תקציר תוצרי הכלים והכלים שהושלמו, וכשחוזרים מכלי תופיע הודעת פתיחה אוטומטית של המנטור שמתייחסת לעבודה.

---

## פירוט

### 1. כפתור "חזרה למנטור" ב-BotChat

ב-`src/pages/BotChat.tsx`, בכותרת הצ'אט (`ChatHeader`) נוסיף כפתור משני שמופיע רק כשהמשתמש מחובר ויש לו לפחות הודעה אחת בשיחה:

- טקסט: "שמור וחזור למנטור" (או "חזרה למנטור" אם אין מה לשמור).
- בלחיצה: אם הבוט תומך בחילוץ (`niche-finder` / `self-presentation`) — מריץ את `bot-extract-output` קודם. אחר כך מנווט ל-`/mentor?from=<botKey>&conv=<conversationId>`.
- עבור הבוטים האחרים (`pricing-calculator`, `connection-bridge`, `contact-finder`, `strategy-planner`, `content-creator`) — מנווט ישירות עם הפרמטרים, והשרת יחלץ סיכום קצר.

### 2. הרחבת `bot-extract-output` לסיכום גנרי

נוסיף ל-`supabase/functions/bot-extract-output/index.ts` ענף ברירת-מחדל: כל בוט שאינו `niche-finder` או `self-presentation` מקבל פרומפט שמחזיר סיכום קצר (3-5 משפטים בעברית) של מה שהמטפל גילה/החליט בכלי.

הסיכום יישמר תחת מפתח חדש בעמודת `reflection` (jsonb) של `therapist_journeys`, לדוגמה:
```
reflection.tool_summaries["pricing-calculator"] = {
  summary: "...",
  updated_at: "..."
}
```
לא צריך מיגרציה — `reflection` כבר jsonb.

### 3. הקשר משותף למנטור (mentor-chat)

ב-`src/pages/Mentor.tsx`, פונקציית `send` כבר מצרפת `messages` ו-`language`. נוסיף שליפה של `therapist_journeys` (כבר נטען ב-`useTherapistJourney`) ונעביר ל-edge function שדה חדש `journey_context` המכיל:
- `niche_output`
- `self_presentation_output`
- `completed_stages`
- `reflection.tool_summaries`

ב-`supabase/functions/mentor-chat/index.ts` נוסיף בלוק לפני ההודעות: אם `journey_context` לא ריק, נצרף הודעת `system` נוספת בעברית/אנגלית מהסגנון:
> "מידע על המטפל מהכלים שהשלים עד כה: נישה — …; הצגה עצמית — …; סיכום מ-Pricing Calculator — …. השתמש בזה בתשובות ואל תבקש מידע שכבר ניתן."

### 4. הודעת פתיחה אוטומטית בחזרה

ב-`Mentor.tsx`, בכניסה לעמוד עם פרמטר `?from=<botKey>`:

- ננקה את הפרמטר מה-URL.
- נוסיף הודעת `user` שקופה ראשונה (או `assistant` פתיחה) באוטומט: `"חזרתי מ<שם הכלי>. הנה הסיכום: …"` — נשלח ישירות ל-mentor-chat כך שהמנטור עונה אליה. כך המנטור גם מתייחס לעבודה וגם משתמש בתוצאות.
- אם השיחה כבר פתוחה, ההודעה נוספת בסופה במקום לאפס.

### 5. עדכון system prompt של המנטור

נוסיף שורה ב-`SYSTEM_PROMPT_HE`/`_EN` של mentor-chat:
> "כשמגיע ממך מידע על תוצרי כלי שהמטפל השלים, התייחס אליו במפורש ('ראיתי את הניסוח שיצא לך ב-Niche Finder…') לפני שתשאל את השאלה הבאה."

---

## טכני (לקריאה אופציונלית)

**קבצים שיתעדכנו:**
- `src/pages/BotChat.tsx` — כפתור חזרה + לוגיקת ניווט.
- `src/components/bots/ChatHeader.tsx` — slot לכפתור.
- `src/pages/Mentor.tsx` — קריאה ל-`useSearchParams`, הזרקת הודעת פתיחה, העברת `journey_context` ל-edge function.
- `supabase/functions/mentor-chat/index.ts` — קבלת `journey_context`, הזרקה ל-system prompt + תוספת הוראה.
- `supabase/functions/bot-extract-output/index.ts` — ענף סיכום גנרי + שמירה תחת `reflection.tool_summaries[botKey]`.

**ללא שינויי סכמה** — `therapist_journeys.reflection` הוא כבר `jsonb`.

**RLS** — לא משתנה. כל הקריאות נעשות עם ה-JWT של המשתמש; ה-policies הקיימות (`auth.uid() = user_id`) מספיקות.

---

## מה לא נכלל

- לא משנים את העיצוב של דף הכלי או של המנטור מעבר לכפתור הקטן.
- לא נוגעים בלוגיקה של ה-Journey Map.
- לא בונים סיכום אוטומטי ל-`connection-bridge` תרגול קולי (הוא תרגול, לא כלי הפקה) — הסיכום הגנרי שם פשוט יציין "תרגל שיחה ראשונה".
