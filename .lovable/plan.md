
# תיקון שפת הדיבור - הוספת פרמטר language

## הבעיה
הפרמטר `language` חסר בגוף הבקשה ל-ElevenLabs. המודל `eleven_multilingual_v2` תומך בעברית אבל צריך לציין את השפה במפורש באמצעות הפרמטר `language` (לא `language_code` שגרם לשגיאה קודם).

## הפתרון
שינוי של שורה אחת בקובץ `supabase/functions/elevenlabs-tts/index.ts` - הוספת `language: language || 'he'` לגוף הבקשה:

```text
body: JSON.stringify({
  text: text.trim(),
  model_id: 'eleven_multilingual_v2',
  language: language || 'he',        // <-- שורה חדשה
  voice_settings: {
    stability: 0.5,
    similarity_boost: 0.75,
    style: 0.0,
    use_speaker_boost: true,
    speed: 1.15,
  },
}),
```

הפרמטר `language` כבר נקרא מהבקשה בשורה 24, וברירת המחדל תהיה `"he"` (עברית).

## הבדל מהניסיון הקודם
- קודם השתמשנו ב-`language_code` שגרם לשגיאת 400
- הפעם נשתמש ב-`language` שהוא הפרמטר הנכון עבור מודל `eleven_multilingual_v2`
