import { useCallback, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type HandoffSource =
  | "auto-tag"
  | "message-link"
  | "banner"
  | "map"
  | "card"
  | "suggested-banner";

type Status = "emitted" | "opened" | "failed";

interface HandoffManagerOptions {
  isMobile: boolean;
  conversationId?: string | null;
  onActivate: (botKey: string) => void;
  iframeRef: React.RefObject<HTMLIFrameElement | null>;
  /**
   * If the user types a new message back to the mentor within this many ms
   * of a handoff *without* the iframe firing onLoad, we mark the handoff
   * as failed and surface the retry banner.
   */
  failureWindowMs?: number;
}

export interface HandoffState {
  pendingKey: string | null;
  failedKey: string | null;
}

const logEvent = async (
  bot_key: string,
  source: HandoffSource,
  status: Status,
  conversation_id?: string | null,
) => {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.access_token) return;
    await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/mentor-handoff-log`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ bot_key, source, status, conversation_id: conversation_id ?? null }),
      keepalive: true,
    });
  } catch (e) {
    console.warn("[handoff-log] failed", e);
  }
};

export function useHandoffManager({
  isMobile,
  conversationId,
  onActivate,
  iframeRef,
  failureWindowMs = 60_000,
}: HandoffManagerOptions) {
  const [state, setState] = useState<HandoffState>({ pendingKey: null, failedKey: null });
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);

  const lastHandoffAtRef = useRef<number>(0);
  const lastHandoffKeyRef = useRef<string | null>(null);
  const lastHandoffSourceRef = useRef<HandoffSource | null>(null);
  const iframeLoadedRef = useRef<boolean>(false);

  const triggerHandoff = useCallback(
    (botKey: string, source: HandoffSource) => {
      if (!botKey) return;
      lastHandoffAtRef.current = Date.now();
      lastHandoffKeyRef.current = botKey;
      lastHandoffSourceRef.current = source;
      iframeLoadedRef.current = false;

      setState({ pendingKey: botKey, failedKey: null });
      onActivate(botKey);
      if (isMobile) setMobileSheetOpen(true);

      void logEvent(botKey, source, "emitted", conversationId);

      // Center the iframe on screen (desktop). Two rAFs so React commits and
      // the iframe is in the DOM before we scroll.
      if (!isMobile) {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            iframeRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
          });
        });
      }
    },
    [conversationId, iframeRef, isMobile, onActivate],
  );

  const handleIframeLoad = useCallback(() => {
    iframeLoadedRef.current = true;
    if (lastHandoffKeyRef.current) {
      void logEvent(
        lastHandoffKeyRef.current,
        lastHandoffSourceRef.current ?? "auto-tag",
        "opened",
        conversationId,
      );
    }
  }, [conversationId]);

  const notifyUserSentMentorMessage = useCallback(() => {
    const pending = lastHandoffKeyRef.current;
    if (!pending) return;
    const elapsed = Date.now() - lastHandoffAtRef.current;
    if (elapsed > failureWindowMs) return;
    if (iframeLoadedRef.current) return;

    void logEvent(pending, lastHandoffSourceRef.current ?? "auto-tag", "failed", conversationId);
    setState({ pendingKey: pending, failedKey: pending });
    lastHandoffKeyRef.current = null;
  }, [conversationId, failureWindowMs]);

  const dismissFailure = useCallback(() => {
    setState((s) => ({ ...s, failedKey: null }));
  }, []);

  const retry = useCallback(() => {
    const key = state.failedKey;
    if (!key) return;
    setState((s) => ({ ...s, failedKey: null }));
    triggerHandoff(key, "banner");
  }, [state.failedKey, triggerHandoff]);

  const closeMobileSheet = useCallback(() => {
    setMobileSheetOpen(false);
  }, []);

  const resetForClose = useCallback(() => {
    lastHandoffKeyRef.current = null;
    lastHandoffSourceRef.current = null;
    iframeLoadedRef.current = false;
    setState({ pendingKey: null, failedKey: null });
    setMobileSheetOpen(false);
  }, []);

  return {
    state,
    triggerHandoff,
    handleIframeLoad,
    notifyUserSentMentorMessage,
    dismissFailure,
    retry,
    mobileSheetOpen,
    setMobileSheetOpen,
    closeMobileSheet,
    resetForClose,
  };
}
