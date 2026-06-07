# דף מכירה מלא למנטור — מחליף את ה-Paywall

## מה ייווצר
**קובץ חדש:** `src/components/mentor/MentorSalesPage.tsx` — דף מכירה ארוך ב-RTL הכולל:

1. **Hero** — תווית "גרסת בטא · 20 מקומות בלבד", כותרת "המנטור לקליניקה — סופרוויז׳ן רגיש לעסק", תיאור קצר, CTA ראשי "אני רוצה להיות אחד מ־20".
2. **בעיה** — "שנים של הכשרות... אבל אף אחד לא לימד אותך את זה" + 4 שאלות בכרטיסים עם אייקון `HelpCircle`.
3. **פרסונות** — 7 הסוגים של מטפלים שמנסים לפתור לבד, כרשימה ממוספרת על רקע `mentor-surface`.
4. **פתרון** — "מה אם היה מישהו שמחזיק אותך בדיוק שם?" + הסבר מסכם "זה המנטור לקליניקה".
5. **5 שלבים** — גריד `md:grid-cols-2` עם אייקונים (UserIcon, Tag, Compass, Users, Trophy) + כרטיס נפרד עם Heart על "הרובד הפנימי".
6. **איך זה נראה בפועל** — 4 כרטיסים (Clock, Heart, Target, TrendingUp) + ציטוט "כמו סופרוויז׳ן רק שזמין תמיד".
7. **הוכחה חברתית** — שני סיפורי מטפלים בכרטיסים.
8. **באנר בטא** — "20 מקומות בלבד", הסבר על המשוב, ואזהרת "מיועד למי שמוכן לעשות".
9. **תמחור** — קופסה בולטת: ₪1,800 עם **strikethrough**, ₪750 בענק בצבע `mentor-accent`, 4 בולטים (גישה לתמיד, שיפורים עתידיים, פחות משני סופרוויז׳ן, שלך לתמיד), כפתור CTA.
10. **קשר** — כפתור "שליחת הודעה בוואטסאפ" → לינק וואטסאפ של אליענה (972523379716).
11. **WebsiteComingSoonCard variant="paywall"** בתחתית.

## קישורים (קבועים בראש הקובץ)
- `PAYMENT_URL = https://meshulam.co.il/quick_payment?b=692abdd2459224a95d57aef700a015ab`
- `WHATSAPP_URL = https://api.whatsapp.com/send/?phone=972523379716&text&type=phone_number&app_absent=0`

שני הכפתורים פותחים `window.open(..., "_blank", "noopener,noreferrer")`.

## עריכה ב-Mentor.tsx (שורות 807–844)
להחליף את כל בלוק ה-paywall ב:
```tsx
if (!accessLoading && hasAccess === false) {
  return (
    <div dir={isRTL ? "rtl" : "ltr"} className="min-h-screen flex flex-col bg-mentor-bg">
      <MentorTopBar />
      <main className="flex-1 pt-16">
        <MentorSalesPage />
      </main>
      <Footer />
    </div>
  );
}
```
ולהוסיף `import { MentorSalesPage } from "@/components/mentor/MentorSalesPage";`.

הקבוע `MENTOR_SALES_URL` הישן יישאר בקובץ (לא מוסר עכשיו כדי לא לשבור שימוש פוטנציאלי במקום אחר).

## עיצוב
- טוקנים סמנטיים בלבד: `mentor-accent`, `mentor-bg`, `mentor-surface`, `mentor-border`, `foreground`, `muted-foreground`, `card`.
- אנימציות `framer-motion` עדינות (fade+slide בכניסה לוויופורט, `once: true`).
- היררכיה: `h1` יחיד ב-hero, `h2` בכל סקציה.
- רספונסיבי mobile-first, גרידים `md:grid-cols-2`.

## מה לא משתנה
המסלול של רוכשים, ה-`WebsiteComingSoonCard` הקיים בעמוד הראשי וב-FinalCelebration, הראוטים, וההוקים — נשארים כפי שהם.

מוכן ליישום ברגע שתאשר.
