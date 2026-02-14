

# Fix ElevenLabs TTS - Update API Key

## Problem
The current ElevenLabs API key is missing the `text_to_speech` permission, causing a 401 error from the ElevenLabs API.

## Solution
1. **Reconnect the ElevenLabs connector** with the new API key that has the correct permissions
2. **Test the edge function** to verify it works

## Steps
1. Reconnect the ElevenLabs connection so the new API key replaces the old one
2. Call the `elevenlabs-tts` edge function with a test phrase to confirm it returns audio successfully

No code changes are needed -- the edge function and client code are already correct. This is purely a credentials update.

