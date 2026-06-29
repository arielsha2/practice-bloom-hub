## הבעיה
ב-`src/pages/BotChat.tsx` שורה 199, אחרי כל הודעה רצה:
```ts
messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
```
כש-BotChat רץ בתוך iframe (כפי שקורה במנטור), `scrollIntoView` מתפשט החוצה ומגלגל גם את חלון ההורה — הדפדפן מנסה להביא את ה-iframe עצמו ל-viewport. התוצאה: בכל שליחת הודעה לבוט התמחור, עמוד המנטור קופץ למטה והמשתמש צריך לגלול חזרה.

זו גם הסיבה ש-`block: 'center'` ב-`useHandoffManager` "מורגש" שוב ושוב — אבל המקור האמיתי הוא ה-scroll הפנימי של BotChat, לא ההנדוף.

## התיקון (מינימלי, frontend בלבד)

**`src/pages/BotChat.tsx`**
1. להחליף את `scrollIntoView` בגלילה ידנית של המיכל הפנימי של ההודעות בלבד, שלא משפיעה על ההורה:
   - לאתר את ה-viewport של ה-`ScrollArea`/רשימת ההודעות (האב הקרוב של `messagesEndRef`, או ref ייעודי על הרשימה).
   - לעשות `container.scrollTop = container.scrollHeight` בתוך `requestAnimationFrame`.
   - גיבוי: אם משתמשים ב-`scrollIntoView`, להוסיף `block: 'nearest', inline: 'nearest'` ולהריץ רק כאשר ה-iframe מזוהה בתוך מנטור (`window.self !== window.top`) — אבל עדיף הפתרון הראשון כי הוא קונסיסטנטי בכל מצב.

זהה לדפוס שכבר קיים ב-`Mentor.tsx` שורה 687-689 (`viewport.scrollTop = viewport.scrollHeight`) — נשתמש באותו דפוס בדיוק כדי שיהיה אחיד.

## מה לא משתנה
- `useHandoffManager` — נשאר כמו שהוא. הגלילה החד-פעמית של ההורה למרכז ה-iframe ברגע ההנדוף עדיין רצויה.
- ה-iframe וה-URL — לא נוגעים.
- BotChat כשהוא רץ ב-page המלא (לא iframe) — הגלילה הפנימית עובדת בדיוק אותו דבר, רק בלי תופעת לוואי על ההורה.

## אימות
לפתוח את המנטור בלוקאל, לבצע הנדוף לבוט התמחור, ולשלוח 3-4 הודעות. וידוא שעמוד המנטור לא קופץ אחרי כל הודעה, וש-iframe עצמו עדיין נגלל לתחתית השיחה.