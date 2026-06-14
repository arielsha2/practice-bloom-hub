import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

type SaveStatus = "idle" | "saving" | "saved" | "error";

export function useMentorNotebook() {
  const { user } = useAuth();
  const [content, setContent] = useState<string>("");
  const [loaded, setLoaded] = useState(false);
  const [status, setStatus] = useState<SaveStatus>("idle");
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedRef = useRef<string>("");

  // Load on mount / user change
  useEffect(() => {
    if (!user) {
      setLoaded(true);
      return;
    }
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("mentor_notebooks" as any)
        .select("content, updated_at")
        .eq("user_id", user.id)
        .maybeSingle();
      if (cancelled) return;
      const c = (data as any)?.content ?? "";
      setContent(c);
      lastSavedRef.current = c;
      setUpdatedAt((data as any)?.updated_at ?? null);
      setLoaded(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const persist = useCallback(
    async (next: string) => {
      if (!user) return;
      setStatus("saving");
      const { data, error } = await (supabase
        .from("mentor_notebooks" as any) as any)
        .upsert(
          { user_id: user.id, content: next, updated_at: new Date().toISOString() },
          { onConflict: "user_id" },
        )
        .select("updated_at")
        .single();
      if (error) {
        setStatus("error");
        return;
      }
      lastSavedRef.current = next;
      setUpdatedAt((data as any)?.updated_at ?? new Date().toISOString());
      setStatus("saved");
    },
    [user],
  );

  // Auto-save with debounce
  useEffect(() => {
    if (!loaded || !user) return;
    if (content === lastSavedRef.current) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      persist(content);
    }, 1500);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [content, loaded, user, persist]);

  const appendEntry = useCallback(
    async (body: string, stageLabel?: string | null) => {
      const now = new Date();
      const dateStr = now.toLocaleString("he-IL", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
      const header = stageLabel ? `📅 ${dateStr} · ${stageLabel}` : `📅 ${dateStr}`;
      const block = `\n\n---\n${header}\n${body.trim()}\n`;
      const next = (content || "").trimEnd() + block;
      setContent(next);
      // Persist immediately for appends — don't wait for debounce
      if (debounceRef.current) clearTimeout(debounceRef.current);
      await persist(next);
    },
    [content, persist],
  );

  return {
    content,
    setContent,
    loaded,
    status,
    updatedAt,
    appendEntry,
  };
}
