

# Upgrade TTS to ElevenLabs

## Overview
Replace the browser's Web Speech API with ElevenLabs for high-quality Hebrew voice in the Connection Bridge bot. ElevenLabs has been connected and `ELEVENLABS_API_KEY` is available.

## Changes

### 1. New Edge Function: `supabase/functions/elevenlabs-tts/index.ts`
- Receives `{ text }` in request body
- Calls ElevenLabs TTS API with voice **Liam** (`TX3LPaxmHKxFdv7VOQHJ`)
- Model: `eleven_multilingual_v2`
- Voice settings: stability 0.4, similarity_boost 0.7, style 0.3, speaker_boost true
- Returns raw MP3 audio with CORS headers
- Error handling with proper status codes

### 2. Update `supabase/config.toml`
- Add `[functions.elevenlabs-tts]` with `verify_jwt = false`

### 3. Rewrite `src/hooks/useTTS.ts`
- Replace `window.speechSynthesis` with `fetch` to the edge function
- Use `new Audio(URL.createObjectURL(blob))` for playback
- Add `isLoading` state to the `TTSControls` interface
- `isSupported` is always `true` (server-side TTS works everywhere)
- Cleanup: revoke object URLs on unmount

### 4. Update `src/components/bots/ChatMessage.tsx`
- Show `Loader2` spinning icon while audio is loading (`tts.isLoading`)
- Show `VolumeX` when playing, `Volume2` when idle
- Disable button during loading
- Stop also cancels loading

### 5. Update `src/contexts/LanguageContext.tsx`
- Add `voice.loading` translation:
  - EN: "Loading voice..."
  - HE: "טוען קול..."

## File Summary

| File | Action |
|------|--------|
| `supabase/functions/elevenlabs-tts/index.ts` | Create |
| `supabase/config.toml` | Add function entry |
| `src/hooks/useTTS.ts` | Rewrite (ElevenLabs fetch + Audio API) |
| `src/components/bots/ChatMessage.tsx` | Add loading spinner state |
| `src/contexts/LanguageContext.tsx` | Add `voice.loading` translation |

