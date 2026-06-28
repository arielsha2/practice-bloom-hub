import { useState, useRef, useEffect, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import ReactMarkdown from "react-markdown";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { SEOHead } from "@/components/SEOHead";
import { Footer } from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Send,
  Sparkles,
  Target,
  TrendingUp,
  Heart,
  Clock,
  Users2,
  CheckCircle2,
  MessageCircle,
  ArrowRight,
  ArrowLeft,
  Map as MapIcon,
  LogIn,
  LogOut,
  Compass,
  Tag,
  User as UserIcon,
  Users,
  Trophy,
  Check,
  NotebookPen,
  Download,
  Copy as CopyIcon,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { downloadConversationPdf, copyConversationText } from "@/lib/mentorExport";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useHasMentorAccess } from "@/hooks/useHasMentorAccess";
import { useNavigate, useSearchParams } from "react-router-dom";
import { JourneyMap } from "@/components/mentor/JourneyMap";
import { FinalCelebration } from "@/components/mentor/FinalCelebration";
import { WebsiteComingSoonCard } from "@/components/mentor/WebsiteComingSoonCard";
import { MentorSalesPage } from "@/components/mentor/MentorSalesPage";
import { useTherapistJourney } from "@/hooks/useTherapistJourney";
import { useUserPlan } from "@/hooks/useUserPlan";
import { ResetMentorButton } from "@/components/mentor/ResetMentorButton";
import { UpgradeInvite } from "@/components/access/UpgradeInvite";
import { TrialBanner } from "@/components/access/TrialBanner";
import { MailingConsentGate } from "@/components/mentor/MailingConsentGate";
import { MentorNotebookPanel } from "@/components/mentor/MentorNotebookPanel";
// BYOK removed — paid users now run on the project's server-side GEMINI_API_KEY.
import { PaymentPendingBanner } from "@/components/mentor/PaymentPendingBanner";

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

  if (!site?.is_published) return null;

  return (
    <div
      dir="rtl"
      className="max-w-3xl mx-auto mt-6 bg-card border border-mentor-border/60 rounded-2xl p-6 shadow-sm text-center"
    >
      <h3 className="text-lg font-serif font-semibold mb-2">הכרטיס הדיגיטלי שלך</h3>
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">הדף שלך חי בכתובת:</p>
        <div className="flex items-center justify-center gap-2">
          <a
            href={`/t/${site.slug}`}
            target="_blank"
            rel="noreferrer"
            className="text-mentor-accent font-semibold hover:underline"
          >
            /t/{site.slug}
          </a>
          <button
            onClick={() => {
              navigator.clipboard.writeText(`${window.location.origin}/t/${site.slug}`);
              toast.success("הקישור הועתק");
            }}
            className="text-xs px-2 py-1 rounded border hover:bg-accent"
          >
            העתק
          </button>
        </div>
        <Button variant="outline" size="sm" onClick={() => navigate("/mentor/website-builder")}>
          ערוך את הדף
        </Button>
      </div>
    </div>
  );
}

const MENTOR_SALES_URL = "https://meshulam.co.il/s/7e0acf30-e444-60ce-c935-fc7bfe8b7510";
const ELIANA_AVATAR = "/images/eliana-avatar.png";

export async function updateTherapistProgress(
  step_number: number,
  stuck_point: string,
  reflection: Record<string, unknown>,
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
      { onConflict: "user_id" },
    )
    .select()
    .single();

  return { data, error };
}

type Msg = { role: "user" | "assistant"; content: string; ts?: string };

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
  "יומן מלא במטופלים שמתאימים לך",
  "מחיר שמשקף את הערך האמיתי שלך",
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

// ============================================================
// JourneyRail — compact vertical stage list for the sidebar
// ============================================================
const STAGE_DEFS_HE = [
  { key: "niche", label: "מציאת נישה", botKey: "niche-finder", Icon: Compass },
  { key: "pricing", label: "תמחור", botKey: "pricing-calculator", Icon: Tag },
  { key: "self-presentation", label: "הצגה עצמית", botKey: "self-presentation", Icon: UserIcon },
  { key: "network", label: "רשת קשרים", botKey: "contact-finder", Icon: Users },
  { key: "conversion", label: "שיחת המרה", botKey: "connection-bridge", Icon: Sparkles },
];

const STAGE_DEFS_EN = [
  { key: "niche", label: "Find Your Niche", botKey: "niche-finder", Icon: Compass },
  { key: "pricing", label: "Pricing", botKey: "pricing-calculator", Icon: Tag },
  { key: "self-presentation", label: "Self Presentation", botKey: "self-presentation", Icon: UserIcon },
  { key: "network", label: "Network", botKey: "contact-finder", Icon: Users },
  { key: "conversion", label: "Conversion Call", botKey: "connection-bridge", Icon: Sparkles },
];

function JourneyRail({ onOpenBot }: { onOpenBot: (botKey: string) => void }) {
  const { isRTL } = useLanguage();
  const { journey } = useTherapistJourney();
  const stages = isRTL ? STAGE_DEFS_HE : STAGE_DEFS_EN;
  const completed = new Set(journey?.completed_stages ?? []);
  const currentKey = (journey?.reflection as any)?.current as string | undefined;

  return (
    <div className="bg-card border border-mentor-border/60 rounded-2xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-serif font-semibold text-foreground">{isRTL ? "המסע שלך" : "Your Journey"}</h3>
        <ResetMentorButton />
      </div>

      <ol className="space-y-1.5">
        {stages.map((s) => {
          const isDone = completed.has(s.key);
          const isActive = currentKey === s.key;
          const isClickable = isDone || isActive;
          const Icon = s.Icon;

          return (
            <li key={s.key}>
              <button
                onClick={() => isClickable && onOpenBot(s.botKey)}
                disabled={!isClickable}
                className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl transition-all text-start ${
                  isDone
                    ? "bg-mentor-accent/10 hover:bg-mentor-accent/20 cursor-pointer"
                    : isActive
                      ? "bg-mentor-accent/15 border border-mentor-accent/40 cursor-pointer"
                      : "opacity-50 cursor-default"
                }`}
              >
                <span
                  className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center ${
                    isDone
                      ? "bg-mentor-accent text-mentor-accent-foreground"
                      : isActive
                        ? "bg-mentor-accent/20 text-mentor-accent"
                        : "bg-muted text-muted-foreground"
                  }`}
                >
                  {isDone ? <Check className="w-3.5 h-3.5" /> : <Icon className="w-3.5 h-3.5" />}
                </span>
                <span className="flex-1 text-xs font-medium text-foreground truncate">{s.label}</span>
                {isActive && <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse flex-shrink-0" />}
              </button>
            </li>
          );
        })}

        <li className="pt-2 mt-2 border-t border-mentor-border/40">
          <div className="flex items-center gap-2.5 px-2.5 py-2">
            <span className="flex-shrink-0 w-7 h-7 rounded-full bg-gradient-to-br from-mentor-accent to-mentor-accent/70 text-mentor-accent-foreground flex items-center justify-center">
              <Trophy className="w-3.5 h-3.5" />
            </span>
            <span className="flex-1 text-xs font-semibold text-foreground">
              {isRTL ? "קליניקה משגשגת" : "Thriving Practice"}
            </span>
          </div>
        </li>
      </ol>
    </div>
  );
}

// ============================================================
// SidebarAccordions — "What you gain" + "Where you'll get"
// ============================================================
function SidebarAccordions({
  benefits,
  outcomes,
  compact = true,
}: {
  benefits: typeof BENEFITS_HE;
  outcomes: string[];
  compact?: boolean;
}) {
  const { isRTL } = useLanguage();
  return (
    <Accordion type="multiple" className="bg-card border border-mentor-border/60 rounded-2xl px-4 shadow-sm">
      <AccordionItem value="benefits" className="border-b border-mentor-border/40 last:border-0">
        <AccordionTrigger className={`${compact ? "text-sm" : "text-base"} font-serif text-foreground`}>
          {isRTL ? "מה תקבל מהמסע" : "What You Gain"}
        </AccordionTrigger>
        <AccordionContent>
          <ul className="space-y-2.5 pt-1">
            {benefits.map((b, i) => {
              const Icon = b.icon;
              return (
                <li key={i} className="flex gap-2.5">
                  <div className="flex-shrink-0 w-7 h-7 rounded-full bg-mentor-accent/15 flex items-center justify-center mt-0.5">
                    <Icon className="w-3.5 h-3.5 text-mentor-accent" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-semibold text-foreground">{b.title}</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">{b.desc}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="outcomes" className="border-0">
        <AccordionTrigger className={`${compact ? "text-sm" : "text-base"} font-serif text-foreground`}>
          {isRTL ? "לאן המסע מוביל" : "Where You'll Get"}
        </AccordionTrigger>
        <AccordionContent>
          <ul className="space-y-2 pt-1">
            {outcomes.map((o, i) => (
              <li key={i} className="flex gap-2 items-start">
                <CheckCircle2 className="w-4 h-4 text-mentor-accent flex-shrink-0 mt-0.5" />
                <span className="text-xs text-foreground leading-relaxed">{o}</span>
              </li>
            ))}
          </ul>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}

// Typewriter: gradually reveal `text` when `enabled`. When disabled or once caught up, shows full.
function useTypewriter(text: string, enabled: boolean, charsPerTick = 2, intervalMs = 18) {
  const [n, setN] = useState(enabled ? 0 : text.length);
  useEffect(() => {
    if (!enabled) {
      setN(text.length);
      return;
    }
    if (n >= text.length) return;
    const id = setTimeout(() => setN((v) => Math.min(text.length, v + charsPerTick)), intervalMs);
    return () => clearTimeout(id);
  }, [text, n, enabled, charsPerTick, intervalMs]);
  return enabled ? text.slice(0, n) : text;
}

function AssistantMarkdown({
  content,
  animate,
  onBotLink,
  extractBotKey,
}: {
  content: string;
  animate: boolean;
  onBotLink: (botKey: string) => void;
  extractBotKey: (href: string) => string | null;
}) {
  // Strip [HANDOFF:bot-key] and [INSIGHT] markers — they are protocol signals, not visible text
  const cleaned = (content || "")
    .replace(/\[HANDOFF:[a-z-]+\]\s*/gi, "")
    .replace(/\[INSIGHT\]\s*/gi, "")
    .trim();
  const display = useTypewriter(cleaned, animate);
  return (
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
                  onBotLink(botKey);
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
      {display || "…"}
    </ReactMarkdown>
  );
}

// ============================================================
// Main Mentor page
// ============================================================
const WELCOME_BACK_THRESHOLD_HOURS = 12;
const MIN_MESSAGES_FOR_WELCOME_BACK = 4;

export default function Mentor() {
  const { isRTL, language } = useLanguage();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { hasAccess, loading: accessLoading } = useHasMentorAccess();
  const userPlanInfo = useUserPlan();
  const { journey, refresh: refreshJourney } = useTherapistJourney();
  const journeyRef = useRef(journey);
  useEffect(() => {
    journeyRef.current = journey;
  }, [journey]);
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
  const [activeBotKey, setActiveBotKey] = useState<string | null>(null);
  const [trialRestricted, setTrialRestricted] = useState(false);
  const [pendingReturn, setPendingReturn] = useState<{
    botKey: string;
    toolName: string;
    summary: string;
    kickoff: string;
  } | null>(null);
  // (BYOK dialog removed — server-side GEMINI_API_KEY is used for paid users.)

  // Debounce gating for mentor-analyze: run only if 3+ new messages since
  // last analysis OR 2+ minutes have passed. Prevents per-message LLM fan-out.
  const lastAnalyzedCountRef = useRef(0);
  const lastAnalyzedAtRef = useRef(0);

  // Realtime: when an admin (or webhook) flips this user's plan, refresh
  // useUserPlan immediately so the banner disappears and BYOK auto-opens
  // without requiring a page reload.
  useEffect(() => {
    if (!user?.id) return;
    const channel = supabase
      .channel(`profile-plan-${user.id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "profiles", filter: `id=eq.${user.id}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ["user-plan", user.id] });
        },
      )
      .subscribe();

    // Fallback: also refetch on window focus in case realtime drops.
    const onVisible = () => {
      if (document.visibilityState === "visible") {
        queryClient.invalidateQueries({ queryKey: ["user-plan", user.id] });
      }
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      supabase.removeChannel(channel);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [user?.id, queryClient]);

  const chatCardRef = useRef<HTMLDivElement>(null);
  const messagesViewportRef = useRef<HTMLDivElement>(null);

  const BOT_KEYS = [
    "connection-bridge",
    "niche-finder",
    "self-presentation",
    "contact-finder",
    "pricing-calculator",
    "strategy-planner",
    "content-creator",
  ];

  // Aliases the LLM occasionally hallucinates → canonical bot key.
  // Bug observed in production: mentor produced [HANDOFF:bridge-the-gap]
  // 12 times and 0/12 reached the bot. Always normalize before lookup.
  const HANDOFF_ALIASES: Record<string, string> = {
    "bridge-the-gap": "connection-bridge",
    bridge: "connection-bridge",
    "conversion-call": "connection-bridge",
    conversion: "connection-bridge",
    niche: "niche-finder",
    pricing: "pricing-calculator",
    "self-presentation-tool": "self-presentation",
    presentation: "self-presentation",
    contacts: "contact-finder",
    network: "contact-finder",
  };

  const normalizeBotKey = (raw: string | null | undefined): string | null => {
    if (!raw) return null;
    const k = raw.toLowerCase().trim();
    const mapped = HANDOFF_ALIASES[k] ?? k;
    return BOT_KEYS.includes(mapped) ? mapped : null;
  };

  const extractBotKey = (href: string): string | null => {
    try {
      const u = new URL(href, window.location.origin);
      const m = u.pathname.match(/\/ai-assistants\/([^\/?#]+)/);
      if (m) return normalizeBotKey(m[1]);
    } catch {}
    return null;
  };

  // Display labels for the five user-facing tools.
  const BOT_LABELS: Record<string, string> = {
    "niche-finder": isRTL ? "מציאת נישה" : "Niche Finder",
    "pricing-calculator": isRTL ? "תמחור" : "Pricing Calculator",
    "self-presentation": isRTL ? "הצגה עצמית" : "Self Presentation",
    "contact-finder": isRTL ? "רשת קשרים" : "Contact Finder",
    "connection-bridge": isRTL ? "שיחת המרה" : "Connection Bridge",
  };

  // Formal names/aliases used to detect tool mentions. Intentionally avoids
  // bare casual words like "נישה" or "מחיר" so a sentence like
  // "דיברנו על נישה אתמול" does NOT match.
  const BOT_ALIASES: Record<string, RegExp[]> = {
    "niche-finder": [/Niche\s*Finder/i, /מציאת\s*נישה/],
    "pricing-calculator": [/Pricing\s*Calculator/i, /\bPricing\b/i, /תמחור/],
    "self-presentation": [/Self[-\s]*Presentation/i, /הצגה\s*עצמית/],
    "contact-finder": [/Contact\s*Finder/i, /רשת\s*קשרים/],
    "connection-bridge": [/Connection\s*Bridge/i, /שיחת\s*המרה/, /שיחת\s*היכרות/],
  };

  // Transition phrases — mentor signalling an actual handoff (not a casual mention).
  const HANDOFF_PHRASES = [
    // Hebrew
    /אני\s*מעביר[הת]?\s*אות[ךכ]/,
    /אעביר\s*אות[ךכ]/,
    /שולח[ת]?\s*אות[ךכ]/,
    /נעבור\s*עכשיו\s*ל/,
    /תעביר\s*אות[יו]/,
    // English
    /sending\s+you\s+to/i,
    /transferring\s+you\s+to/i,
    /let'?s\s+move\s+to/i,
    /i'?m\s+sending\s+you/i,
  ];

  // Return last N sentences of a text (split on Hebrew/Latin sentence terminators + newlines).
  const lastSentences = (text: string, n: number): string => {
    const parts = (text || "")
      .replace(/\[HANDOFF:[a-z-]+\]/gi, "")
      .split(/(?<=[.!?。…])\s+|\n+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    return parts.slice(-n).join(" ");
  };

  // Find which bot is mentioned in the given text (formal aliases only).
  const findMentionedBot = (text: string): string | null => {
    for (const bk of BOT_KEYS) {
      const aliases = BOT_ALIASES[bk];
      if (!aliases) continue;
      if (aliases.some((re) => re.test(text))) return bk;
    }
    return null;
  };

  // Three-tier handoff detection:
  //   1. Exact tag [HANDOFF:bot-key]
  //   2. Bare bot URL anywhere in the text (markdown or plain)
  //   3. A transition phrase AND a tool name, both within the last 3 sentences
  const detectHandoff = (text: string): string | null => {
    if (!text) return null;

    // 1. Exact tag — normalize through aliases (LLM sometimes invents keys
    //    like "bridge-the-gap" instead of "connection-bridge").
    const tagMatch = text.match(/\[HANDOFF:([a-z-]+)\]/i);
    if (tagMatch) {
      const normalized = normalizeBotKey(tagMatch[1]);
      if (normalized) return normalized;
    }

    // 2. Any bot URL (markdown link OR bare URL) anywhere in the message.
    const urlRegex = /https?:\/\/[^\s)>\]]+\/ai-assistants\/[a-z-]+[^\s)>\]]*/gi;
    const urlMatches = text.match(urlRegex);
    if (urlMatches) {
      for (const url of urlMatches) {
        const bk = extractBotKey(url);
        if (bk) return bk;
      }
    }

    // 3. Transition phrase + tool name, both in last 3 sentences.
    const tail = lastSentences(text, 3);
    if (tail) {
      const hasPhrase = HANDOFF_PHRASES.some((re) => re.test(tail));
      if (hasPhrase) {
        const mentioned = findMentionedBot(tail);
        if (mentioned) return mentioned;
      }
    }

    return null;
  };

  useEffect(() => {
    const viewport = messagesViewportRef.current;
    if (!viewport) return;
    requestAnimationFrame(() => {
      viewport.scrollTop = viewport.scrollHeight;
    });
  }, [messages, isLoading]);

  useEffect(() => {
    try {
      if (messages.length === 0) {
        localStorage.removeItem(storageKey);
      } else {
        localStorage.setItem(storageKey, JSON.stringify(messages));
      }
    } catch {
      // ignore
    }
  }, [messages, storageKey]);

  // Unified-conversation model: a single row per (user_id, language) in
  // mentor_conversations. On mount, hydrate from DB if it has more messages
  // than localStorage (cross-device continuity). Saves are upserts.
  const conversationLoadedRef = useRef(false);
  const lastSavedRef = useRef<string>("");

  useEffect(() => {
    if (!user?.id) return;
    if (conversationLoadedRef.current) return;
    let cancelled = false;
    (async () => {
      try {
        const { data } = await supabase
          .from("mentor_conversations")
          .select("messages")
          .eq("user_id", user.id)
          .eq("language", language)
          .maybeSingle();
        if (cancelled) return;
        const remote = Array.isArray((data as any)?.messages) ? ((data as any).messages as Msg[]) : [];
        // Prefer remote if it is longer (cross-device continuity); otherwise
        // keep whatever localStorage already populated (avoids losing an
        // in-progress reply that hasn't been flushed yet).
        setMessages((prev) => (remote.length > prev.length ? remote : prev));
        lastSavedRef.current = JSON.stringify(remote.length > 0 ? remote : []);
      } catch (e) {
        console.warn("mentor conversation load failed", e);
      } finally {
        conversationLoadedRef.current = true;
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id, language]);

  // Reset load flag when user/language changes so we re-hydrate.
  useEffect(() => {
    conversationLoadedRef.current = false;
    lastSavedRef.current = "";
  }, [user?.id, language]);

  // Persist (upsert) the unified conversation. One row per (user, language).
  useEffect(() => {
    if (!user?.id) return;
    if (!conversationLoadedRef.current) return;
    if (messages.length === 0) return;

    const last = messages[messages.length - 1];
    if (last?.role === "assistant" && !last.content) return;

    const serialized = JSON.stringify(messages);
    if (serialized === lastSavedRef.current) return;

    const t = setTimeout(async () => {
      try {
        const insightCount = messages.reduce((acc, m) => {
          if (m.role !== "assistant") return acc;
          const matches = (m.content || "").match(/\[INSIGHT\]/gi);
          return acc + (matches ? matches.length : 0);
        }, 0);
        const currentStage = (journeyRef.current?.reflection as any)?.current ?? null;
        const { error } = await supabase.from("mentor_conversations").upsert(
          {
            user_id: user.id,
            language,
            messages: messages as any,
            insight_count: insightCount,
            stage: currentStage,
            updated_at: new Date().toISOString(),
          } as any,
          { onConflict: "user_id,language" },
        );
        if (error) throw error;
        lastSavedRef.current = serialized;
      } catch (e) {
        console.warn("mentor conversation save failed", e);
      }
    }, 600);

    return () => clearTimeout(t);
  }, [messages, user?.id, language]);

  // Track last-active timestamp (per user) for the returning-user welcome-back.
  useEffect(() => {
    if (!user?.id || messages.length === 0) return;
    try {
      localStorage.setItem(`mentor-last-active:${user.id}`, String(Date.now()));
    } catch {
      // ignore
    }
  }, [messages, user?.id]);

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

  // Returning-user welcome-back: triggers once per session when the user
  // returns after >= 12h with an existing conversation past the initial intro.
  const welcomeBackTriedRef = useRef(false);
  useEffect(() => {
    if (welcomeBackTriedRef.current) return;
    if (!user?.id) return;
    if (isLoading) return;
    if (messages.length < MIN_MESSAGES_FOR_WELCOME_BACK) return;
    if (input.trim().length > 0) return;

    const sessionKey = `mentor-welcomeback-shown:${user.id}`;
    try {
      if (sessionStorage.getItem(sessionKey)) {
        welcomeBackTriedRef.current = true;
        return;
      }
    } catch {
      return;
    }

    let lastActiveRaw: string | null = null;
    try {
      lastActiveRaw = localStorage.getItem(`mentor-last-active:${user.id}`);
    } catch {
      return;
    }
    if (!lastActiveRaw) return;
    const lastActive = Number(lastActiveRaw);
    if (!Number.isFinite(lastActive)) return;

    const hoursAway = (Date.now() - lastActive) / (1000 * 60 * 60);
    if (hoursAway < WELCOME_BACK_THRESHOLD_HOURS) return;

    welcomeBackTriedRef.current = true;
    try {
      sessionStorage.setItem(sessionKey, "1");
    } catch {
      // ignore
    }

    void sendWelcomeBack(Math.round(hoursAway));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, messages.length, isLoading]);

  // Suggested bot for the fallback banner: last assistant message mentions
  // a formal tool name in its last 3 sentences, but detectHandoff didn't fire.
  // Suppressed while a bot is already open, while the next response is loading,
  // and while a pending-return dialog is showing.
  const suggestedBotKey = useMemo<string | null>(() => {
    if (activeBotKey || isLoading) return null;
    const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant");
    if (!lastAssistant?.content) return null;
    // If a real handoff was already detected we don't need a fallback banner.
    if (detectHandoff(lastAssistant.content)) return null;
    const tail = lastSentences(lastAssistant.content, 3);
    return findMentionedBot(tail);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, activeBotKey, isLoading]);

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

      let summary = "";
      if (from === "niche-finder" && j?.niche_output) {
        const n: any = j.niche_output;
        const parts = [
          n.ideal_client && (isRTL ? `מטופל אידיאלי: ${n.ideal_client}` : `Ideal client: ${n.ideal_client}`),
          n.core_pain && (isRTL ? `הכאב המרכזי: ${n.core_pain}` : `Core pain: ${n.core_pain}`),
          n.transformation && (isRTL ? `הטרנספורמציה: ${n.transformation}` : `Transformation: ${n.transformation}`),
          n.handshake_version &&
            (isRTL ? `ניסוח לחיצת יד: ${n.handshake_version}` : `Handshake: ${n.handshake_version}`),
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
          ? "לא נשמר סיכום אוטומטי לכלי הזה. אפשר לספר לאליענה במילים שלך."
          : "No automatic summary was saved for this tool. You can tell Eliana in your own words.";
      }

      const kickoff = isRTL
        ? `חזרתי עכשיו מהכלי ${toolName}. הנה הסיכום:\n\n${summary}\n\nמה הצעד הבא לאור מה שעלה שם?`
        : `I just came back from the ${toolName} tool. Here's the summary:\n\n${summary}\n\nWhat's the next step based on what came up there?`;

      setPendingReturn({ botKey: from, toolName, summary, kickoff });

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
    setTimeout(() => {
      send(kickoff);
    }, 50);
  };

  const sendWelcomeBack = async (hoursAway: number) => {
    if (isLoading) return;
    if (messages.length < MIN_MESSAGES_FOR_WELCOME_BACK) return;
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
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const authHeaders: Record<string, string> = { "Content-Type": "application/json" };
      if (session?.access_token) authHeaders.Authorization = `Bearer ${session.access_token}`;
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/mentor-chat`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({
          messages,
          language,
          journey_context,
          returning_user: { hours_away: hoursAway },
        }),
      });
      if (!resp.ok || !resp.body) {
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
              setMessages((prev) => prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistant } : m)));
            }
          } catch {
            buffer = line + "\n" + buffer;
            break;
          }
        }
      }
    } catch (e) {
      console.warn("welcome-back failed", e);
    } finally {
      setIsLoading(false);
    }
  };

  const send = async (text: string) => {
    if (!text.trim() || isLoading) return;
    const userMsg: Msg = { role: "user", content: text.trim(), ts: new Date().toISOString() };
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
            checkin_due: (j as any).checkin_due ?? false,
            checkin_question: (j as any).checkin_question ?? "",
            checkin_stage: (j as any).checkin_stage ?? "",
          }
        : null;
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const authHeaders: Record<string, string> = { "Content-Type": "application/json" };
      if (session?.access_token) authHeaders.Authorization = `Bearer ${session.access_token}`;
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/mentor-chat`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({ messages: next, language, journey_context }),
      });

      if (!resp.ok || !resp.body) {
        if (resp.status === 403) {
          const body = await resp.json().catch(() => null);
          if (body?.error === "trial_restricted") {
            const explainer = isRTL
              ? "זה צורך אמיתי וחשוב — ואני שמחה שאת/ה מזהה אותו 💛\n\nבגרסת ההתנסות (24 שעות) העזרה שלי מתמקדת ב**תמחור** בלבד. את שאר המרכיבים — נישה, הצגה עצמית, רשת הפניות, שיחת המרה — נפתח יחד בגרסה המלאה.\n\nבינתיים, אם זה מתאים, בואי נעבוד על התמחור: [Pricing Calculator](https://therapykeys.co.il/ai-assistants/pricing-calculator) — או ספר/י לי מה המחיר שאת/ה גובה היום לפגישה, ואיך הוא מרגיש לך?"
              : "That's a real and important need — and I'm glad you're noticing it 💛\n\nDuring the 24-hour trial my help is focused on **pricing** only. The rest of the components — niche, self-presentation, referral network, conversion call — we'll open together in the full version.\n\nIn the meantime, if it fits, let's work on pricing: [Pricing Calculator](https://therapykeys.co.il/ai-assistants/pricing-calculator) — or tell me, what price are you charging today per session, and how does it feel?";
            // Keep the user message; append an assistant bubble with the explanation.
            setMessages((prev) => [...prev, { role: "assistant", content: explainer }]);
            setTrialRestricted(true);
            toast.info(isRTL ? "בתקופת ההתנסות המנטור מתמקד בתמחור" : "During trial the mentor focuses on pricing");
            setIsLoading(false);
            return;
          }
        }
        // (BYOK error codes removed — paid users now use the server key.)
        if (resp.status === 429)
          toast.error(isRTL ? "יותר מדי בקשות, נסו שוב בעוד רגע" : "Rate limited, try again soon");
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
              setMessages((prev) => prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistant } : m)));
            }
          } catch {
            buffer = line + "\n" + buffer;
            break;
          }
        }
      }

      // Handoff detection — run ONCE after the full stream completes.
      const handoffKey = detectHandoff(assistant);
      if (handoffKey) {
        toast.message(
          isRTL
            ? `עוברים לכלי: ${BOT_LABELS[handoffKey] ?? handoffKey}…`
            : `Switching to: ${BOT_LABELS[handoffKey] ?? handoffKey}…`,
        );
        setTimeout(() => {
          setActiveBotKey(handoffKey);
          chatCardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 1200);
      }
    } catch (e) {
      console.error(e);
      toast.error(isRTL ? "שגיאת רשת" : "Network error");
    } finally {
      setIsLoading(false);
      try {
        const fullHistory = [...messages, { role: "user", content: text.trim() }];
        const totalCount = fullHistory.length;
        const msSinceLast = Date.now() - lastAnalyzedAtRef.current;
        const newMsgsSinceLast = totalCount - lastAnalyzedCountRef.current;
        const shouldAnalyze =
          lastAnalyzedAtRef.current === 0 || // first time
          newMsgsSinceLast >= 3 ||
          msSinceLast >= 2 * 60 * 1000;

        if (!shouldAnalyze) {
          // Skip analyze + score this turn — saves 2 LLM calls per message.
          console.log("[mentor-analyze] skipped (debounce)", { newMsgsSinceLast, msSinceLast });
        } else {
          const { data: auth } = await supabase.auth.getUser();
          if (auth.user) {
            // Mark immediately so concurrent sends don't re-fire.
            lastAnalyzedCountRef.current = totalCount;
            lastAnalyzedAtRef.current = Date.now();

            const ANALYZE_WINDOW = 20;
            const trimmedHistory =
              fullHistory.length > ANALYZE_WINDOW ? fullHistory.slice(-ANALYZE_WINDOW) : fullHistory;

            const {
              data: { session },
            } = await supabase.auth.getSession();
            const analyzeResp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/mentor-analyze`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${session?.access_token ?? ""}`,
              },
              body: JSON.stringify({
                user_id: auth.user.id,
                messages: trimmedHistory,
              }),
            });
            if (analyzeResp.ok) {
              const { completed, current, stuck_point } = await analyzeResp.json();
              const stageMap: Record<string, number> = {
                niche: 1,
                pricing: 2,
                "self-presentation": 3,
                network: 4,
                conversion: 5,
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
                { onConflict: "user_id" },
              );
              window.dispatchEvent(new CustomEvent("therapist-journey-updated"));

              // Call mentor-score from client and persist score directly via RLS
              try {
                const scoreResp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/mentor-score`, {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${session?.access_token ?? ""}`,
                  },
                  body: JSON.stringify({
                    user_id: auth.user.id,
                    messages: trimmedHistory,
                    journey_context: { completed_stages: completed, current },
                    trigger_event: completed.length > 0 ? "stage_completed" : "stuck_point_detected",
                  }),
                });

                if (scoreResp.ok) {
                  const scoreData = await scoreResp.json();
                  if (scoreData.health_score !== undefined) {
                    await supabase
                      .from("therapist_journeys")
                      .update({
                        health_score: scoreData.health_score,
                        score_breakdown: scoreData.breakdown,
                        score_updated_at: new Date().toISOString(),
                        score_history: scoreData.score_history ?? [],
                      })
                      .eq("user_id", auth.user.id);
                    window.dispatchEvent(new CustomEvent("therapist-journey-updated"));
                  }
                }
              } catch (e) {
                console.warn("mentor-score client call failed", e);
              }
            }
          }
        }
      } catch (err) {
        console.warn("mentor-analyze failed", err);
      }
    }
  };

  const showWelcome = messages.length === 0;

  const scrollToFullMap = () => {
    document.getElementById("full-journey-map")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // Paywall — full sales page (trial users get through and see the mentor)
  if (!accessLoading && hasAccess === false && !userPlanInfo.trialActive) {
    return (
      <div dir={isRTL ? "rtl" : "ltr"} className="min-h-screen flex flex-col bg-mentor-bg">
        <MentorTopBar />
        <main className="flex-1 pt-16">
          {user && <PaymentPendingBanner />}
          <MentorSalesPage />
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div
      dir={isRTL ? "rtl" : "ltr"}
      className="min-h-screen flex flex-col bg-gradient-to-b from-mentor-bg to-[hsl(var(--mentor-bg)/0.7)]"
    >
      <SEOHead
        title={
          isRTL
            ? "המנטור | ליווי AI אישי למטפלים — TherapyKeys"
            : "The Mentor | AI Guidance for Therapists — TherapyKeys"
        }
        description={
          isRTL
            ? 'מנטור AI מבוסס שיטת "על שפת הקליניקה" של ד"ר אריאל שפירא. ליווי אישי לאיתור נישה, תמחור, שיווק ובניית קליניקה פרטית למטפלים בישראל.'
            : "An AI mentor based on Dr. Ariel Shapira\u2019s method. Personal guidance for therapists on niche, pricing, marketing and building a private practice."
        }
        canonicalUrl={isRTL ? "/mentor" : "/en/mentor"}
      />
      <MentorTopBar />
      <MailingConsentGate />

      <main className="flex-1 pt-16">
        <TrialBanner />
        {/* Soft intro */}
        <section className="container mx-auto px-4 pt-6 md:pt-8 pb-3 text-center max-w-2xl">
          <p className="text-sm md:text-base text-foreground/80 font-serif leading-relaxed">
            {isRTL
              ? "הי, אני אליענה ואני זו שאלווה אותך במסע הזה אל הקליניקה שלך."
              : "Hi, I'm Eliana — I'll be guiding you on this journey to your practice."}
          </p>
        </section>

        {/* Main grid: sidebar + chat */}
        <section className="container mx-auto px-4 pb-10">
          <div className="grid grid-cols-1 lg:grid-cols-[14rem_1fr] gap-5 lg:gap-6 items-start max-w-6xl mx-auto">
            {/* Sidebar (desktop only) */}
            <aside className="hidden lg:flex flex-col gap-4 sticky top-20">
              <JourneyRail
                onOpenBot={(botKey) => {
                  setActiveBotKey(botKey);
                  chatCardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
              />
              <SidebarAccordions benefits={benefits} outcomes={outcomes} />
            </aside>

            {/* Chat column */}
            <div className="min-w-0 lg:sticky lg:top-20 lg:self-start">
              {/* Pending return card */}
              {pendingReturn && (
                <div
                  ref={(el) => el?.scrollIntoView({ behavior: "smooth", block: "center" })}
                  dir={isRTL ? "rtl" : "ltr"}
                  className="mb-4 bg-mentor-accent/5 border-2 border-mentor-accent/40 rounded-2xl p-5 shadow-md"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle2 className="w-5 h-5 text-mentor-accent flex-shrink-0" />
                    <h3 className="text-base md:text-lg font-serif font-semibold text-foreground">
                      {isRTL
                        ? `סיימת לעבוד עם ${pendingReturn.toolName}`
                        : `You finished working with ${pendingReturn.toolName}`}
                    </h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    {isRTL
                      ? "זה הסיכום שיועבר לאליענה. אפשר לעיין בו לפני שממשיכים."
                      : "This summary will be passed to Eliana. Review it before continuing."}
                  </p>
                  <div className="bg-card border border-mentor-border/60 rounded-xl p-4 mb-4 max-h-56 overflow-auto">
                    <pre
                      className={`whitespace-pre-wrap text-sm font-sans text-foreground leading-relaxed ${isRTL ? "text-right" : "text-left"}`}
                    >
                      {pendingReturn.summary}
                    </pre>
                  </div>
                  <div className="flex flex-wrap gap-2 justify-end">
                    <Button variant="outline" size="sm" onClick={() => setPendingReturn(null)}>
                      {isRTL ? "סגירה" : "Dismiss"}
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
                      {isRTL ? "המשך את השיחה עם אליענה" : "Continue with Eliana"}
                    </Button>
                  </div>
                </div>
              )}

              {/* Chat card */}
              <div
                ref={chatCardRef}
                className="bg-card border border-mentor-border/60 rounded-3xl shadow-xl overflow-hidden flex flex-col"
                style={{ height: "clamp(520px, 72vh, 720px)" }}
              >
                {/* Header — visually distinct when a tool/bot is active */}
                <div
                  className={`px-5 py-4 border-b flex items-center gap-3 transition-colors ${
                    activeBotKey
                      ? "border-accent/40 bg-accent/15 font-body"
                      : "border-mentor-border/60 bg-mentor-surface"
                  }`}
                >
                  {activeBotKey && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setActiveBotKey(null)}
                      className="gap-1.5 text-accent-foreground hover:bg-accent/30"
                    >
                      {isRTL ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
                      {isRTL ? "חזרה לאליענה" : "Back to Eliana"}
                    </Button>
                  )}

                  <div
                    className={`w-11 h-11 rounded-full flex-shrink-0 flex items-center justify-center ${
                      activeBotKey
                        ? "bg-accent text-accent-foreground border-2 border-accent/50"
                        : "overflow-hidden border-2 border-mentor-accent/30"
                    }`}
                  >
                    {activeBotKey ? (
                      <Sparkles className="w-5 h-5" />
                    ) : (
                      <img src={ELIANA_AVATAR} alt="Eliana" className="w-full h-full object-cover" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h2
                      className={`font-semibold leading-tight ${
                        activeBotKey ? "font-body text-foreground" : "font-serif text-foreground"
                      }`}
                    >
                      {activeBotKey
                        ? (isRTL ? "כלי AI: " : "AI Tool: ") +
                          ({
                            "niche-finder": isRTL ? "מציאת נישה" : "Niche Finder",
                            "pricing-calculator": isRTL ? "תמחור" : "Pricing Calculator",
                            "self-presentation": isRTL ? "הצגה עצמית" : "Self Presentation",
                            "contact-finder": isRTL ? "רשת קשרים" : "Contact Finder",
                            "connection-bridge": isRTL ? "שיחת המרה" : "Connection Bridge",
                          }[activeBotKey] ?? activeBotKey)
                        : isRTL
                          ? "אליענה"
                          : "Eliana"}
                    </h2>
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                      {activeBotKey
                        ? isRTL
                          ? "את/ה מדבר/ת עם בוט אחר — השיחה עם אליענה נשמרת"
                          : "You're now talking to a different assistant — your chat with Eliana is saved"
                        : isRTL
                          ? "מקשיבה ✦"
                          : "Listening ✦"}
                    </p>
                  </div>

                  {!activeBotKey && messages.length > 0 && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1.5 border-mentor-accent/40 text-mentor-accent hover:bg-mentor-accent hover:text-mentor-accent-foreground"
                          title={isRTL ? "הורד או שתף את השיחה" : "Download or share conversation"}
                        >
                          <Download className="w-4 h-4" />
                          <span className="hidden sm:inline">{isRTL ? "השיחה שלי" : "My chat"}</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align={isRTL ? "start" : "end"}>
                        <DropdownMenuItem
                          onClick={async () => {
                            try {
                              await downloadConversationPdf(messages, {
                                isRTL,
                                displayName: user?.email ?? null,
                              });
                            } catch (e) {
                              console.error(e);
                              toast.error(isRTL ? "ההורדה נכשלה" : "Download failed");
                            }
                          }}
                        >
                          <Download className="w-4 h-4 me-2" />
                          {isRTL ? "הורד כ-PDF" : "Download PDF"}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={async () => {
                            try {
                              await copyConversationText(messages, { isRTL });
                              toast.success(isRTL ? "הועתק ללוח" : "Copied to clipboard");
                            } catch (e) {
                              console.error(e);
                              toast.error(isRTL ? "ההעתקה נכשלה" : "Copy failed");
                            }
                          }}
                        >
                          <CopyIcon className="w-4 h-4 me-2" />
                          {isRTL ? "העתק כטקסט (לוואטסאפ/מייל)" : "Copy as text (WhatsApp/email)"}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}

                  {!activeBotKey && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={scrollToFullMap}
                      className="gap-1.5 border-mentor-accent/40 text-mentor-accent hover:bg-mentor-accent hover:text-mentor-accent-foreground"
                    >
                      <MapIcon className="w-4 h-4" />
                      <span className="hidden sm:inline">{isRTL ? "מפה מלאה" : "Full Map"}</span>
                    </Button>
                  )}
                </div>

                {/* Body */}
                {activeBotKey ? (
                  <iframe
                    src={`/ai-assistants/${activeBotKey}?kickoff=1&from=mentor`}
                    className="flex-1 w-full border-0 bg-mentor-bg"
                    title={isRTL ? "כלי AI" : "AI tool"}
                  />
                ) : (
                  <>
                    <div ref={messagesViewportRef} className="flex-1 px-4 md:px-5 py-5 overflow-y-auto">
                      <div className="space-y-4 max-w-3xl mx-auto">
                        {showWelcome && (
                          <div className="flex gap-2.5 animate-fade-in">
                            <div className="flex-shrink-0 w-9 h-9 rounded-full overflow-hidden border border-mentor-accent/30">
                              <img src={ELIANA_AVATAR} alt="Eliana" className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-1 min-w-0 space-y-2">
                              <div className="bg-mentor-surface border border-mentor-border/60 rounded-2xl rounded-ss-none px-4 py-3">
                                <p
                                  dir={isRTL ? "rtl" : "ltr"}
                                  className={`text-foreground leading-relaxed text-sm md:text-base ${isRTL ? "text-right" : "text-left"}`}
                                >
                                  {isRTL
                                    ? "הי, אני אליענה ואני זו שאלווה אותך במסע הזה אל הקליניקה שלך."
                                    : "Hi, I'm Eliana — I'll be guiding you on this journey to your practice."}
                                </p>
                              </div>
                              <div className="bg-mentor-surface border border-mentor-border/60 rounded-2xl rounded-ss-none px-4 py-3">
                                <p
                                  dir={isRTL ? "rtl" : "ltr"}
                                  className={`text-foreground leading-relaxed text-sm md:text-base ${isRTL ? "text-right" : "text-left"}`}
                                >
                                  {isRTL
                                    ? "אז איזה יופי שהגעת. לפני שנתחיל אשמח לשמוע עלייך קצת ולהכיר אותך — מה התחום המקצועי שלך, מאיפה בארץ ומה קורה עם הקליניקה שלך עכשיו?"
                                    : "So glad you're here. Before we begin, I'd love to get to know you a little — what's your professional field, where in the country are you, and what's happening with your practice right now?"}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

                        {(() => {
                          let lastAssistantIdx = -1;
                          for (let j = messages.length - 1; j >= 0; j--) {
                            if (messages[j].role === "assistant") {
                              lastAssistantIdx = j;
                              break;
                            }
                          }
                          return messages.map((m, i) => {
                            const isUser = m.role === "user";
                            const animate = !isUser && i === lastAssistantIdx;
                            const cleanForNotebook = (m.content || "")
                              .replace(/\[HANDOFF:[a-z-]+\]\s*/gi, "")
                              .replace(/\[INSIGHT\]\s*/gi, "")
                              .trim();
                            const stageDefs = isRTL ? STAGE_DEFS_HE : STAGE_DEFS_EN;
                            const currentKey = (journey?.reflection as any)?.current as string | undefined;
                            const stageLabel = stageDefs.find((s) => s.key === currentKey)?.label ?? null;
                            const sendToNotebookLabel = isRTL ? "שלח לפנקס" : "Send to notebook";
                            return (
                              <div
                                key={i}
                                className={`group flex gap-2.5 animate-fade-in ${isUser ? "flex-row-reverse" : ""}`}
                              >
                                {!isUser && (
                                  <div className="flex-shrink-0 w-7 h-7 rounded-full overflow-hidden border border-mentor-accent/30 mt-1">
                                    <img src={ELIANA_AVATAR} alt="Eliana" className="w-full h-full object-cover" />
                                  </div>
                                )}
                                <div
                                  className={`max-w-[82%] rounded-2xl px-4 py-2.5 relative ${
                                    isUser
                                      ? "bg-mentor-accent text-mentor-accent-foreground rounded-ee-none"
                                      : "bg-mentor-surface border border-mentor-border/60 text-foreground rounded-ss-none"
                                  }`}
                                >
                                  <div
                                    dir={isRTL ? "rtl" : "ltr"}
                                    className={`prose prose-sm max-w-none prose-p:my-1 prose-ul:my-2 prose-headings:my-2 ${isUser ? "prose-a:text-mentor-accent-foreground prose-a:underline" : "prose-a:text-mentor-accent"} ${isRTL ? "text-right" : "text-left"}`}
                                  >
                                    {isUser ? (
                                      <ReactMarkdown>{m.content || "…"}</ReactMarkdown>
                                    ) : (
                                      <AssistantMarkdown
                                        content={m.content}
                                        animate={animate}
                                        onBotLink={(botKey) => setActiveBotKey(botKey)}
                                        extractBotKey={extractBotKey}
                                      />
                                    )}
                                  </div>
                                  {user && cleanForNotebook && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        window.dispatchEvent(
                                          new CustomEvent("mentor-notebook:append", {
                                            detail: { body: cleanForNotebook, stageLabel },
                                          }),
                                        );
                                        toast.success(isRTL ? "נוסף לפנקס" : "Added to notebook");
                                      }}
                                      title={sendToNotebookLabel}
                                      aria-label={sendToNotebookLabel}
                                      className={`absolute -bottom-2 ${isUser ? (isRTL ? "-left-2" : "-right-2") : isRTL ? "-right-2" : "-left-2"} opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity bg-card border border-mentor-border/60 rounded-full p-1.5 shadow-sm hover:bg-mentor-accent hover:text-mentor-accent-foreground`}
                                    >
                                      <NotebookPen className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          });
                        })()}

                        {/* Typing indicator */}
                        {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
                          <div className="flex gap-2.5 animate-fade-in">
                            <div className="flex-shrink-0 w-7 h-7 rounded-full overflow-hidden border border-mentor-accent/30 mt-1">
                              <img src={ELIANA_AVATAR} alt="Eliana" className="w-full h-full object-cover" />
                            </div>
                            <div className="bg-mentor-surface border border-mentor-border/60 rounded-2xl rounded-ss-none px-4 py-3 flex items-center gap-1">
                              {[0, 1, 2].map((i) => (
                                <span
                                  key={i}
                                  className="w-1.5 h-1.5 rounded-full bg-mentor-accent/60 animate-bounce"
                                  style={{ animationDelay: `${i * 120}ms` }}
                                />
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Handoff fallback banner — shows when mentor named a tool but auto-handoff didn't trigger */}
                    {suggestedBotKey && (
                      <div className="border-t border-mentor-border/60 px-3 md:px-4 py-2.5 bg-mentor-accent/5">
                        <div className="max-w-3xl mx-auto flex items-center justify-between gap-3 flex-wrap">
                          <p className="text-xs md:text-sm text-foreground/80 flex-1 min-w-0">
                            {isRTL
                              ? `נראה שהמנטור רוצה להעביר אותך ל${BOT_LABELS[suggestedBotKey] ?? suggestedBotKey}`
                              : `It looks like the mentor wants to send you to ${BOT_LABELS[suggestedBotKey] ?? suggestedBotKey}`}
                          </p>
                          <Button
                            size="sm"
                            onClick={() => {
                              setActiveBotKey(suggestedBotKey);
                              chatCardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                            }}
                            className="bg-mentor-accent hover:bg-mentor-accent/90 text-mentor-accent-foreground text-xs h-8 px-3 flex-shrink-0"
                          >
                            {isRTL ? "פתח את הכלי" : "Open the tool"}
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Composer */}
                    <div className="border-t border-mentor-border/60 p-3 md:p-4 bg-mentor-surface">
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
                          placeholder={isRTL ? "התשובה שלך תופיע פה" : "Your reply appears here"}
                          className="min-h-[48px] max-h-[140px] resize-none bg-card border-mentor-border/60"
                          disabled={isLoading}
                        />
                        {messages.length > 0 && (
                          <Button
                            variant="ghost"
                            onClick={() => {
                              setMessages([]);
                              setInput("");
                            }}
                            className="flex-shrink-0 text-muted-foreground text-xs h-[48px] px-3"
                          >
                            {isRTL ? "חדש" : "New"}
                          </Button>
                        )}
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

              {/* Mobile accordions */}
              <div className="lg:hidden mt-5 space-y-4">
                <JourneyRail
                  onOpenBot={(botKey) => {
                    setActiveBotKey(botKey);
                    chatCardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                  }}
                />
                <SidebarAccordions benefits={benefits} outcomes={outcomes} compact={false} />
              </div>
            </div>
          </div>
        </section>

        {/* Full Journey Map below the fold */}
        <section
          id="full-journey-map"
          className="container mx-auto px-4 py-10 md:py-14 border-t border-mentor-border/40 scroll-mt-20"
        >
          <div className="max-w-5xl mx-auto mb-4 text-center">
            <h2 className="text-xl md:text-2xl font-serif font-semibold text-foreground">
              {isRTL ? "מפת המסע המלאה" : "The Full Journey Map"}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {isRTL ? "כל השלבים, הכלים והקצב שלך — במבט אחד." : "All the stages, tools, and your pace — at a glance."}
            </p>
          </div>
          <JourneyMap
            onOpenBot={(botKey) => {
              setActiveBotKey(botKey);
              chatCardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
            }}
          />
          <FinalCelebration />
        </section>
      </main>

      <div className="container mx-auto px-4 pb-8">
        {trialRestricted && userPlanInfo.trialActive && !userPlanInfo.hasPaidAccess && (
          <UpgradeInvite onDismiss={() => setTrialRestricted(false)} />
        )}
        {userPlanInfo.plan === "free" && (journey?.completed_stages ?? []).includes("pricing") && <UpgradeInvite />}
        <WebsiteComingSoonCard />
      </div>
      {user && <MentorNotebookPanel />}
      {/* BYOK dialog and "Manage AI key" button removed — server uses GEMINI_API_KEY. */}
      <Footer />
    </div>
  );
}
