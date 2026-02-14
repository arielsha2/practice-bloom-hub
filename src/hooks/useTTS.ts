import { useState, useEffect, useRef, useCallback } from 'react';

function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/\[STAGE:\d\]\s*/g, '')
    .replace(/\[DIFFICULTY:\w+\]\s*/g, '');
}

function getHebrewVoice(): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices();
  return (
    voices.find(v => v.lang === 'he-IL') ||
    voices.find(v => v.lang.startsWith('he')) ||
    null
  );
}

export interface TTSControls {
  speak: (text: string) => void;
  stop: () => void;
  isPlaying: boolean;
  isSupported: boolean;
}

export function useTTS(lang = 'he-IL'): TTSControls {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSupported] = useState(() => typeof window !== 'undefined' && 'speechSynthesis' in window);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const stop = useCallback(() => {
    if (isSupported) {
      window.speechSynthesis.cancel();
    }
    setIsPlaying(false);
  }, [isSupported]);

  const speak = useCallback((text: string) => {
    if (!isSupported) return;

    // Stop any current speech
    window.speechSynthesis.cancel();

    const cleaned = stripMarkdown(text);
    if (!cleaned.trim()) return;

    const utterance = new SpeechSynthesisUtterance(cleaned);
    utterance.lang = lang;
    utterance.rate = 1;
    utterance.pitch = 1;

    const voice = getHebrewVoice();
    if (voice) utterance.voice = voice;

    utterance.onstart = () => setIsPlaying(true);
    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, [isSupported, lang]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isSupported) {
        window.speechSynthesis.cancel();
      }
    };
  }, [isSupported]);

  // Preload voices (some browsers load them async)
  useEffect(() => {
    if (isSupported && window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = () => {};
    }
  }, [isSupported]);

  return { speak, stop, isPlaying, isSupported };
}
