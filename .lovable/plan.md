

# Voice Audio for Connection Bridge Bot (Using Browser Web Speech API)

## Overview
Add Hebrew text-to-speech to the Connection Bridge bot using the browser's built-in `window.speechSynthesis` API. This is free, requires no API keys or edge functions, and works entirely client-side. The code will be modular so you can swap in ElevenLabs later.

## What Will Be Created/Changed

### 1. New Hook: `src/hooks/useTTS.ts`
A modular TTS hook using `window.speechSynthesis`:
- Accepts text and a `lang` parameter (defaults to `he-IL`)
- Provides `speak(text)`, `stop()`, `isPlaying`, `isSupported` 
- Strips markdown markers before speaking
- Uses `SpeechSynthesisUtterance` with Hebrew language target
- Tries to find a Hebrew voice from available voices, falls back to default
- Handles cleanup on unmount (cancels speech)
- Designed with a clean interface so replacing with ElevenLabs later means only changing this one file

### 2. Update: `src/components/bots/ChatMessage.tsx`
- Add optional `enableVoice` prop
- For assistant messages with `enableVoice=true`:
  - Show a small speaker button (Volume2 / VolumeX icons) in the message header
  - Auto-play voice when streaming finishes (only for the latest message, not history)
  - Toggle play/stop on click
  - Visual states: idle (gray), playing (highlighted with animation)

### 3. Update: `src/pages/BotChat.tsx`
- Pass `enableVoice={botKey === 'connection-bridge'}` to ChatMessage components
- Pass `isLatestAssistant` flag so only the newest assistant message auto-plays

### 4. Update: `src/contexts/LanguageContext.tsx`
Add translations:
- `voice.play` / `voice.stop` / `voice.notSupported` (EN + HE)

## Technical Notes

- **No edge function needed** -- everything runs in the browser
- **Hebrew voice availability** varies by device/browser. The hook will attempt to find `he-IL` voices; on devices without Hebrew voices, it will use the default voice (still better than nothing)
- **Auto-play**: Only the latest assistant message auto-plays after streaming ends. Historical messages show a manual play button only
- **Modular design**: To switch to ElevenLabs later, only `src/hooks/useTTS.ts` needs to change -- the ChatMessage component calls the same interface

## Files Summary

| File | Change |
|------|--------|
| `src/hooks/useTTS.ts` | New -- Web Speech API TTS hook |
| `src/components/bots/ChatMessage.tsx` | Add speaker button + auto-play for voice-enabled messages |
| `src/pages/BotChat.tsx` | Pass `enableVoice` and `isLatestAssistant` props |
| `src/contexts/LanguageContext.tsx` | Add voice translations |

