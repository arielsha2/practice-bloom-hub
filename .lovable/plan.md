
# תיקון שפת הדיבור - הוספת language_code לעברית

## הבעיה
כל הקולות (כולל Liam, Lewinsky ואחרים) נשמעים בשפה זרה במקום בעברית. הסיבה: המודל `eleven_multilingual_v2` מנסה לזהות את השפה אוטומטית מהטקסט, אבל הזיהוי האוטומטי נכשל - במיוחד כשהטקסט מכיל מספרים, מילים באנגלית, או משפטים קצרים.

## הפתרון
ה-API של ElevenLabs תומך בפרמטר `language_code` שמאלץ את המודל לדבר בשפה מסוימת. נוסיף `language_code: "he"` (קוד ISO 639-1 לעברית) לבקשה.

## שינויים

### קובץ: `supabase/functions/elevenlabs-tts/index.ts`

1. לקבל פרמטר `language` אופציונלי מהקליינט (ברירת מחדל: `"he"`)
2. להוסיף `language_code` לבקשה ל-ElevenLabs API

שינוי בשורה 24 - לקבל גם `language` מהבקשה:
```text
const { text, voiceId, language } = await req.json();
```

שינוי בשורות 41-49 - להוסיף `language_code` לגוף הבקשה:
```text
body: JSON.stringify({
  text: text.trim(),
  model_id: 'eleven_multilingual_v2',
  language_code: language || 'he',
  voice_settings: {
    stability: 0.75,
    similarity_boost: 1.0,
    style: 0.0,
    use_speaker_boost: true,
  },
}),
```

### ללא שינוי בצד הקליינט
ברירת המחדל היא עברית (`"he"`), כך שה-hook `useTTS` לא צריך שינוי. אם בעתיד תרצה לתמוך בשפות נוספות, תוכל להעביר פרמטר `language` מהקליינט.

### פריסה
ה-Edge Function תיפרס מחדש אוטומטית אחרי השינוי.
