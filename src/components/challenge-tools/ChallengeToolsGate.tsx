import { lazy, Suspense } from "react";
import type { ReactNode } from "react";
import { useAdminNav } from "@/components/landing/ExpertsAdminTab";
import { CHALLENGE_TOOLS_OPEN } from "@/lib/challengeRound";

// Wraps the two challenge tool routes. While no challenge is running (src/lib/challengeRound.ts) anyone but the
// admin sees "the challenge has ended" and the way to the next one instead of the tool: no sign-up redirect and no
// download of the tool itself (the closed page is its own small chunk, the tool chunks load only when it opens).
const Closed = lazy(() => import("@/pages/ChallengeToolsClosed"));

export function ChallengeToolsGate({ tool, children }: { tool: "card" | "letter"; children: ReactNode }) {
  const { isAdmin, isLoading } = useAdminNav();
  if (CHALLENGE_TOOLS_OPEN) return <>{children}</>;
  if (isLoading) return null; // a moment, only while a signed-in visitor's admin check runs
  if (isAdmin) return <>{children}</>;
  return (
    <Suspense fallback={null}>
      <Closed tool={tool} />
    </Suspense>
  );
}
