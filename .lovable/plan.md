

# Voice Control: Stage-Based TTS and Audio Overlap Fix

## Issues
1. **Voice plays in all stages** - TTS auto-plays for every assistant message in the connection-bridge bot, but it should only activate during the simulation stage (stage 3)
2. **Audio overlap** - When a user answers while previous TTS is still playing, the new response starts a second audio track on top of the old one instead of stopping the previous one first

## Solution

### 1. Pass current stage to control voice activation (BotChat.tsx)

Change the `enableVoice` prop from a simple boolean to be stage-aware:

```tsx
// Before:
enableVoice={botKey === 'connection-bridge'}

// After:
enableVoice={botKey === 'connection-bridge' && currentStage >= 3}
```

This ensures stages 1 (Research) and 2 (Profiling) remain text-only, and voice activates only from stage 3 (Simulation) onward.

### 2. Global TTS stop when user sends a message (BotChat.tsx)

Add a shared TTS instance at the page level and stop any playing audio when the user sends a new message:

- Lift a `useTTS()` hook to the `BotChat` component level
- Call `tts.stop()` inside `handleSend` before dispatching the message
- Pass `tts` down to `ChatMessage` components (or use a simpler approach: stop via a global event/ref)

**Simpler approach**: Since each `ChatMessage` creates its own `useTTS` instance, we'll create a global TTS stop mechanism:
- Add a `stopAllTTS` event on `window` that all `useTTS` hooks listen to
- Dispatch this event in `handleSend` before sending the message
- Each `useTTS` hook listens for this event and calls its `stop()` method

### Files to modify

1. **`src/hooks/useTTS.ts`** - Add global stop event listener so any active TTS instance stops when `window.dispatchEvent(new Event('stopAllTTS'))` is fired
2. **`src/components/bots/ChatMessage.tsx`** - No changes needed (enableVoice prop already controls behavior)
3. **`src/pages/BotChat.tsx`** - Two changes:
   - Pass `enableVoice={botKey === 'connection-bridge' && currentStage >= 3}` instead of just `botKey === 'connection-bridge'`
   - In `handleSend`, dispatch `window.dispatchEvent(new Event('stopAllTTS'))` before sending

### Technical Details

**useTTS.ts changes:**
```typescript
useEffect(() => {
  const handleGlobalStop = () => stop();
  window.addEventListener('stopAllTTS', handleGlobalStop);
  return () => window.removeEventListener('stopAllTTS', handleGlobalStop);
}, [stop]);
```

**BotChat.tsx handleSend:**
```typescript
const handleSend = (content: string) => {
  // Stop any playing TTS before sending new message
  window.dispatchEvent(new Event('stopAllTTS'));
  // ... existing send logic
};
```

**BotChat.tsx message rendering:**
```tsx
enableVoice={botKey === 'connection-bridge' && currentStage >= 3}
```
