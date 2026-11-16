// Counts the steps on the way into a challenge tool (admin card "המשפך לתרגיל כרטיס הביקור"):
// where people drop off between opening the homework link and finishing. One row per step per tab
// session; the visitor id is the same random browser id the challenge pages use, nothing identifying.
// Never throws and never blocks the page.
import { supabase } from "@/integrations/supabase/client";
import { challengeVisitorId, randomId } from "@/lib/challengeSource";

export type FunnelStep =
  | "landed_signed_out" // opened the link while signed out (sent on to sign in)
  | "landed_signed_in" // opened the link signed in (also the return after signing in)
  | "auth_shown" // the sign-in / sign-up screen, on the way to the tool
  | "code_sent" // the e-mail code was sent
  | "code_send_failed" // sending the code failed
  | "code_wrong" // the code entered was wrong or expired
  | "signed_in" // the code was accepted
  | "questions_shown" // the first screen of the exercise
  | "tool_done" // the card was made (day 2: the four lines and the letter were summed up)
  | "chat_started" // day 2: sent a first message to Neri
  | "draft_written" // day 2: Neri wrote the first draft of the letter
  | "whatsapp_click"; // pressed "send the card to Eliana" (opens WhatsApp; whether they then pressed send there is unknowable)

export const CARD_TOOL = "professional-card";
export const LETTER_TOOL = "personal-note"; // day 2: the mirror (until 16.11.2026: the four lines and a letter)

export function logToolStep(step: FunnelStep, tool: string = CARD_TOOL) {
  try {
    const onceKey = `tool_funnel:${tool}:${step}`;
    try {
      if (sessionStorage.getItem(onceKey)) return;
      sessionStorage.setItem(onceKey, "1");
    } catch {
      // storage blocked: may count twice, still better than not at all
    }
    const visitor_id = challengeVisitorId() ?? randomId();
    let source: string | null = null;
    try {
      source = sessionStorage.getItem("challenge_source");
    } catch {
      // ignore
    }
    void supabase
      .from("challenge_tool_funnel")
      .insert({ tool, step, visitor_id, source })
      .then(({ error }) => {
        if (error) console.warn("tool step not recorded", error.message);
      });
  } catch {
    // never break the page for a counter
  }
}
