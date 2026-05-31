import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { SEOHead } from "@/components/SEOHead";
import { Footer } from "@/components/landing/Footer";

function MentorTopBar() {
  const { isRTL } = useLanguage();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-primary shadow-card" dir={isRTL ? "rtl" : "ltr"}>
      <nav className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <span className="text-xl font-bold text-primary-foreground tracking-tight">Turning Point</span>
        </Link>
        <div>
          {user ? (
            <Button variant="header-ghost" size="sm" onClick={handleSignOut} className="font-medium">
              <LogOut className="w-4 h-4 me-1" />
              {isRTL ? "התנתקות" : "Log out"}
            </Button>
          ) : (
            <Link to="/auth">
              <Button variant="header-ghost" size="sm" className="font-medium">
                <LogIn className="w-4 h-4 me-1" />
                {isRTL ? "התחברות" : "Log in"}
              </Button>
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useLanguage } from "@/contexts/LanguageContext";
import { Send, Sparkles, Target, TrendingUp, Heart, Clock, Users2, CheckCircle2, MessageCircle, X, ArrowRight, ArrowLeft, Map as MapIcon, LogIn, LogOut } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useHasMentorAccess } from "@/hooks/useHasMentorAccess";
import { useNavigate, useSearchParams } from "react-router-dom";
import { JourneyMap } from "@/components/mentor/JourneyMap";
import { FinalCelebration } from "@/components/mentor/FinalCelebration";
import { useTherapistJourney } from "@/hooks/useTherapistJourney";
import { ResetMentorButton } from "@/components/mentor/ResetMentorButton";

function WebsiteBuilderCTA() {
  const { journey } = useTherapistJourney();
  const navigate = useNavigate();
  const [site, setSite] = useState<{ slug: string; is_published: boolean } | null>(null);
  useEffect(() => {
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return;
      const { data } = await supabase
        .from("therapist_websites")
        .select("slug, is_published")
        .eq("user_id", auth.user.id)
        .maybeSingle();
      if (data) setSite(data);
    })();
  }, [journey?.self_presentation_output]);

  // Only show this card once the user has actually published a site.
  // Pre-publish CTA now lives inside <FinalCelebration />.
  if (!site?.is_published) return null;

  return (
    <div dir="rtl" className="max-w-3xl mx-auto mt-6 bg-card border border-mentor-border/60 rounded-2xl p-6 shadow-sm text-center">
      <h3 className="text-lg font-serif font-semibold mb-2">הכרטיס הדיגיטלי שלך</h3>
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">הדף שלך חי בכתובת:</p>
        <div className="flex items-center justify-center gap-2">
          <a href={`/t/${site.slug}`} target="_blank" rel="noreferrer" className="text-mentor-accent font-semibold hover:underline">
            /t/{site.slug}
          </a>
          <button
            onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/t/${site.slug}`); toast.success("הקישור הועתק"); }}
            className="text-xs px-2 py-1 rounded border hover:bg-accent"
          >
            העתק
          </button>
        </div>
        <Button variant="outline" size="sm" onClick={() => navigate("/mentor/website-builder")}>ערוך את הדף</Button>
      </div>
    </div>
  );
}

const MENTOR_SALES_URL = "https://meshulam.co.il/s/7e0acf30-e444-60ce-c935-fc7bfe8b7510";

/**
 * Upsert the current user's mentor journey progress.
 * Appends `stuck_point` to the existing array (no overwrite) and updates step + reflection.
 */
export async function updateTherapistProgress(
  step_number: number,
  stuck_point: string,
  reflection: Record<string, unknown>
) {
  const { data: auth } = await supabase.auth.getUser();
  const user = auth.user;
  if (!user) return { data: null, error: new Error("Not authenticated") };

  const { data: existing } = await supabase
    .from("therapist_journeys")
    .select("stuck_points")
    .eq("user_id", user.id)
    .maybeSingle();

  const merged = [...((existing?.stuck_points as string[] | null) ?? [])];
  if (stuck_point && stuck_point.trim()) merged.push(stuck_point);

  const { data, error } = await supabase
    .from("therapist_journeys")
    .upsert(
      {
        user_id: user.id,
        step_number,
        stuck_points: merged,
        reflection: reflection as any,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    )
    .select()
    .single();

  return { data, error };
}

type Msg = { role: "user" | "assistant"; content: string };

const BENEFITS_HE = [
  { icon: Target, title: "בהירות מקצועית", desc: "תדעו בדיוק מי המטופל שלכם וכיצד לדבר אליו." },
  { icon: TrendingUp, title: "קליניקה מלאה", desc: "יותר פניות איכותיות שהופכות למטופלים קבועים." },
  { icon: Heart, title: "ביטחון פנימי", desc: "להפסיק להתלבט על מחיר, ניסוח ועצם השיווק." },
  { icon: Clock, title: "חיסכון בזמן", desc: "תשובות ממוקדות במקום שעות של ניסוי וטעייה." },
  { icon: Users2, title: "רשת מקצועית", desc: "אנשי קשר ושותפויות שמזרימים אליכם פניות." },
];

const BENEFITS_EN = [
  { icon: Target, title: "Professional Clarity", desc: "Know exactly who your client is and how to speak to them." },
  { icon: TrendingUp, title: "A Full Practice", desc: "More quality inquiries that convert into committed clients." },
  { icon: Heart, title: "Inner Confidence", desc: "Stop second-guessing your pricing, copy, and marketing." },
  { icon: Clock, title: "Save Time", desc: "Focused answers instead of hours of trial and error." },
  { icon: Users2, title: "A Professional Network", desc: "Referral contacts and partnerships that send you clients." },
];

const OUTCOMES_HE = [
  "יומן עמוס במטופלים שמתאימים לכם",
  "מחיר שמשקף את הערך האמיתי שלכם",
  "מסר שיווקי שמושך את האנשים הנכונים",
  "פחות התלבטות, יותר פעולה",
  "קליניקה שמתפרנסת בכבוד",
];

const OUTCOMES_EN = [
  "A calendar full of clients who fit you",
  "Pricing that reflects your real value",
  "A marketing message that attracts the right people",
  "Less second-guessing, more action",
  "A practice that earns with dignity",
];

const STARTERS_HE = [
  "הקליניקה שלי לא מתמלאת — מאיפה מתחילים?",
  "קשה לי לדבר על כסף עם מטופלים",
  "המטופלים שמגיעים אליי לא תמיד מתאימים",
  "אני לא יודע/ת איך להסביר מה אני עושה",
];

const STARTERS_EN = [
  "My practice isn't filling up — where do I start?",
  "It's hard for me to talk about money with clients",
  "The clients reaching out aren't always the right fit",
  "I don't know how to explain what I do",
];

export default function Mentor() {
  const { isRTL, language } = useLanguage();
  const navigate = useNavigate();
  const { hasAccess, loading: accessLoading } = useHasMentorAccess();
  const { journey, refresh: refreshJourney } = useTherapistJourney();
  const journeyRef = useRef(journey);
  useEffect(() => { journeyRef.current = journey; }, [journey]);
  const [searchParams, setSearchParams] = useSearchParams();

  const benefits = language === "he" ? BENEFITS_HE : BENEFITS_EN;
  const outcomes = language === "he" ? OUTCOMES_HE : OUTCOMES_EN;
  const starters = language === "he" ? STARTERS_HE : STARTERS_EN;

  const storageKey = `mentor-chat:${language}`;

  const [messages, setMessages] = useState<Msg[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const raw = localStorage.getItem(`mentor-chat:${language}`);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [activeBotKey, setActiveBotKey] = useState<string | null>(null);
  const [pendingReturn, setPendingReturn] = useState<{
    botKey: string;
    toolName: string;
    summary: string;
    kickoff: string;
  } | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  // Map of known AI tool URLs -> bot keys
  const BOT_KEYS = ["connection-bridge", "niche-finder", "self-presentation", "contact-finder", "pricing-calculator", "strategy-planner", "content-creator"];

  const extractBotKey = (href: string): string | null => {
    try {
      const u = new URL(href, window.location.origin);
      const m = u.pathname.match(/\/ai-assistants\/([^\/?#]+)/);
      if (m && BOT_KEYS.includes(m[1])) return m[1];
    } catch {}
    return null;
  };

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Persist messages to localStorage so the chat survives reloads / dialog close.
  useEffect(() => {
    try {
      if (messages.length === 0) {
        localStorage.removeItem(storageKey);
      } else {
        localStorage.setItem(storageKey, JSON.stringify(messages));
      }
    } catch {
      // ignore quota / privacy mode errors
    }
  }, [messages, storageKey]);

  // When language switches, load that language's saved conversation (or empty).
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      const parsed = raw ? JSON.parse(raw) : [];
      setMessages(Array.isArray(parsed) ? parsed : []);
    } catch {
      setMessages([]);
    }
    setInput("");
  }, [language, storageKey]);

  // Handle return from a bot tool: ?from=<botKey>
  const handledFromRef = useRef(false);
  useEffect(() => {
    const from = searchParams.get("from");
    if (!from || handledFromRef.current) return;
    handledFromRef.current = true;

    const BOT_NAMES_HE: Record<string, string> = {
      "niche-finder": "Niche Finder",
      "self-presentation": "Self Presentation",
      "pricing-calculator": "Pricing Calculator",
      "connection-bridge": "Connection Bridge",
      "contact-finder": "Contact Finder",
      "strategy-planner": "Strategy Planner",
      "content-creator": "Content Creator",
    };
    const toolName = BOT_NAMES_HE[from] ?? from;

    (async () => {
      await refreshJourney();
      const j = journeyRef.current;

      // Build a human-readable summary from whatever the extractor saved
      let summary = "";
      if (from === "niche-finder" && j?.niche_output) {
        const n: any = j.niche_output;
        const parts = [
          n.ideal_client && (isRTL ? `מטופל אידיאלי: ${n.ideal_client}` : `Ideal client: ${n.ideal_client}`),
          n.core_pain && (isRTL ? `הכאב המרכזי: ${n.core_pain}` : `Core pain: ${n.core_pain}`),
          n.transformation && (isRTL ? `הטרנספורמציה: ${n.transformation}` : `Transformation: ${n.transformation}`),
          n.handshake_version && (isRTL ? `ניסוח לחיצת יד: ${n.handshake_version}` : `Handshake: ${n.handshake_version}`),
        ].filter(Boolean);
        summary = parts.join("\n");
      } else if (from === "self-presentation" && j?.self_presentation_output) {
        const s: any = j.self_presentation_output;
        const parts = [
          s.story_version && (isRTL ? `הסיפור: ${s.story_version}` : `Story: ${s.story_version}`),
          s.internal_pain && (isRTL ? `כאב פנימי: ${s.internal_pain}` : `Internal pain: ${s.internal_pain}`),
          s.external_pain && (isRTL ? `כאב חיצוני: ${s.external_pain}` : `External pain: ${s.external_pain}`),
          s.desire && (isRTL ? `הכמיהה: ${s.desire}` : `Desire: ${s.desire}`),
          s.result && (isRTL ? `התוצאה: ${s.result}` : `Result: ${s.result}`),
        ].filter(Boolean);
        summary = parts.join("\n");
      } else {
        const ts = (j?.reflection as any)?.tool_summaries?.[from];
        if (ts?.summary) summary = ts.summary;
      }

      if (!summary) {
        summary = isRTL
          ? "לא נשמר סיכום אוטומטי לכלי הזה. תוכלו לספר למנטור במילים שלכם."
          : "No automatic summary was saved for this tool. You can tell the Mentor in your own words.";
      }

      const kickoff = isRTL
        ? `חזרתי עכשיו מהכלי ${toolName}. הנה הסיכום:\n\n${summary}\n\nמה הצעד הבא לאור מה שעלה שם?`
        : `I just came back from the ${toolName} tool. Here's the summary:\n\n${summary}\n\nWhat's the next step based on what came up there?`;

      setPendingReturn({ botKey: from, toolName, summary, kickoff });

      // Clear the URL param
      const next = new URLSearchParams(searchParams);
      next.delete("from");
      setSearchParams(next, { replace: true });
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const confirmPendingReturn = () => {
    if (!pendingReturn) return;
    const kickoff = pendingReturn.kickoff;
    setPendingReturn(null);
    setChatOpen(true);
    setTimeout(() => { send(kickoff); }, 100);
  };

  const send = async (text: string) => {
    if (!text.trim() || isLoading) return;
    const userMsg: Msg = { role: "user", content: text.trim() };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setIsLoading(true);

    try {
      const j = journeyRef.current;
      const journey_context = j
        ? {
            niche_output: j.niche_output,
            self_presentation_output: j.self_presentation_output,
            completed_stages: j.completed_stages,
            tool_summaries: (j.reflection as any)?.tool_summaries ?? null,
          }
        : null;
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/mentor-chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next, language, journey_context }),
      });

      if (!resp.ok || !resp.body) {
        if (resp.status === 429) toast.error(isRTL ? "יותר מדי בקשות, נסו שוב בעוד רגע" : "Rate limited, try again soon");
        else if (resp.status === 402) toast.error(isRTL ? "נגמרו הקרדיטים, פנו למנהל" : "Credits exhausted");
        else toast.error(isRTL ? "שגיאה בשליחה" : "Send failed");
        setIsLoading(false);
        return;
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let assistant = "";
      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let idx: number;
        while ((idx = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, idx);
          buffer = buffer.slice(idx + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (json === "[DONE]") continue;
          try {
            const parsed = JSON.parse(json);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) {
              assistant += delta;
              setMessages((prev) =>
                prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistant } : m))
              );
            }
          } catch {
            buffer = line + "\n" + buffer;
            break;
          }
        }
      }
    } catch (e) {
      console.error(e);
      toast.error(isRTL ? "שגיאת רשת" : "Network error");
    } finally {
      setIsLoading(false);
      // Fire-and-forget: analyze the conversation and persist completed stages.
      try {
        const { data: auth } = await supabase.auth.getUser();
        if (auth.user) {
          const analyzeResp = await fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/mentor-analyze`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                messages: [...messages, { role: "user", content: text.trim() }],
              }),
            }
          );
          if (analyzeResp.ok) {
            const { completed, current, stuck_point } = await analyzeResp.json();
            const stageMap: Record<string, number> = {
              niche: 1, pricing: 2, "self-presentation": 3, network: 4, conversion: 5,
            };
            const stepNumber = stageMap[current] ?? 1;
            const { data: existing } = await supabase
              .from("therapist_journeys")
              .select("stuck_points")
              .eq("user_id", auth.user.id)
              .maybeSingle();
            const merged = [...((existing?.stuck_points as string[] | null) ?? [])];
            if (stuck_point && stuck_point.trim() && !merged.includes(stuck_point)) {
              merged.push(stuck_point);
            }
            await supabase.from("therapist_journeys").upsert(
              {
                user_id: auth.user.id,
                step_number: stepNumber,
                stuck_points: merged,
                completed_stages: completed ?? [],
                reflection: { current } as any,
                updated_at: new Date().toISOString(),
              },
              { onConflict: "user_id" }
            );
            window.dispatchEvent(new CustomEvent("therapist-journey-updated"));
          }
        }
      } catch (err) {
        console.warn("mentor-analyze failed", err);
      }
    }
  };

  const showWelcome = messages.length === 0;

  // Access gate: render a paywall dialog for users without mentor access.
  if (!accessLoading && hasAccess === false) {
    return (
      <div dir={isRTL ? "rtl" : "ltr"} className="min-h-screen flex flex-col bg-mentor-bg">
        <MentorTopBar />
        <main className="flex-1 pt-16 flex items-center justify-center px-4">
          <div className="max-w-lg w-full bg-card border-2 border-mentor-accent/30 rounded-2xl p-8 shadow-xl text-center">
            <div className="w-14 h-14 mx-auto rounded-full bg-mentor-accent/15 flex items-center justify-center mb-4">
              <Sparkles className="w-6 h-6 text-mentor-accent" />
            </div>
            <h1 className="text-xl md:text-2xl font-serif font-semibold text-foreground mb-3">
              {isRTL ? "המנטור פתוח לרוכשים בלבד" : "The Mentor is for purchasers only"}
            </h1>
            <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
              {isRTL
                ? "כדי להיכנס לשיחה עם המנטור, יש לרכוש גישה. סטודנטים בנקודת המפנה יכולים להשתמש בבוטים דרך עמוד הקורס."
                : "To chat with the Mentor, please purchase access. Turning Point students can use the bots from the course page."}
            </p>
            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              <Button
                size="lg"
                onClick={() => window.open(MENTOR_SALES_URL, "_blank", "noopener,noreferrer")}
                className="bg-mentor-accent hover:bg-mentor-accent/90 text-mentor-accent-foreground"
              >
                {isRTL ? "לרכישת המנטור" : "Purchase the Mentor"}
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate("/")}>
                {isRTL ? "חזרה לדף הבית" : "Back to home"}
              </Button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div dir={isRTL ? "rtl" : "ltr"} className="min-h-screen flex flex-col bg-mentor-bg">
      <SEOHead
        title='המנטור | ליווי AI אישי למטפלים — TherapyKeys'
        description='מנטור AI מבוסס שיטת "על שפת הקליניקה" של ד"ר אריאל שפירא. ליווי אישי לאיתור נישה, תמחור, שיווק ובניית קליניקה פרטית למטפלים בישראל.'
        canonicalUrl="/mentor"
      />
      <MentorTopBar />
      <main className="flex-1 pt-16">
        <section className="py-3 md:py-4 border-b border-mentor-border/50">
          <div className="container mx-auto px-4 text-center max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-mentor-accent/10 border border-mentor-accent/30 rounded-full px-3 py-1 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-mentor-accent" />
              <span className="text-mentor-accent font-medium text-xs">
                {isRTL ? "המנטור" : "The Mentor"}
              </span>
            </div>
            <h1 className="text-xl md:text-2xl font-serif font-medium text-foreground mb-1 tracking-tight">
              {isRTL ? "קליניקה מלאה. ראש שקט. צמיחה אמיתית." : "A Full Practice. A Calm Mind. Real Growth."}
            </h1>
            <p className="text-xs md:text-sm text-muted-foreground">
              {isRTL
                ? "בן הזוג האסטרטגי שלכם — שותף שמחדד החלטות ועוזר להפוך מטפל מצוין לקליניקה משגשגת."
                : "Your strategic partner — sharpening decisions and turning a great therapist into a thriving practice."}
            </p>
          </div>
        </section>

        <section id="journey-map" className="container mx-auto px-4 py-8 md:py-12 border-b border-mentor-border/40 scroll-mt-20">
          <div className="max-w-5xl mx-auto mb-4 flex justify-end">
            <ResetMentorButton />
          </div>
          <JourneyMap onOpenBot={(botKey) => { setActiveBotKey(botKey); setChatOpen(true); }} />
          <FinalCelebration />
          
        </section>

        <section className="container mx-auto px-4 py-6 md:py-8">
          {/* Returned-from-tool confirmation card */}
          {pendingReturn && (
            <div
              ref={(el) => el?.scrollIntoView({ behavior: "smooth", block: "center" })}
              dir={isRTL ? "rtl" : "ltr"}
              className="max-w-3xl mx-auto mb-6 bg-mentor-accent/5 border-2 border-mentor-accent/40 rounded-2xl p-6 shadow-md"
            >
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle2 className="w-5 h-5 text-mentor-accent flex-shrink-0" />
                <h3 className="text-base md:text-lg font-serif font-semibold text-foreground">
                  {isRTL
                    ? `סיימתם לעבוד עם ${pendingReturn.toolName}`
                    : `You finished working with ${pendingReturn.toolName}`}
                </h3>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                {isRTL
                  ? "זה הסיכום שיועבר למנטור. בדקו אותו לפני שתמשיכו את השיחה."
                  : "This is the summary that will be passed to the Mentor. Review it before continuing the conversation."}
              </p>
              <div className="bg-card border border-mentor-border/60 rounded-xl p-4 mb-4 max-h-64 overflow-auto">
                <pre className={`whitespace-pre-wrap text-sm font-sans text-foreground leading-relaxed ${isRTL ? "text-right" : "text-left"}`}>
                  {pendingReturn.summary}
                </pre>
              </div>
              <div className="flex flex-wrap gap-2 justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPendingReturn(null)}
                >
                  {isRTL ? "סגור" : "Dismiss"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/ai-assistants/${pendingReturn.botKey}`)}
                >
                  {isRTL ? "חזרה לכלי" : "Back to tool"}
                </Button>
                <Button
                  size="sm"
                  onClick={confirmPendingReturn}
                  className="bg-mentor-accent hover:bg-mentor-accent/90 text-mentor-accent-foreground gap-1.5"
                >
                  <MessageCircle className="w-4 h-4" />
                  {isRTL ? "המשיכו עם המנטור" : "Continue with the Mentor"}
                </Button>
              </div>
            </div>
          )}

          {/* CTA card — opens the floating chat popup */}
          <div className="max-w-3xl mx-auto bg-card border border-mentor-border/60 rounded-2xl p-6 md:p-8 shadow-sm text-center">
            <div className="w-14 h-14 mx-auto rounded-full bg-mentor-accent/15 flex items-center justify-center mb-4">
              <Sparkles className="w-6 h-6 text-mentor-accent" />
            </div>
            <h2 className="text-lg md:text-xl font-serif font-semibold text-foreground mb-2">
              {messages.length > 0
                ? (isRTL ? "יש לכם שיחה פתוחה עם המנטור" : "You have an active conversation with the Mentor")
                : (isRTL ? "המנטור שלכם מחכה 🌱" : "Your mentor is waiting 🌱")}
            </h2>
            <p className="text-sm text-muted-foreground mb-5">
              {messages.length > 0
                ? (isRTL ? "המשיכו מאיפה שעצרתם, או התחילו שיחה חדשה." : "Pick up where you left off, or start a new conversation.")
                : (isRTL ? "בחרו נושא שמרגיש הכי דחוף — או פשוט כתבו מה על הלב." : "Pick whatever feels most pressing — or just write what's on your heart.")}
            </p>

            {messages.length === 0 && (
              <div className="grid sm:grid-cols-2 gap-2.5 mb-5">
                {starters.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => { setChatOpen(true); send(s); }}
                    className={`text-sm font-medium px-4 py-3 rounded-xl bg-mentor-accent/10 border-2 border-mentor-accent/40 text-foreground hover:bg-mentor-accent hover:text-mentor-accent-foreground hover:border-mentor-accent hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 ${isRTL ? "text-right" : "text-left"}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            <div className="flex flex-wrap items-center justify-center gap-2">
              <Button
                size="lg"
                onClick={() => setChatOpen(true)}
                className="bg-mentor-accent hover:bg-mentor-accent/90 text-mentor-accent-foreground gap-2"
              >
                <MessageCircle className="w-5 h-5" />
                {messages.length > 0
                  ? (isRTL ? "המשיכו את השיחה" : "Continue the conversation")
                  : (isRTL ? "פתחו את הצ'אט" : "Open the chat")}
              </Button>
              {messages.length > 0 && (
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => { setMessages([]); setInput(""); }}
                >
                  {isRTL ? "התחילו שיחה חדשה" : "Start a new conversation"}
                </Button>
              )}
            </div>
          </div>

          {/* Floating chat popup */}
          <Dialog open={chatOpen} onOpenChange={setChatOpen}>
            <DialogContent
              dir={isRTL ? "rtl" : "ltr"}
              className="max-w-3xl w-[95vw] p-0 gap-0 overflow-hidden border-2 border-mentor-accent/30 shadow-2xl rounded-2xl"
            >
              <DialogTitle className="sr-only">{isRTL ? "צ'אט עם המנטור" : "Chat with the Mentor"}</DialogTitle>
              <DialogDescription className="sr-only">
                {isRTL ? "כאן לעזור לכם לחשוב בבהירות 🧭" : "Here to help you think clearly 🧭"}
              </DialogDescription>

              <div className="flex flex-col h-[80vh] max-h-[680px] bg-card">
                <div className="px-5 py-4 border-b border-mentor-border/60 bg-mentor-surface flex items-center gap-3">
                  {activeBotKey && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setActiveBotKey(null)}
                      className="gap-1.5 text-mentor-accent hover:bg-mentor-accent/10"
                    >
                      {isRTL ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
                      {isRTL ? "חזרה למנטור" : "Back to Mentor"}
                    </Button>
                  )}
                  <div className="w-9 h-9 rounded-full bg-mentor-accent/15 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-mentor-accent" />
                  </div>
                  <div className="flex-1">
                    <h2 className="font-serif font-semibold text-foreground leading-tight">
                      {activeBotKey
                        ? (isRTL ? "כלי מהמנטור" : "Mentor's Tool")
                        : (isRTL ? "המנטור" : "The Mentor")}
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      {activeBotKey
                        ? (isRTL ? "השיחה עם המנטור שמורה — תוכלו לחזור אליה בכל רגע" : "Your mentor conversation is saved — return any time")
                        : (isRTL ? "כאן לעזור לכם לחשוב בבהירות 🧭" : "Here to help you think clearly 🧭")}
                    </p>
                  </div>
                  {!activeBotKey && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setChatOpen(false);
                        setTimeout(() => {
                          document.getElementById("journey-map")?.scrollIntoView({ behavior: "smooth", block: "start" });
                        }, 150);
                      }}
                      className="gap-1.5 border-mentor-accent/40 text-mentor-accent hover:bg-mentor-accent hover:text-mentor-accent-foreground"
                    >
                      <MapIcon className="w-4 h-4" />
                      <span className="hidden sm:inline">{isRTL ? "מפת המסע" : "Journey Map"}</span>
                    </Button>
                  )}
                </div>

                {activeBotKey ? (
                  <iframe
                    src={`/ai-assistants/${activeBotKey}`}
                    className="flex-1 w-full border-0 bg-mentor-bg"
                    title={isRTL ? "כלי AI" : "AI tool"}
                  />
                ) : (
                <>
                <ScrollArea className="flex-1 px-5 py-6">
                  <div className="space-y-4 max-w-3xl mx-auto">
                    {showWelcome && (
                      <div className="bg-mentor-surface border border-mentor-border/60 rounded-xl p-5">
                        <p className={`text-foreground leading-relaxed ${isRTL ? "text-right" : "text-left"}`}>
                          {isRTL
                            ? "היי 👋 ספרו לי מה מרגיש תקוע — ונתחיל בדיוק משם. אין תשובות נכונות, רק כנות."
                            : "Hey 👋 tell me what feels stuck — and we'll start right there. No right answers, just honesty."}
                        </p>
                        <div className="grid sm:grid-cols-2 gap-2.5 mt-4">
                          {starters.map((s, i) => (
                            <button
                              key={i}
                              onClick={() => send(s)}
                              className={`text-sm font-medium px-4 py-3 rounded-xl bg-mentor-accent/10 border-2 border-mentor-accent/40 text-foreground hover:bg-mentor-accent hover:text-mentor-accent-foreground hover:border-mentor-accent transition-all duration-200 ${isRTL ? "text-right" : "text-left"}`}
                            >
                              {s}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {messages.map((m, i) => (
                      <div
                        key={i}
                        className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                            m.role === "user"
                              ? "bg-mentor-accent text-mentor-accent-foreground"
                              : "bg-mentor-surface border border-mentor-border/60 text-foreground"
                          }`}
                        >
                          <div
                            dir={isRTL ? "rtl" : "ltr"}
                            className={`prose prose-sm max-w-none prose-p:my-1 prose-ul:my-2 prose-headings:my-2 prose-a:text-mentor-accent ${isRTL ? "text-right" : "text-left"}`}
                          >
                            <ReactMarkdown
                              components={{
                                a: ({ href, children, ...props }) => {
                                  const botKey = href ? extractBotKey(href) : null;
                                  if (botKey) {
                                    return (
                                      <a
                                        {...props}
                                        href={href}
                                        onClick={(e) => {
                                          e.preventDefault();
                                          setActiveBotKey(botKey);
                                        }}
                                        className="cursor-pointer underline"
                                      >
                                        {children}
                                      </a>
                                    );
                                  }
                                  return (
                                    <a {...props} href={href} target="_blank" rel="noopener noreferrer">
                                      {children}
                                    </a>
                                  );
                                },
                              }}
                            >
                              {m.content || "…"}
                            </ReactMarkdown>
                          </div>
                        </div>
                      </div>
                    ))}
                    <div ref={endRef} />
                  </div>
                </ScrollArea>

                <div className="border-t border-mentor-border/60 p-4 bg-mentor-surface">
                  <div className="flex gap-2 items-end max-w-3xl mx-auto">
                    <Textarea
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          send(input);
                        }
                      }}
                      placeholder={isRTL ? "כתבו את שאלתכם…" : "Type your question…"}
                      className="min-h-[48px] max-h-[140px] resize-none bg-card border-mentor-border/60"
                      disabled={isLoading}
                    />
                    <Button
                      onClick={() => send(input)}
                      disabled={!input.trim() || isLoading}
                      size="icon"
                      className="h-[48px] w-[48px] flex-shrink-0 bg-mentor-accent hover:bg-mentor-accent/90 text-mentor-accent-foreground"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                </>
                )}
              </div>
            </DialogContent>
          </Dialog>

          {/* Benefits & Outcomes — below chat, two columns */}
          <div className="max-w-5xl mx-auto mt-10 md:mt-14 grid md:grid-cols-2 gap-6">
            <div className="bg-card border border-mentor-border/60 rounded-2xl p-6 shadow-sm">
              <h3 className="text-xl font-serif font-semibold text-foreground mb-1">
                {isRTL ? "מה תקבלו" : "What You Gain"}
              </h3>
              <p className="text-sm text-muted-foreground mb-5">
                {isRTL ? "התועלות שמטפלים מרגישים מהשיחה הראשונה" : "Benefits therapists feel from the first conversation"}
              </p>

              <ul className="space-y-3">
                {benefits.map((b, i) => {
                  const Icon = b.icon;
                  return (
                    <li key={i} className="flex gap-3">
                      <div className="flex-shrink-0 w-9 h-9 rounded-full bg-mentor-accent/15 flex items-center justify-center">
                        <Icon className="w-4 h-4 text-mentor-accent" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-semibold text-foreground">{b.title}</h4>
                        <p className="text-sm text-muted-foreground leading-relaxed">{b.desc}</p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>

            <div className="bg-mentor-accent/5 border border-mentor-accent/20 rounded-2xl p-6">
              <h3 className="text-lg font-serif font-semibold text-foreground mb-4">
                {isRTL ? "התוצאות שאליהן תגיעו" : "The Outcomes You'll Reach"}
              </h3>
              <ul className="space-y-2.5">
                {outcomes.map((o, i) => (
                  <li key={i} className="flex gap-2 items-start">
                    <CheckCircle2 className="w-4 h-4 text-mentor-accent flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-foreground leading-relaxed">{o}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      </main>
      <div className="container mx-auto px-4 pb-8">
        <WebsiteBuilderCTA />
      </div>
      <Footer />
    </div>
  );
}
