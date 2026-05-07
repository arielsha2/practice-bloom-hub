import { motion } from "framer-motion";
import { Compass, Tag, User, Users, Sparkles, Trophy, Check, AlertCircle } from "lucide-react";
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
    descHe: "לדעת בדיוק עם מי אתם רוצים לעבוד.",
    descEn: "Know exactly who you want to work with.",
    botKey: "niche-finder",
  },
  {
    number: 2,
    icon: Tag,
    titleHe: "תמחור נכון",
    titleEn: "Right Pricing",
    descHe: "מחיר ששיקף את הערך שלכם.",
    descEn: "Pricing that reflects your value.",
    botKey: "pricing-calculator",
  },
  {
    number: 3,
    icon: User,
    titleHe: "הצגה עצמית",
    titleEn: "Self-Presentation",
    descHe: "מסר ברור שמושך את הנכונים.",
    descEn: "A message that attracts the right people.",
    botKey: "self-presentation",
  },
  {
    number: 4,
    icon: Users,
    titleHe: "רשת מקצועית",
    titleEn: "Professional Network",
    descHe: "שותפויות שמזרימות אליכם פניות.",
    descEn: "Partnerships that send referrals.",
    botKey: "contact-finder",
  },
  {
    number: 5,
    icon: Sparkles,
    titleHe: "שיחת היכרות מנצחת",
    titleEn: "Winning First Call",
    descHe: "להפוך פנייה ראשונה למטופל קבוע.",
    descEn: "Turn first inquiry into a client.",
    botKey: "connection-bridge",
  },
];

// Hand-tuned positions on a 1000x1400 viewBox — winding S-curve path.
const POSITIONS = [
  { x: 200, y: 180 },
  { x: 760, y: 380 },
  { x: 220, y: 600 },
  { x: 780, y: 820 },
  { x: 240, y: 1040 },
];
const FINISH = { x: 720, y: 1260 };

// Smooth winding path through all stations + finish.
const PATH_D = `
  M ${POSITIONS[0].x} ${POSITIONS[0].y}
  C 500 200, 600 260, ${POSITIONS[1].x} ${POSITIONS[1].y}
  C 900 480, 350 480, ${POSITIONS[2].x} ${POSITIONS[2].y}
  C 100 700, 600 720, ${POSITIONS[3].x} ${POSITIONS[3].y}
  C 900 920, 350 920, ${POSITIONS[4].x} ${POSITIONS[4].y}
  C 100 1140, 600 1160, ${FINISH.x} ${FINISH.y}
`.trim();

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
      <div className="space-y-4 max-w-4xl mx-auto">
        <Skeleton className="h-10 w-64 mx-auto" />
        <Skeleton className="h-[700px] w-full rounded-3xl" />
      </div>
    );
  }

  // Active stage details for sidebar
  const activeStage = STAGES.find((s) => s.number === currentStep && hasStarted);

  return (
    <div dir={isRTL ? "rtl" : "ltr"} className="relative">
      {/* Header */}
      <div className="relative mb-8 text-center">
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
              ? `אתם כבר בדרך — ${completedCount} מתוך ${STAGES.length} תחנות מאחוריכם.`
              : `You're on the way — ${completedCount} of ${STAGES.length} stations behind you.`
            : isRTL
            ? "המסע מהתלבטות לקליניקה משגשגת — חמש תחנות, שביל אחד."
            : "From doubt to a thriving practice — five stations, one path."}
        </p>
      </div>

      {/* Map container */}
      <div className="relative max-w-4xl mx-auto rounded-3xl overflow-hidden border border-mentor-border/60 shadow-2xl bg-gradient-to-br from-mentor-surface via-card to-mentor-accent/5">
        {/* Decorative texture */}
        <div aria-hidden className="absolute inset-0 pointer-events-none opacity-40">
          <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-mentor-accent/20 blur-3xl" />
          <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-primary/15 blur-3xl" />
          <div className="absolute top-1/3 right-1/4 w-72 h-72 rounded-full bg-accent/10 blur-3xl" />
        </div>

        {/* Compass rose decoration top corner */}
        <div
          aria-hidden
          className={cn(
            "absolute top-4 opacity-20 text-mentor-accent",
            isRTL ? "left-4" : "right-4"
          )}
        >
          <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
            <circle cx="28" cy="28" r="26" stroke="currentColor" strokeWidth="1" />
            <circle cx="28" cy="28" r="18" stroke="currentColor" strokeWidth="0.5" strokeDasharray="2 3" />
            <path d="M28 4 L31 28 L28 52 L25 28 Z" fill="currentColor" opacity="0.4" />
            <path d="M4 28 L28 25 L52 28 L28 31 Z" fill="currentColor" opacity="0.25" />
            <circle cx="28" cy="28" r="2" fill="currentColor" />
          </svg>
        </div>

        {/* SVG MAP */}
        <svg
          viewBox="0 0 1000 1400"
          className="relative w-full h-auto block"
          preserveAspectRatio="xMidYMid meet"
          style={isRTL ? { transform: "scaleX(-1)" } : undefined}
        >
          <defs>
            {/* Gradients */}
            <linearGradient id="pathGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--mentor-accent))" stopOpacity="1" />
              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="1" />
            </linearGradient>
            <radialGradient id="nodeGradient" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="hsl(var(--mentor-accent))" />
              <stop offset="100%" stopColor="hsl(var(--primary))" />
            </radialGradient>
            <radialGradient id="finishGradient" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="hsl(var(--accent))" />
              <stop offset="100%" stopColor="hsl(var(--mentor-accent))" />
            </radialGradient>
            {/* Glow filter */}
            <filter id="softGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="strongGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="10" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            {/* Dotted topo background pattern */}
            <pattern id="dots" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1" fill="hsl(var(--mentor-accent))" opacity="0.18" />
            </pattern>
          </defs>

          {/* Background dotted pattern */}
          <rect width="1000" height="1400" fill="url(#dots)" />

          {/* "Topographic" wavy decorative lines */}
          {[0, 1, 2, 3, 4].map((i) => (
            <path
              key={`topo-${i}`}
              d={`M 0 ${100 + i * 280} C 250 ${50 + i * 280}, 750 ${200 + i * 280}, 1000 ${120 + i * 280}`}
              stroke="hsl(var(--mentor-accent))"
              strokeOpacity="0.07"
              strokeWidth="1.5"
              fill="none"
            />
          ))}

          {/* Background path (ghost / not yet walked) */}
          <path
            d={PATH_D}
            stroke="hsl(var(--mentor-border))"
            strokeWidth="14"
            strokeLinecap="round"
            fill="none"
            strokeDasharray="2 14"
            opacity="0.55"
          />

          {/* Foreground path: progress walked (animated dash reveal) */}
          <motion.path
            d={PATH_D}
            stroke="url(#pathGradient)"
            strokeWidth="10"
            strokeLinecap="round"
            fill="none"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: hasStarted ? completedCount / STAGES.length + 0.06 : 0.02 }}
            transition={{ duration: 1.6, ease: [0.4, 0, 0.2, 1] }}
            style={{ filter: "url(#softGlow)" }}
          />

          {/* Stations */}
          {STAGES.map((stage, idx) => {
            const pos = POSITIONS[idx];
            const isCompleted = stage.number < currentStep;
            const isActive = stage.number === currentStep && hasStarted;
            const isUpcoming = !isCompleted && !isActive;
            const hasStuckHere = isActive && recentStuck.length > 0;

            return (
              <motion.g
                key={stage.number}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 + idx * 0.18, type: "spring", stiffness: 120 }}
                style={{ cursor: stage.botKey && (isActive || isCompleted) ? "pointer" : "default" }}
                onClick={() => {
                  if (stage.botKey && onOpenBot && (isActive || isCompleted)) {
                    onOpenBot(stage.botKey);
                  }
                }}
              >
                {/* Pulsing halo for active station */}
                {isActive && (
                  <>
                    <motion.circle
                      cx={pos.x}
                      cy={pos.y}
                      r={70}
                      fill="hsl(var(--mentor-accent))"
                      opacity={0.18}
                      animate={{ r: [60, 90, 60], opacity: [0.25, 0.05, 0.25] }}
                      transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
                    />
                    <circle cx={pos.x} cy={pos.y} r={56} fill="hsl(var(--mentor-accent))" opacity="0.12" />
                  </>
                )}

                {/* Outer ring */}
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={46}
                  fill="hsl(var(--card))"
                  stroke={
                    isCompleted
                      ? "hsl(var(--mentor-accent))"
                      : isActive
                      ? "hsl(var(--mentor-accent))"
                      : "hsl(var(--mentor-border))"
                  }
                  strokeWidth={isActive ? 4 : 3}
                  strokeDasharray={isUpcoming ? "5 4" : undefined}
                />

                {/* Inner filled disk */}
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={36}
                  fill={
                    isCompleted
                      ? "url(#nodeGradient)"
                      : isActive
                      ? "hsl(var(--card))"
                      : "hsl(var(--mentor-surface))"
                  }
                  filter={isActive || isCompleted ? "url(#softGlow)" : undefined}
                />

                {/* Station number badge */}
                <g transform={`translate(${pos.x + 32}, ${pos.y - 32})`}>
                  <circle
                    r={14}
                    fill={
                      isCompleted || isActive
                        ? "hsl(var(--mentor-accent))"
                        : "hsl(var(--card))"
                    }
                    stroke={
                      isCompleted || isActive
                        ? "hsl(var(--card))"
                        : "hsl(var(--mentor-border))"
                    }
                    strokeWidth={2}
                  />
                  <text
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize="14"
                    fontWeight="800"
                    fill={
                      isCompleted || isActive
                        ? "hsl(var(--mentor-accent-foreground))"
                        : "hsl(var(--muted-foreground))"
                    }
                    style={isRTL ? { transform: "scaleX(-1)", transformOrigin: "center" } : undefined}
                  >
                    {stage.number}
                  </text>
                </g>

                {/* Stuck warning marker */}
                {hasStuckHere && (
                  <g transform={`translate(${pos.x - 32}, ${pos.y - 32})`}>
                    <circle r={13} fill="hsl(var(--destructive))" />
                    <text
                      textAnchor="middle"
                      dominantBaseline="central"
                      fontSize="16"
                      fontWeight="900"
                      fill="hsl(var(--destructive-foreground))"
                      style={isRTL ? { transform: "scaleX(-1)", transformOrigin: "center" } : undefined}
                    >
                      !
                    </text>
                  </g>
                )}

                {/* Icon (rendered as foreignObject to use lucide) */}
                <foreignObject x={pos.x - 18} y={pos.y - 18} width={36} height={36}>
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transform: isRTL ? "scaleX(-1)" : undefined,
                      color: isCompleted
                        ? "hsl(var(--mentor-accent-foreground))"
                        : isActive
                        ? "hsl(var(--mentor-accent))"
                        : "hsl(var(--muted-foreground))",
                    }}
                  >
                    {isCompleted ? (
                      <Check size={28} strokeWidth={3} />
                    ) : (
                      <stage.icon size={26} />
                    )}
                  </div>
                </foreignObject>

                {/* Title label — placed alternating above/below to avoid path */}
                <foreignObject
                  x={pos.x - 130}
                  y={idx % 2 === 0 ? pos.y + 56 : pos.y - 110}
                  width={260}
                  height={60}
                >
                  <div
                    style={{
                      transform: isRTL ? "scaleX(-1)" : undefined,
                      direction: isRTL ? "rtl" : "ltr",
                      textAlign: "center",
                    }}
                  >
                    <div
                      style={{
                        fontFamily: "Heebo, serif",
                        fontWeight: 700,
                        fontSize: 19,
                        lineHeight: 1.2,
                        color: isUpcoming
                          ? "hsl(var(--muted-foreground))"
                          : "hsl(var(--foreground))",
                      }}
                    >
                      {isRTL ? stage.titleHe : stage.titleEn}
                    </div>
                    <div
                      style={{
                        fontSize: 13,
                        color: "hsl(var(--muted-foreground))",
                        marginTop: 4,
                        lineHeight: 1.3,
                      }}
                    >
                      {isRTL ? stage.descHe : stage.descEn}
                    </div>
                  </div>
                </foreignObject>

                {/* "You are here" floating tag */}
                {isActive && (
                  <foreignObject x={pos.x - 80} y={pos.y - 88} width={160} height={32}>
                    <div
                      style={{
                        transform: isRTL ? "scaleX(-1)" : undefined,
                        textAlign: "center",
                      }}
                    >
                      <span
                        style={{
                          display: "inline-block",
                          background: "hsl(var(--mentor-accent))",
                          color: "hsl(var(--mentor-accent-foreground))",
                          padding: "4px 12px",
                          borderRadius: 999,
                          fontSize: 11,
                          fontWeight: 800,
                          letterSpacing: 0.5,
                          textTransform: "uppercase",
                          boxShadow: "0 4px 14px hsl(var(--mentor-accent) / 0.45)",
                        }}
                      >
                        {isRTL ? "כאן אתם עכשיו" : "You are here"}
                      </span>
                    </div>
                  </foreignObject>
                )}
              </motion.g>
            );
          })}

          {/* Finish flag */}
          <motion.g
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 + STAGES.length * 0.18, type: "spring", stiffness: 120 }}
          >
            <circle
              cx={FINISH.x}
              cy={FINISH.y}
              r={56}
              fill="url(#finishGradient)"
              filter="url(#strongGlow)"
            />
            <circle
              cx={FINISH.x}
              cy={FINISH.y}
              r={56}
              fill="none"
              stroke="hsl(var(--card))"
              strokeWidth={4}
            />
            <foreignObject x={FINISH.x - 24} y={FINISH.y - 24} width={48} height={48}>
              <div
                style={{
                  width: 48,
                  height: 48,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transform: isRTL ? "scaleX(-1)" : undefined,
                  color: "hsl(var(--mentor-accent-foreground))",
                }}
              >
                <Trophy size={36} strokeWidth={2.2} />
              </div>
            </foreignObject>
            <foreignObject x={FINISH.x - 160} y={FINISH.y + 70} width={320} height={70}>
              <div
                style={{
                  transform: isRTL ? "scaleX(-1)" : undefined,
                  textAlign: "center",
                  direction: isRTL ? "rtl" : "ltr",
                }}
              >
                <div
                  style={{
                    fontFamily: "Heebo, serif",
                    fontWeight: 700,
                    fontSize: 20,
                    color: "hsl(var(--foreground))",
                  }}
                >
                  {isRTL ? "קליניקה משגשגת" : "A Thriving Practice"}
                </div>
                <div style={{ fontSize: 13, color: "hsl(var(--muted-foreground))", marginTop: 4 }}>
                  {isRTL ? "יומן מלא · מחיר הוגן · ראש שקט" : "Full calendar · Fair pricing · Peace of mind"}
                </div>
              </div>
            </foreignObject>
          </motion.g>
        </svg>

        {/* Progress + active station footer */}
        <div className="relative px-5 md:px-8 py-5 border-t border-mentor-border/40 bg-card/60 backdrop-blur">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
            <span className="font-medium">{isRTL ? "התקדמות במסע" : "Journey progress"}</span>
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

          {activeStage && (
            <div className="mt-4 flex flex-wrap items-center gap-3 justify-between">
              <div>
                <div className="text-xs uppercase tracking-wider text-mentor-accent font-bold">
                  {isRTL ? "התחנה הנוכחית" : "Current station"}
                </div>
                <div className="font-serif text-lg font-semibold text-foreground">
                  {isRTL ? activeStage.titleHe : activeStage.titleEn}
                </div>
              </div>
              {activeStage.botKey && onOpenBot && (
                <button
                  onClick={() => onOpenBot(activeStage.botKey!)}
                  className="text-sm font-semibold px-4 py-2 rounded-full bg-mentor-accent text-mentor-accent-foreground hover:bg-mentor-accent/90 transition-colors shadow"
                >
                  {isRTL ? "המשיכו עם הכלי המתאים ←" : "→ Continue with the right tool"}
                </button>
              )}
            </div>
          )}

          {recentStuck.length > 0 && (
            <div className="mt-4 p-3 rounded-xl bg-destructive/5 border border-destructive/20">
              <div className="flex items-center gap-1.5 mb-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-destructive" />
                <span className="text-xs font-semibold text-destructive">
                  {isRTL ? "נקודות לתשומת לב במסע" : "Sticking points on the path"}
                </span>
              </div>
              <ul className="space-y-1">
                {recentStuck.map((sp, i) => (
                  <li key={i} className="text-xs text-foreground/80">
                    • {sp}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
