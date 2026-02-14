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
}

const TTS_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/elevenlabs-tts`;
const ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export function useTTS(voiceId?: string): TTSControls {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
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
  }, [cleanup]);

  const speak = useCallback((text: string) => {
    // Stop any current playback
    cleanup();

    const cleaned = stripMarkdown(text);
    if (!cleaned.trim()) return;

    const controller = new AbortController();
    abortRef.current = controller;
    setIsLoading(true);

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
      .then((res) => {
        if (!res.ok) throw new Error(`TTS failed: ${res.status}`);
        return res.blob();
      })
      .then((blob) => {
        const url = URL.createObjectURL(blob);
        urlRef.current = url;
        const audio = new Audio(url);
        audioRef.current = audio;

        audio.onplay = () => {
          setIsLoading(false);
          setIsPlaying(true);
        };
        audio.onended = () => {
          setIsPlaying(false);
          cleanup();
        };
        audio.onerror = () => {
          setIsPlaying(false);
          setIsLoading(false);
          cleanup();
        };

        audio.play();
      })
      .catch((err) => {
        if (err.name !== 'AbortError') {
          console.error('TTS error:', err);
        }
        setIsLoading(false);
        setIsPlaying(false);
      });
  }, [cleanup]);

  // Listen for global stop event (e.g. when user sends a new message)
  useEffect(() => {
    const handleGlobalStop = () => stop();
    window.addEventListener('stopAllTTS', handleGlobalStop);
    return () => window.removeEventListener('stopAllTTS', handleGlobalStop);
  }, [stop]);

  // Cleanup on unmount
  useEffect(() => {
    return () => cleanup();
  }, [cleanup]);

  return { speak, stop, isPlaying, isLoading, isSupported: true };
}
