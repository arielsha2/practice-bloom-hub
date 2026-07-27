import { useState, useRef, useCallback, useEffect } from 'react';

function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/\[STAGE:\d\]\s*/g, '')
    .replace(/\[DIFFICULTY:\w+\]\s*/g, '');
}

export interface TTSControls {
  speak: (text: string) => void;
  stop: () => void;
  isPlaying: boolean;
  isLoading: boolean;
  isSupported: boolean;
  duration: number | null;
}

const TTS_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/elevenlabs-tts`;
const ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export function useTTS(voiceId?: string): TTSControls {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [duration, setDuration] = useState<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const urlRef = useRef<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const cleanup = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (urlRef.current) {
      URL.revokeObjectURL(urlRef.current);
      urlRef.current = null;
    }
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
  }, []);

  const stop = useCallback(() => {
    cleanup();
    setIsPlaying(false);
    setIsLoading(false);
    setDuration(null);
  }, [cleanup]);

  const speak = useCallback((text: string) => {
    cleanup();

    const cleaned = stripMarkdown(text);
    if (!cleaned.trim()) return;

    const controller = new AbortController();
    abortRef.current = controller;
    // Hard cap on the whole request: if elevenlabs-tts stalls, abort so the
    // caller can recover instead of waiting forever.
    const fetchTimer = setTimeout(() => controller.abort(), 15000);
    setIsLoading(true);
    setDuration(null);

    fetch(TTS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: ANON_KEY,
        Authorization: `Bearer ${ANON_KEY}`,
      },
      body: JSON.stringify({ text: cleaned, voiceId }),
      signal: controller.signal,
    })
      .then(async (res) => {
        if (!res.ok) throw new Error(`TTS failed: ${res.status}`);
        if (!res.body) throw new Error('No response body');

        // Collect ALL chunks before playing
        const reader = res.body.getReader();
        const chunks: Uint8Array[] = [];
        let totalSize = 0;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          chunks.push(value);
          totalSize += value.length;
        }

        // Empty body: bail out, but release the loading state first — returning
        // here without it left the spinner up permanently.
        if (totalSize === 0) {
          setIsLoading(false);
          return;
        }

        const combined = new Uint8Array(totalSize);
        let offset = 0;
        for (const chunk of chunks) {
          combined.set(chunk, offset);
          offset += chunk.length;
        }
        const blob = new Blob([combined], { type: 'audio/mpeg' });
        const url = URL.createObjectURL(blob);
        urlRef.current = url;
        const audio = new Audio(url);
        audioRef.current = audio;

        // Wait for metadata to get duration — capped. Without the cap, an audio
        // blob whose metadata never loads leaves this promise pending forever,
        // isLoading stuck on true, and (in voice-sync mode) the message text
        // hidden behind the "preparing" spinner indefinitely.
        await new Promise<void>((resolve) => {
          const metaTimer = setTimeout(resolve, 5000);
          const done = () => {
            clearTimeout(metaTimer);
            resolve();
          };
          audio.onloadedmetadata = done;
          // fallback if metadata already loaded
          if (audio.readyState >= 1) done();
        });

        setDuration(audio.duration);

        audio.onplay = () => {
          setIsLoading(false);
          setIsPlaying(true);
        };
        audio.onended = () => {
          setIsPlaying(false);
          setDuration(null);
          cleanup();
        };
        audio.onerror = () => {
          setIsPlaying(false);
          setIsLoading(false);
          setDuration(null);
          cleanup();
        };

        // play() returns a promise that rejects on autoplay policy or a decode
        // failure. Unhandled, onplay never fires and isLoading stays true.
        audio.play().catch((err) => {
          console.warn('TTS_PLAYBACK_FAILED', err?.name ?? err);
          setIsLoading(false);
          setIsPlaying(false);
        });
      })
      .catch((err) => {
        if (err.name !== 'AbortError') {
          console.error('TTS error:', err);
        }
        setIsLoading(false);
        setIsPlaying(false);
        setDuration(null);
      })
      .finally(() => clearTimeout(fetchTimer));
  }, [cleanup, voiceId]);

  // Listen for global stop event
  useEffect(() => {
    const handleGlobalStop = () => stop();
    window.addEventListener('stopAllTTS', handleGlobalStop);
    return () => window.removeEventListener('stopAllTTS', handleGlobalStop);
  }, [stop]);

  // Cleanup on unmount
  useEffect(() => {
    return () => cleanup();
  }, [cleanup]);

  return { speak, stop, isPlaying, isLoading, isSupported: true, duration };
}
