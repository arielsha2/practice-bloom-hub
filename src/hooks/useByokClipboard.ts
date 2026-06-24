import { useEffect, useRef, useState } from "react";

/** Matches a Google Gemini API key shape (starts with AIza, 35+ chars typical). */
export const isLikelyGeminiKey = (raw: string) => /^AIza[A-Za-z0-9_-]{30,}$/.test(raw.trim());

interface UseByokClipboardOptions {
  /** Current input value — we won't override if user already typed something. */
  currentValue: string;
  /** Called with the detected key when found. */
  onDetected: (key: string) => void;
}

/**
 * Tries to auto-detect a Gemini key from the clipboard after the user opens Google AI Studio.
 *
 * Chrome: works automatically on window focus (after permission granted in a user gesture).
 * Safari/Firefox: blocks programmatic clipboard reads. We expose `needsManualPaste` after
 * a 3s grace period so the UI can show a manual "Paste" button.
 */
export function useByokClipboard({ currentValue, onDetected }: UseByokClipboardOptions) {
  const [armed, setArmed] = useState(false); // true after user clicked "Open Google AI Studio"
  const [needsManualPaste, setNeedsManualPaste] = useState(false);
  const detectedRef = useRef(false);

  // Call this inside the click handler that opens Google AI Studio.
  // Doing the readText() here (in a user gesture) primes the permission for later focus events.
  const arm = async () => {
    setArmed(true);
    setNeedsManualPaste(false);
    detectedRef.current = false;
    try {
      // Prime permission — value at this moment likely isn't the key yet.
      await navigator.clipboard?.readText();
    } catch {
      // permission denied / unsupported — manual fallback will kick in
    }
  };

  // Auto-detect on focus return (Chrome path).
  useEffect(() => {
    if (!armed) return;
    let graceTimer: ReturnType<typeof setTimeout> | null = null;

    const tryRead = async () => {
      if (detectedRef.current) return;
      try {
        const text = (await navigator.clipboard.readText()).trim();
        if (isLikelyGeminiKey(text) && !currentValue) {
          detectedRef.current = true;
          setNeedsManualPaste(false);
          onDetected(text);
        }
      } catch {
        // Safari/Firefox path — silent
      }
    };

    const onFocus = () => {
      tryRead();
      // Show manual paste fallback after 3s if nothing was detected.
      if (graceTimer) clearTimeout(graceTimer);
      graceTimer = setTimeout(() => {
        if (!detectedRef.current && !currentValue) setNeedsManualPaste(true);
      }, 3000);
    };

    window.addEventListener("focus", onFocus);
    return () => {
      window.removeEventListener("focus", onFocus);
      if (graceTimer) clearTimeout(graceTimer);
    };
  }, [armed, currentValue, onDetected]);

  // Manual paste button handler (user gesture — works in all browsers).
  const pasteFromClipboard = async (): Promise<boolean> => {
    try {
      const text = (await navigator.clipboard.readText()).trim();
      if (isLikelyGeminiKey(text)) {
        detectedRef.current = true;
        setNeedsManualPaste(false);
        onDetected(text);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  return { armed, arm, needsManualPaste, pasteFromClipboard };
}
