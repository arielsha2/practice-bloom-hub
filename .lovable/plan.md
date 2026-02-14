

# Fix Custom "Lewinsky" Voice - Adjust Voice Settings

## Problem
The voice sounds like a completely different person. The model (`eleven_multilingual_v2`) and voice ID are already correct. The issue is the `voice_settings` parameters distorting the cloned voice.

## Current Settings (causing distortion)
```text
stability: 0.4       -- too low, causes voice variation
similarity_boost: 0.7 -- not maximum fidelity
style: 0.3           -- adds stylistic changes that alter the voice
```

## New Settings (faithful to cloned voice)
```text
stability: 0.75      -- consistent, faithful to source
similarity_boost: 1.0 -- maximum similarity to original recording
style: 0.0           -- no stylistic distortion
```

## File to modify

**`supabase/functions/elevenlabs-tts/index.ts`** — lines 44-47, change voice_settings values:
- `stability`: 0.4 -> 0.75
- `similarity_boost`: 0.7 -> 1.0
- `style`: 0.3 -> 0.0

Edge function will be redeployed after the change.

