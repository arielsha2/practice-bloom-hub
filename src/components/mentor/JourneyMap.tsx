import { motion } from "framer-motion";
import { Check, Compass, Tag, User, Users, Sparkles, Trophy, AlertCircle, Circle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTherapistJourney } from "@/hooks/useTherapistJourney";
import { Skeleton } from "@/components/ui/skeleton";

interface Stage {
  number: number;
  icon: typeof Compass;
  titleHe: string;
  titleEn: string;
  descHe: string;
  descEn: string;
  botKey?: string;
}

const STAGES: Stage[] = [
  {
    number: 1,
    icon: Compass,
    titleHe: "מציאת הנישה",
    titleEn: "Finding Your Niche",
    descHe: "לדעת בדיוק עם מי אתם רוצים לעבוד ומה הופך אתכם לבחירה הטבעית עבורם.",
    descEn: "Know exactly who you want to work with and why you're the natural choice.",
    botKey: "niche-finder",
  },
  {
    number: 2,
    icon: Tag,
    titleHe: "תמחור נכון",
    titleEn: "Right Pricing",
    descHe: "מחיר ששיקף את הערך שלכם — בלי התלבטות, בלי התנצלות.",
    descEn: "A price that reflects your real value — no hesitation, no apology.",
    botKey: "pricing-calculator",
  },
  {
    number: 3,
    icon: User,
    titleHe: "הצגה עצמית",
    titleEn: "Self-Presentation",
    descHe: "מסר ברור שמושך את האנשים הנכונים מהמילה הראשונה.",
    descEn: "A clear message that attracts the right people from the first word.",
    botKey: "self-presentation",
  },
  {
    number: 4,
    icon: Users,
    titleHe: "רשת מקצועית",
    titleEn: "Professional Network",
    descHe: "אנשי קשר ושותפויות שמזרימים אליכם פניות איכותיות.",
    descEn: "Contacts and partnerships that send you quality referrals.",
    botKey: "contact-finder",
  },
  {
    number: 5,
    icon: Sparkles,
    titleHe: "שיחת היכרות מנצחת",
    titleEn: "Winning First Call",
    descHe: "להפוך פנייה ראשונה למטופל קבוע — בביטחון ובלי לדחוף.",
    descEn: "Turn a first inquiry into a committed client — confidently, without pushing.",
    botKey: "connection-bridge",
  },
];

interface JourneyMapProps {
  onOpenBot?: (botKey: string) => void;
}

export function JourneyMap({ onOpenBot }: JourneyMapProps) {
  const { isRTL } = useLanguage();
  const { journey, loading } = useTherapistJourney();

  const currentStep = journey?.step_number ?? 1;
  const stuckPoints = journey?.stuck_points ?? [];
  const recentStuck = stuckPoints.slice(-3).reverse();
  const hasStarted = !!journey;

  const completedCount = Math.max(0, currentStep - 1);
  const progressPct = Math.round((completedCount / STAGES.length) * 100);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-2 w-full" />
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-24 w-full rounded-2xl" />
        ))}
      </div>
    );
  }

  return (
    <div dir={isRTL ? "rtl" : "ltr"} className={cn("relative", isRTL ? "text-right" : "text-left")}>
      {/* Decorative background blobs */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden -z-0">
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-[40rem] h-[40rem] rounded-full bg-mentor-accent/10 blur-3xl opacity-60" />
        <div className="absolute bottom-0 right-0 w-72 h-72 rounded-full bg-primary/10 blur-3xl opacity-50" />
        <div className="absolute top-1/3 left-0 w-64 h-64 rounded-full bg-accent/10 blur-3xl opacity-40" />
      </div>

      {/* Header */}
      <div className="relative mb-10 text-center">
        <div className="inline-flex items-center gap-2 bg-card/80 backdrop-blur border border-mentor-accent/40 rounded-full px-4 py-1.5 mb-4 shadow-sm">
          <Compass className="w-4 h-4 text-mentor-accent" />
          <span className="text-mentor-accent font-semibold text-xs tracking-wide uppercase">
            {isRTL ? "המסע שלכם" : "Your Journey"}
          </span>
        </div>
        <h2 className="text-3xl md:text-4xl font-serif font-medium text-foreground mb-3 tracking-tight">
          {isRTL ? "מפת המסע האישית שלכם" : "Your Personal Journey Map"}
        </h2>
        <p className="text-base text-muted-foreground max-w-xl mx-auto">
          {hasStarted
            ? isRTL
              ? `אתם כבר בדרך — ${completedCount} מתוך ${STAGES.length} שלבים מאחוריכם.`
              : `You're on the way — ${completedCount} of ${STAGES.length} stages behind you.`
            : isRTL
            ? "המסע מהתלבטות לקליניקה משגשגת — חמישה שלבים, צעד אחרי צעד."
            : "From doubt to a thriving practice — five stages, step by step."}
        </p>

        {/* Progress bar */}
        <div className="max-w-md mx-auto mt-6">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
            <span className="font-medium">{isRTL ? "ההתקדמות שלכם" : "Your progress"}</span>
            <span className="font-bold text-mentor-accent text-sm">{progressPct}%</span>
          </div>
          <div className="h-2.5 bg-mentor-accent/10 rounded-full overflow-hidden shadow-inner">
            <motion.div
              className="h-full bg-gradient-to-r from-mentor-accent via-primary to-mentor-accent rounded-full shadow-[0_0_12px_hsl(var(--mentor-accent)/0.6)]"
              initial={{ width: 0 }}
              animate={{ width: `${progressPct}%` }}
              transition={{ duration: 1.2, ease: [0.4, 0, 0.2, 1] }}
            />
          </div>
        </div>
      </div>

      {/* Vertical timeline */}
      <div className="relative max-w-2xl mx-auto">
        {/* Spine line */}
        <div
          className={cn(
            "absolute top-0 bottom-0 w-[2px] bg-gradient-to-b from-mentor-accent/40 via-mentor-border to-mentor-border/40",
            isRTL ? "right-6 md:right-8" : "left-6 md:left-8"
          )}
          aria-hidden
        />

        <ol className="space-y-5 md:space-y-6">
          {STAGES.map((stage, idx) => {
            const Icon = stage.icon;
            const isCompleted = stage.number < currentStep;
            const isActive = stage.number === currentStep && hasStarted;
            const isUpcoming = stage.number > currentStep || !hasStarted && stage.number > 1;
            const status: "completed" | "active" | "upcoming" = isCompleted
              ? "completed"
              : isActive
              ? "active"
              : "upcoming";

            return (
              <motion.li
                key={stage.number}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: idx * 0.08 }}
                className="relative"
              >
                <div className={cn("flex gap-4 md:gap-5", isRTL && "flex-row")}>
                  {/* Node */}
                  <div className="relative z-10 flex-shrink-0">
                    <div
                      className={cn(
                        "w-12 h-12 md:w-16 md:h-16 rounded-full flex items-center justify-center border-2 shadow-md transition-all duration-500",
                        status === "completed" &&
                          "bg-gradient-to-br from-mentor-accent to-mentor-accent/80 text-mentor-accent-foreground border-mentor-accent",
                        status === "active" &&
                          "bg-card text-mentor-accent border-mentor-accent ring-4 ring-mentor-accent/20",
                        status === "upcoming" &&
                          "bg-mentor-surface text-muted-foreground border-mentor-border"
                      )}
                    >
                      {status === "completed" ? (
                        <Check className="w-5 h-5 md:w-7 md:h-7" />
                      ) : (
                        <Icon className="w-5 h-5 md:w-7 md:h-7" />
                      )}
                    </div>
                    {/* Step number badge */}
                    <span
                      className={cn(
                        "absolute -top-1 text-[10px] md:text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center shadow border",
                        isRTL ? "-left-1" : "-right-1",
                        status === "completed" && "bg-card text-mentor-accent border-mentor-accent",
                        status === "active" && "bg-mentor-accent text-mentor-accent-foreground border-card",
                        status === "upcoming" && "bg-card text-muted-foreground border-mentor-border"
                      )}
                    >
                      {stage.number}
                    </span>
                  </div>

                  {/* Content card */}
                  <div
                    className={cn(
                      "flex-1 rounded-2xl p-4 md:p-5 border transition-all duration-300",
                      status === "completed" &&
                        "bg-mentor-accent/5 border-mentor-accent/30",
                      status === "active" &&
                        "bg-card border-mentor-accent/60 shadow-lg ring-1 ring-mentor-accent/20",
                      status === "upcoming" &&
                        "bg-mentor-surface/40 border-mentor-border/50"
                    )}
                  >
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <h3
                        className={cn(
                          "font-serif text-base md:text-lg font-semibold",
                          status === "upcoming" ? "text-muted-foreground" : "text-foreground"
                        )}
                      >
                        {isRTL ? stage.titleHe : stage.titleEn}
                      </h3>
                      {status === "active" && (
                        <span className="text-[10px] md:text-xs font-bold uppercase tracking-wider bg-mentor-accent text-mentor-accent-foreground px-2 py-0.5 rounded-full">
                          {isRTL ? "כאן אתם עכשיו" : "You are here"}
                        </span>
                      )}
                      {status === "completed" && (
                        <span className="text-[10px] md:text-xs font-medium bg-mentor-accent/15 text-mentor-accent px-2 py-0.5 rounded-full">
                          {isRTL ? "הושלם" : "Completed"}
                        </span>
                      )}
                    </div>
                    <p
                      className={cn(
                        "text-sm leading-relaxed mb-3",
                        status === "upcoming" ? "text-muted-foreground/80" : "text-muted-foreground"
                      )}
                    >
                      {isRTL ? stage.descHe : stage.descEn}
                    </p>

                    {/* Stuck points only for active stage */}
                    {status === "active" && recentStuck.length > 0 && (
                      <div className="mt-3 p-3 rounded-xl bg-destructive/5 border border-destructive/20">
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <AlertCircle className="w-3.5 h-3.5 text-destructive" />
                          <span className="text-xs font-semibold text-destructive">
                            {isRTL ? "נקודות לתשומת לב" : "Sticking points"}
                          </span>
                        </div>
                        <ul className="space-y-1">
                          {recentStuck.map((sp, i) => (
                            <li key={i} className="text-xs text-foreground/80 flex gap-1.5">
                              <Circle className="w-1.5 h-1.5 mt-1.5 fill-destructive text-destructive flex-shrink-0" />
                              <span>{sp}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* CTA to open bot for active stage */}
                    {status === "active" && stage.botKey && onOpenBot && (
                      <button
                        onClick={() => onOpenBot(stage.botKey!)}
                        className="mt-3 inline-flex items-center gap-1.5 text-xs md:text-sm font-semibold text-mentor-accent hover:underline"
                      >
                        {isRTL ? "המשיכו עם הכלי המתאים ←" : "→ Continue with the right tool"}
                      </button>
                    )}
                  </div>
                </div>
              </motion.li>
            );
          })}

          {/* Final outcome */}
          <motion.li
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="relative"
          >
            <div className={cn("flex gap-4 md:gap-5")}>
              <div className="relative z-10 flex-shrink-0">
                <div className="w-12 h-12 md:w-16 md:h-16 rounded-full flex items-center justify-center border-2 border-mentor-accent bg-gradient-to-br from-mentor-accent via-mentor-accent to-primary text-mentor-accent-foreground shadow-xl">
                  <Trophy className="w-6 h-6 md:w-8 md:h-8" />
                </div>
              </div>
              <div className="flex-1 rounded-2xl p-5 md:p-6 border-2 border-mentor-accent/40 bg-gradient-to-br from-mentor-accent/10 via-card to-mentor-accent/5">
                <span className="text-[10px] md:text-xs font-bold uppercase tracking-wider text-mentor-accent">
                  {isRTL ? "התוצאה" : "The Outcome"}
                </span>
                <h3 className="font-serif text-lg md:text-2xl font-semibold text-foreground mt-1 mb-2">
                  {isRTL ? "קליניקה מלאה. ראש שקט. צמיחה אמיתית." : "A full practice. A calm mind. Real growth."}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {isRTL
                    ? "יומן עמוס במטופלים שמתאימים לכם, מחיר שמשקף את הערך שלכם, ופרקטיקה שמתפרנסת בכבוד — בלי להתפשר על מי שאתם."
                    : "A calendar full of clients who fit you, pricing that reflects your value, and a practice that earns with dignity — without compromising who you are."}
                </p>
              </div>
            </div>
          </motion.li>
        </ol>
      </div>
    </div>
  );
}
