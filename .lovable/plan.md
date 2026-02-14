
# Fix Hebrew Voice in ElevenLabs TTS

## Problem
The TTS voice "Liam" (TX3LPaxmHKxFdv7VOQHJ) is primarily an English voice. Even though the model `eleven_multilingual_v2` supports Hebrew, the voice itself doesn't produce natural Hebrew speech.

## Solution

### 1. Change the default voice to one that works better with Hebrew

Replace the hardcoded "Liam" voice ID in the edge function with a voice better suited for Hebrew. Recommended options:
- **Daniel** (`onwK4e9ZLuTAKqWW03F9`) - warm, professional male voice
- **George** (`JBFqnCBsd6RMkjVDRZzb`) - warm, trustworthy male narrator

### 2. Make voice ID configurable from the client

Instead of hardcoding the voice in the edge function, allow the client to pass a `voiceId` parameter. This way different bots can use different voices.

### Files to modify

**`supabase/functions/elevenlabs-tts/index.ts`**:
- Accept an optional `voiceId` in the request body
- Fall back to a Hebrew-friendly default (Daniel: `onwK4e9ZLuTAKqWW03F9`)

```typescript
const { text, voiceId } = await req.json();
const VOICE_ID = voiceId || 'onwK4e9ZLuTAKqWW03F9'; // Daniel - works well with Hebrew
```

**`src/hooks/useTTS.ts`**:
- Accept an optional `voiceId` parameter in the hook
- Pass it to the edge function request

```typescript
export function useTTS(voiceId?: string): TTSControls {
  // ...
  body: JSON.stringify({ text: cleaned, voiceId }),
}
```

**`src/components/bots/ChatMessage.tsx`**:
- No changes needed (voice ID flows through useTTS)

### Technical note
The `eleven_multilingual_v2` model auto-detects the language from the text. With Hebrew text and a multilingual-capable voice, it will speak Hebrew naturally. The key is picking a voice that produces clear Hebrew output.
