

# שיפור שדה System Prompt לתמיכה בטקסט ארוך + היסטוריית גרסאות

## הבעיות הנוכחיות

1. ה-Textarea מוגבל ל-`min-h-32` (כ-8 שורות) -- לא מספיק לפרומפט ארוך עם דוגמאות שאלה-תשובה
2. `dir="ltr"` -- עברית מוצגת הפוך
3. אין היסטוריית גרסאות לפרומפט
4. רשימת המודלים חסרה את `gpt-4o`, `gpt-4o-mini`, `gemini-2.0-flash-001`
5. ה-`max_tokens` של ה-AI מוגבל ל-4000 -- לא מספיק אם הפרומפט עצמו ארוך

## שינויים נדרשים

### 1. מיגרציית מסד נתונים

- עדכון ברירת המחדל של `system_prompt` לפרומפט המנטור
- יצירת טבלת `qa_ai_settings_history` לשמירת גרסאות קודמות
- הגדלת מגבלת `max_tokens` ל-8000
- הגדרת RLS: רק admins יכולים לצפות ולנהל היסטוריה

```sql
-- עדכון default + ערך קיים
ALTER TABLE public.qa_ai_settings 
  ALTER COLUMN system_prompt 
  SET DEFAULT 'You are a mentor for psychotherapists...';

UPDATE public.qa_ai_settings 
  SET system_prompt = 'You are a mentor for psychotherapists. Your tone is professional, warm, and encouraging. You provide business and marketing advice that is ethical and authentic. Always respond in Hebrew.';

-- טבלת היסטוריה
CREATE TABLE public.qa_ai_settings_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  system_prompt text NOT NULL,
  model text NOT NULL,
  temperature numeric NOT NULL,
  max_tokens integer NOT NULL,
  changed_by uuid REFERENCES public.profiles(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.qa_ai_settings_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage prompt history"
  ON public.qa_ai_settings_history FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));
```

### 2. עדכון `QASettingsCard.tsx`

**Textarea משודרג:**
- `min-h-64` (גובה מינימלי גדול יותר -- כ-16 שורות)
- `max-h-[500px] overflow-y-auto` לגלילה עם גובה מקסימלי
- `dir="auto"` לתמיכה נכונה ב-RTL
- הסרת `font-mono` כי הפרומפט בעברית
- מונה תווים שמראה את אורך הפרומפט הנוכחי

**רשימת מודלים מעודכנת:**
```typescript
const AVAILABLE_MODELS = [
  { value: 'openai/gpt-4o', label: 'GPT-4o (Recommended)' },
  { value: 'openai/gpt-4o-mini', label: 'GPT-4o Mini (Fast)' },
  { value: 'google/gemini-2.0-flash-001', label: 'Gemini 2.0 Flash' },
  { value: 'google/gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
  { value: 'google/gemini-2.5-pro', label: 'Gemini 2.5 Pro' },
  { value: 'google/gemini-3-flash-preview', label: 'Gemini 3 Flash' },
  { value: 'openai/gpt-5', label: 'GPT-5' },
  { value: 'openai/gpt-5-mini', label: 'GPT-5 Mini' },
];
```

**היסטוריית גרסאות:**
- שמירת ההגדרות הנוכחיות לטבלת `qa_ai_settings_history` לפני כל עדכון
- סקציית Collapsible בתחתית הכרטיסיה שמציגה גרסאות קודמות
- כפתור "שחזר" ליד כל גרסה שמאפשר להחזיר פרומפט ישן
- תצוגת תאריך + תצוגה מקוצרת של הפרומפט (100 תווים ראשונים)

**הגדלת טווח Max Tokens:**
- שינוי הסליידר מ-`max={4000}` ל-`max={8000}` כדי לתמוך בתשובות ארוכות יותר כשהפרומפט ארוך

### 3. עדכון Edge Function

- עדכון ברירת מחדל של fallback prompt לפרומפט המנטור החדש

## קבצים לעדכון

| קובץ | פעולה |
|------|-------|
| מיגרציית SQL | יצירת טבלת history, עדכון defaults |
| `src/components/portal/admin/QASettingsCard.tsx` | Textarea גדול, RTL, מודלים, היסטוריה |
| `supabase/functions/qa-ai-answer/index.ts` | עדכון fallback prompt |
| `src/integrations/supabase/types.ts` | עדכון טיפוסים לטבלה חדשה |

