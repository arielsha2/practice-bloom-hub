

# Update TTS Voice to "Lewinsky" Custom Voice

## Change
Replace the default voice ID from "Daniel" (`onwK4e9ZLuTAKqWW03F9`) to the user's custom "Lewinsky" voice (`u8hSBdUhoLus6YkI9YJt`).

## Files to modify

**`supabase/functions/elevenlabs-tts/index.ts`** (line 8):
- Change `DEFAULT_VOICE_ID` from `'onwK4e9ZLuTAKqWW03F9'` to `'u8hSBdUhoLus6YkI9YJt'`
- Update the comment to reflect the new voice name

## Technical details
- Only one line changes in one file
- The edge function will be redeployed automatically
- The `eleven_multilingual_v2` model will continue to auto-detect Hebrew from the text

