

# שדרוג שדה System Prompt בטופס ניהול בוטים

## הבעיה

שדה ה-System Prompt בטופס יצירת/עריכת בוט (`BotConfigForm.tsx`) מוגבל מדי לשימוש עם תמלולים ארוכים:

- גובה קבוע של 10 שורות בלבד (`rows={10}`)
- `font-mono` -- לא מתאים לעברית
- חסר `dir="auto"` לתמיכת RTL
- אין מונה תווים
- אין גלילה עם גובה מקסימלי

## שינויים נדרשים

### קובץ: `src/components/bots/BotConfigForm.tsx`

**1. שדרוג ה-Textarea של System Prompt (שורות 236-248):**

- שינוי מ-`rows={10}` ו-`font-mono` ל-`min-h-64 max-h-[500px] overflow-y-auto`
- הוספת `dir="auto"` לתמיכת RTL
- הסרת `font-mono` כדי שעברית תוצג טוב
- הוספת מונה תווים מתחת לשדה

**2. עדכון רשימת המודלים (שורות 54-60):**

הוספת `openai/gpt-4o`, `openai/gpt-4o-mini`, ו-`google/gemini-2.0-flash-001`:

```text
openai/gpt-4o          -> GPT-4o (מומלץ)
openai/gpt-4o-mini     -> GPT-4o Mini (מהיר)
google/gemini-2.0-flash-001 -> Gemini 2.0 Flash
google/gemini-2.5-flash -> Gemini 2.5 Flash (מאוזן)
google/gemini-2.5-pro  -> Gemini 2.5 Pro (מתקדם)
google/gemini-3-flash-preview -> Gemini 3 Flash (מהיר)
openai/gpt-5-mini      -> GPT-5 Mini (מאוזן)
openai/gpt-5           -> GPT-5 (מתקדם)
```

**3. עדכון הנחיית השדה:**

שינוי ה-FormDescription לכלול הנחיה על הדבקת תמלולים ודוגמאות שאלה-תשובה.

### לפני ואחרי

**לפני:**
```tsx
<Textarea 
  {...field} 
  placeholder="אתה עוזר AI מקצועי..." 
  rows={10}
  className="font-mono text-sm"
/>
```

**אחרי:**
```tsx
<Textarea 
  {...field} 
  placeholder="אתה עוזר AI מקצועי..." 
  className="min-h-64 max-h-[500px] overflow-y-auto text-sm"
  dir="auto"
/>
<p className="text-xs text-muted-foreground text-left" dir="ltr">
  {field.value?.length || 0} characters
</p>
```

## קובץ יחיד לעדכון

| קובץ | שינוי |
|------|-------|
| `src/components/bots/BotConfigForm.tsx` | Textarea גדול, RTL, מונה תווים, מודלים מעודכנים |

