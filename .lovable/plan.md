

# שיפורים להגדרות AI לשאלות ותשובות

## 1. עדכון ברירת מחדל ל-System Prompt

עדכון ה-default בטבלת `qa_ai_settings` + עדכון הערך הקיים בטבלה:

```sql
-- Migration: שינוי ברירת המחדל
ALTER TABLE public.qa_ai_settings 
  ALTER COLUMN system_prompt 
  SET DEFAULT 'You are a mentor for psychotherapists. Your tone is professional, warm, and encouraging. You provide business and marketing advice that is ethical and authentic. Always respond in Hebrew.';

-- עדכון הרשומה הקיימת
UPDATE public.qa_ai_settings 
  SET system_prompt = 'You are a mentor for psychotherapists. Your tone is professional, warm, and encouraging. You provide business and marketing advice that is ethical and authentic. Always respond in Hebrew.';
```

## 2. טבלת היסטוריית Prompt

יצירת טבלה חדשה `qa_ai_settings_history` לשמירת גרסאות קודמות:

```sql
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

## 3. עדכון רשימת המודלים

שינוי ב-`QASettingsCard.tsx`:

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

## 4. תיקון RTL ב-Textarea

שינוי ב-Textarea של ה-system prompt מ-`dir="ltr"` ל-`dir="auto"` כדי שטקסט עברי יוצג נכון:

```tsx
<Textarea
  value={settings.system_prompt}
  onChange={(e) => setSettings({ ...settings, system_prompt: e.target.value })}
  className="min-h-32 text-sm"
  dir="auto"
/>
```

## 5. שמירת היסטוריה בעת שמירה

עדכון `handleSave` ב-`QASettingsCard.tsx` - לפני שמירת ההגדרות החדשות, שמירת ההגדרות הנוכחיות בטבלת ההיסטוריה:

```typescript
const handleSave = async () => {
  if (!settings) return;
  setIsSaving(true);
  try {
    // Save current settings to history before updating
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from('qa_ai_settings_history').insert({
      system_prompt: originalSettings.system_prompt,
      model: originalSettings.model,
      temperature: originalSettings.temperature,
      max_tokens: originalSettings.max_tokens,
      changed_by: user?.id,
    });

    // Then update current settings
    const { error } = await supabase.from('qa_ai_settings').update({...}).eq('id', settings.id);
    // ...
  }
};
```

## 6. תצוגת היסטוריה (Collapsible)

הוספת אקורדיון בתחתית הכרטיסיה שמציג גרסאות קודמות עם אפשרות לשחזר:

| תאריך | מודל | פעולה |
|--------|------|-------|
| 09/02/2026 14:30 | GPT-4o | [שחזר] |
| 09/02/2026 12:00 | Gemini 3 Flash | [שחזר] |

## קבצים לעדכון

| קובץ | פעולה |
|------|-------|
| Migration SQL | יצירת טבלת history + עדכון default |
| `src/components/portal/admin/QASettingsCard.tsx` | מודלים, RTL, היסטוריה, שחזור |
| `supabase/functions/qa-ai-answer/index.ts` | עדכון fallback default prompt |

