

# תיקון שפת הדיבור - מעבר למודל eleven_v3

## הבעיה
הקול המשובט (Lewinsky, `u8hSBdUhoLus6YkI9YJt`) עובד נכון רק עם מודל `eleven_v3` - זה המודל שצוין בזיכרון הפרויקט כמודל שנבחר בשל "התמיכה המשופרת שלו בעברית". המודל `eleven_multilingual_v2` לא מפיק עברית נכונה עם הקול הזה.

## הפתרון
שינוי קטן בקובץ אחד:

### קובץ: `supabase/functions/elevenlabs-tts/index.ts`
- שינוי `model_id` מ-`eleven_multilingual_v2` ל-`eleven_v3`
- הסרת פרמטר `language` (מודל v3 מזהה שפה אוטומטית ולא צריך אותו)

### לפני:
```text
model_id: 'eleven_multilingual_v2',
language: language || 'he',
```

### אחרי:
```text
model_id: 'eleven_v3',
```

## סיבה
מודל `eleven_v3` הוא המודל העדכני והמתקדם ביותר של ElevenLabs, תומך ב-70+ שפות כולל עברית, ובמיוחד - הקול המשובט הזה אומן/הוגדר לעבוד איתו. זה המודל שעבד קודם לפני השינויים.

## פריסה
ה-Edge Function תיפרס מחדש אוטומטית.
