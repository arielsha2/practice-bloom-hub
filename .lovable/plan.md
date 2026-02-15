

# תיקון שפת הדיבור - הוספת language_code לעברית

## הבעיה
בשינוי האחרון עברנו למודל `eleven_turbo_v2_5` והוספנו streaming ומהירות, אבל לא הוספנו את הפרמטר `language_code: "he"` לבקשה. בלי פרמטר זה, המודל מנסה לזהות את השפה אוטומטית מהטקסט ונכשל - ולכן הקול יוצא בשפה זרה.

## הפתרון
שינוי קטן בקובץ אחד בלבד:

### קובץ: `supabase/functions/elevenlabs-tts/index.ts`
הוספת `language_code: language || 'he'` לגוף הבקשה (שורה 43, אחרי `model_id`):

```text
body: JSON.stringify({
  text: text.trim(),
  model_id: 'eleven_turbo_v2_5',
  language_code: language || 'he',
  voice_settings: {
    stability: 0.5,
    similarity_boost: 0.75,
    style: 0.0,
    use_speaker_boost: true,
    speed: 1.15,
  },
}),
```

הפרמטר `language` כבר נקרא מהבקשה בשורה 24, אז צריך רק להוסיף שורה אחת לגוף הבקשה. ברירת המחדל היא `"he"` (עברית).

## פריסה
ה-Edge Function תיפרס מחדש אוטומטית.
