import { motion } from "framer-motion";
import { Compass, Tag, User, Users, Sparkles, Trophy, Check, AlertCircle, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTherapistJourney } from "@/hooks/useTherapistJourney";
import { Skeleton } from "@/components/ui/skeleton";

interface Stage {
  key: string;
  icon: typeof Compass;
  titleHe: string;
  titleEn: string;
  descHe: string;
  descEn: string;
  botKey?: string;
}

const STAGES: Stage[] = [
  {
    key: "niche",
    icon: Compass,
    titleHe: "מציאת הנישה",
    titleEn: "Finding Your Niche",
    descHe: "לדעת בדיוק עם מי לעבוד.",
    descEn: "Know who you work with.",
    botKey: "niche-finder",
  },
  {
    key: "pricing",
    icon: Tag,
    titleHe: "תמחור נכון",
    titleEn: "Right Pricing",
    descHe: "מחיר ששיקף ערך.",
    descEn: "Price that reflects value.",
    botKey: "pricing-calculator",
  },
  {
    key: "self-presentation",
    icon: User,
    titleHe: "הצגה עצמית",
    titleEn: "Self-Presentation",
    descHe: "מסר ברור ומדויק.",
    descEn: "Clear, sharp message.",
    botKey: "self-presentation",
  },
  {
    key: "network",
    icon: Users,
    titleHe: "רשת מקצועית",
    titleEn: "Professional Network",
    descHe: "שותפויות שמזרימות פניות.",
    descEn: "Partnerships that refer.",
    botKey: "contact-finder",
  },
  {
    key: "conversion",
    icon: Sparkles,
    titleHe: "שיחת היכרות מנצחת",
    titleEn: "Winning First Call",
    descHe: "להפוך פנייה למטופל.",
    descEn: "Turn inquiry into client.",
    botKey: "connection-bridge",
  },
];

// Horizontal layout on a wide viewBox (1400 x 380) — fits without scroll.
const VB_W = 1400;
const VB_H = 380;
const POSITIONS = STAGES.map((_, i) => ({
  x: 130 + i * ((VB_W - 380) / (STAGES.length - 1)),
  y: i % 2 === 0 ? 170 : 230,
}));
const FINISH = { x: VB_W - 90, y: 200 };

// Smooth curve that gently undulates through each station and finish.
const PATH_D = (() => {
  const pts = [...POSITIONS, FINISH];
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 1; i < pts.length; i++) {
    const prev = pts[i - 1];
    const cur = pts[i];
    const cx1 = prev.x + (cur.x - prev.x) * 0.5;
    const cx2 = prev.x + (cur.x - prev.x) * 0.5;
    d += ` C ${cx1} ${prev.y}, ${cx2} ${cur.y}, ${cur.x} ${cur.y}`;
  }
  return d;
})();

interface JourneyMapProps {
  onOpenBot?: (botKey: string) => void;
}

export function JourneyMap({ onOpenBot }: JourneyMapProps) {
  const { isRTL } = useLanguage();
  const { journey, loading } = useTherapistJourney();

  const completedKeys = new Set(journey?.completed_stages ?? []);
  // current = first non-completed in order, unless journey marks one explicitly via reflection.current
  const explicitCurrent = (journey?.reflection as any)?.current as string | undefined;
  const currentKey =
    explicitCurrent && STAGES.find((s) => s.key === explicitCurrent)
      ? explicitCurrent
      : (STAGES.find((s) => !completedKeys.has(s.key))?.key ?? null);

  const stuckPoints = journey?.stuck_points ?? [];
  const recentStuck = stuckPoints.slice(-3).reverse();
  const hasStarted = !!journey;

  const completedCount = completedKeys.size;
  const progressPct = Math.round((completedCount / STAGES.length) * 100);

  if (loading) {
    return (
      <div className="space-y-3 max-w-5xl mx-auto">
        <Skeleton className="h-8 w-64 mx-auto" />
        <Skeleton className="h-[260px] w-full rounded-2xl" />
      </div>
    );
  }

  const activeStage = STAGES.find((s) => s.key === currentKey);
  // Progress fraction along path: stations are at indices 0..N-1 of POSITIONS, finish at end (length N+1 segments? actually N points + finish = N+1 points => N segments).
  const totalSegments = STAGES.length; // STAGES->FINISH = STAGES.length segments
  const progressSegments = completedCount + (currentKey ? 0.5 : 0);
  const pathProgress = Math.min(1, hasStarted ? progressSegments / totalSegments + 0.04 : 0.02);

  return (
    <div dir={isRTL ? "rtl" : "ltr"} className="relative">
      {/* Header — compact */}
      <div className="relative mb-4 text-center">
        <div className="inline-flex items-center gap-2 bg-card/80 backdrop-blur border border-mentor-accent/40 rounded-full px-3 py-1 mb-2 shadow-sm">
          <Compass className="w-3.5 h-3.5 text-mentor-accent" />
          <span className="text-mentor-accent font-semibold text-[11px] tracking-wide uppercase">
            {isRTL ? "המסע שלכם" : "Your Journey"}
          </span>
        </div>
        <h2 className="text-2xl md:text-3xl font-serif font-medium text-foreground mb-1 tracking-tight">
          {isRTL ? "מפת מסע אישי" : "Your Personal Journey Map"}
        </h2>
        <p className="text-sm text-muted-foreground max-w-xl mx-auto">
          {hasStarted
            ? isRTL
              ? `${completedCount} מתוך ${STAGES.length} תחנות מאחוריכם${activeStage ? ' — אתם נמצאים כעת ב"' + activeStage.titleHe + '"' : ""}.`
              : `${completedCount} of ${STAGES.length} stations behind you${activeStage ? ` — currently at "${activeStage.titleEn}"` : ""}.`
            : isRTL
              ? "המסע מהתלבטות לקליניקה משגשגת — חמש תחנות, שביל אחד."
              : "From doubt to a thriving practice — five stations, one path."}
        </p>
      </div>

      {/* Map container — compact horizontal */}
      <div className="relative max-w-6xl mx-auto rounded-2xl overflow-hidden border border-mentor-border/60 shadow-xl bg-gradient-to-br from-mentor-surface via-card to-mentor-accent/5">
        <div aria-hidden className="absolute inset-0 pointer-events-none opacity-40">
          <div className="absolute -top-20 -left-20 w-64 h-64 rounded-full bg-mentor-accent/20 blur-3xl" />
          <div className="absolute -bottom-20 -right-20 w-64 h-64 rounded-full bg-primary/15 blur-3xl" />
        </div>

        <svg
          viewBox={`0 0 ${VB_W} ${VB_H}`}
          className="relative w-full h-auto block"
          preserveAspectRatio="xMidYMid meet"
          style={isRTL ? { transform: "scaleX(-1)" } : undefined}
        >
          <defs>
            <linearGradient id="pathGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="hsl(var(--mentor-accent))" />
              <stop offset="100%" stopColor="hsl(var(--primary))" />
            </linearGradient>
            <radialGradient id="nodeGradient" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="hsl(var(--mentor-accent))" />
              <stop offset="100%" stopColor="hsl(var(--primary))" />
            </radialGradient>
            <radialGradient id="finishGradient" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="hsl(var(--accent))" />
              <stop offset="100%" stopColor="hsl(var(--mentor-accent))" />
            </radialGradient>
            <filter id="softGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <pattern id="dots" x="0" y="0" width="32" height="32" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1" fill="hsl(var(--mentor-accent))" opacity="0.18" />
            </pattern>
          </defs>

          <rect width={VB_W} height={VB_H} fill="url(#dots)" />

          {/* Background ghost path */}
          <path
            d={PATH_D}
            stroke="hsl(var(--mentor-border))"
            strokeWidth={10}
            strokeLinecap="round"
            fill="none"
            strokeDasharray="2 12"
            opacity={0.55}
          />

          {/* Animated walked path */}
          <motion.path
            d={PATH_D}
            stroke="url(#pathGradient)"
            strokeWidth={8}
            strokeLinecap="round"
            fill="none"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: pathProgress }}
            transition={{ duration: 1.4, ease: [0.4, 0, 0.2, 1] }}
            style={{ filter: "url(#softGlow)" }}
          />

          {/* Stations */}
          {STAGES.map((stage, idx) => {
            const pos = POSITIONS[idx];
            const isCompleted = completedKeys.has(stage.key);
            const isActive = stage.key === currentKey;
            const isUpcoming = !isCompleted && !isActive;
            const hasStuckHere = isActive && recentStuck.length > 0;

            return (
              <motion.g
                key={stage.key}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 + idx * 0.12, type: "spring", stiffness: 130 }}
                style={{ cursor: stage.botKey && (isActive || isCompleted) ? "pointer" : "default" }}
                onClick={() => {
                  if (stage.botKey && onOpenBot && (isActive || isCompleted)) onOpenBot(stage.botKey);
                }}
              >
                {isActive && (
                  <motion.circle
                    cx={pos.x}
                    cy={pos.y}
                    r={48}
                    fill="hsl(var(--mentor-accent))"
                    opacity={0.18}
                    animate={{ r: [42, 60, 42], opacity: [0.28, 0.05, 0.28] }}
                    transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
                  />
                )}
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={32}
                  fill="hsl(var(--card))"
                  stroke={isCompleted || isActive ? "hsl(var(--mentor-accent))" : "hsl(var(--mentor-border))"}
                  strokeWidth={isActive ? 4 : 3}
                  strokeDasharray={isUpcoming ? "5 4" : undefined}
                />
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={24}
                  fill={
                    isCompleted ? "url(#nodeGradient)" : isActive ? "hsl(var(--card))" : "hsl(var(--mentor-surface))"
                  }
                  filter={isActive || isCompleted ? "url(#softGlow)" : undefined}
                />

                {hasStuckHere && (
                  <g transform={`translate(${pos.x - 24}, ${pos.y - 24})`}>
                    <circle r={10} fill="hsl(var(--destructive))" />
                    <text
                      textAnchor="middle"
                      dominantBaseline="central"
                      fontSize="13"
                      fontWeight="900"
                      fill="hsl(var(--destructive-foreground))"
                      style={isRTL ? { transform: "scaleX(-1)", transformOrigin: "center" } : undefined}
                    >
                      !
                    </text>
                  </g>
                )}

                <foreignObject x={pos.x - 14} y={pos.y - 14} width={28} height={28}>
                  <div
                    style={{
                      width: 28,
                      height: 28,
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
                    {isCompleted ? <Check size={20} strokeWidth={3} /> : <stage.icon size={20} />}
                  </div>
                </foreignObject>

                {/* Title — placed alternating above/below to clear path */}
                <foreignObject x={pos.x - 90} y={idx % 2 === 0 ? pos.y + 42 : pos.y - 78} width={180} height={56}>
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
                        fontSize: 15,
                        lineHeight: 1.2,
                        color: isUpcoming ? "hsl(var(--muted-foreground))" : "hsl(var(--foreground))",
                      }}
                    >
                      {isRTL ? stage.titleHe : stage.titleEn}
                    </div>
                    <div
                      style={{ fontSize: 11, color: "hsl(var(--muted-foreground))", marginTop: 2, lineHeight: 1.25 }}
                    >
                      {isRTL ? stage.descHe : stage.descEn}
                    </div>
                  </div>
                </foreignObject>

                {/* "You are here" pin above active */}
                {isActive && (
                  <foreignObject x={pos.x - 70} y={pos.y - 76} width={140} height={26}>
                    <div style={{ transform: isRTL ? "scaleX(-1)" : undefined, textAlign: "center" }}>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                          background: "hsl(var(--mentor-accent))",
                          color: "hsl(var(--mentor-accent-foreground))",
                          padding: "3px 9px",
                          borderRadius: 999,
                          fontSize: 10,
                          fontWeight: 800,
                          letterSpacing: 0.4,
                          textTransform: "uppercase",
                          boxShadow: "0 4px 12px hsl(var(--mentor-accent) / 0.4)",
                        }}
                      >
                        📍 {isRTL ? "כאן עכשיו" : "You are here"}
                      </span>
                    </div>
                  </foreignObject>
                )}
              </motion.g>
            );
          })}

          {/* Finish */}
          <motion.g
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 + STAGES.length * 0.12, type: "spring", stiffness: 130 }}
          >
            <circle cx={FINISH.x} cy={FINISH.y} r={36} fill="url(#finishGradient)" filter="url(#softGlow)" />
            <circle cx={FINISH.x} cy={FINISH.y} r={36} fill="none" stroke="hsl(var(--card))" strokeWidth={3} />
            <foreignObject x={FINISH.x - 16} y={FINISH.y - 16} width={32} height={32}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transform: isRTL ? "scaleX(-1)" : undefined,
                  color: "hsl(var(--mentor-accent-foreground))",
                }}
              >
                <Trophy size={22} strokeWidth={2.2} />
              </div>
            </foreignObject>
            <foreignObject x={FINISH.x - 90} y={FINISH.y + 44} width={180} height={48}>
              <div
                style={{
                  transform: isRTL ? "scaleX(-1)" : undefined,
                  textAlign: "center",
                  direction: isRTL ? "rtl" : "ltr",
                }}
              >
                <div
                  style={{ fontFamily: "Heebo, serif", fontWeight: 700, fontSize: 14, color: "hsl(var(--foreground))" }}
                >
                  {isRTL ? "קליניקה משגשגת" : "Thriving Practice"}
                </div>
                <div style={{ fontSize: 11, color: "hsl(var(--muted-foreground))", marginTop: 2 }}>
                  {isRTL ? "יומן מלא · ראש שקט" : "Full calendar · Peace of mind"}
                </div>
              </div>
            </foreignObject>
          </motion.g>
        </svg>

        {/* Footer — progress + active station */}
        <div className="relative px-4 md:px-6 py-3 border-t border-mentor-border/40 bg-card/60 backdrop-blur">
          <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-1.5">
            <span className="font-medium">{isRTL ? "התקדמות במסע" : "Journey progress"}</span>
            <span className="font-bold text-mentor-accent text-xs">{progressPct}%</span>
          </div>
          <div className="h-2 bg-mentor-accent/10 rounded-full overflow-hidden shadow-inner">
            <motion.div
              className="h-full bg-gradient-to-r from-mentor-accent via-primary to-mentor-accent rounded-full shadow-[0_0_10px_hsl(var(--mentor-accent)/0.6)]"
              initial={{ width: 0 }}
              animate={{ width: `${progressPct}%` }}
              transition={{ duration: 1.1, ease: [0.4, 0, 0.2, 1] }}
            />
          </div>

          {activeStage && (
            <div className="mt-2.5 flex flex-wrap items-center gap-2 justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-mentor-accent" />
                <span className="text-[11px] uppercase tracking-wider text-mentor-accent font-bold">
                  {isRTL ? "התחנה הנוכחית:" : "Currently:"}
                </span>
                <span className="font-serif text-sm font-semibold text-foreground">
                  {isRTL ? activeStage.titleHe : activeStage.titleEn}
                </span>
              </div>
              {activeStage.botKey && onOpenBot && (
                <button
                  onClick={() => onOpenBot(activeStage.botKey!)}
                  className="text-xs font-semibold px-3 py-1.5 rounded-full bg-mentor-accent text-mentor-accent-foreground hover:bg-mentor-accent/90 transition-colors shadow"
                >
                  {isRTL ? "פתחו את הכלי המתאים ←" : "→ Open the right tool"}
                </button>
              )}
            </div>
          )}

          {recentStuck.length > 0 && (
            <div className="mt-2.5 p-2.5 rounded-lg bg-destructive/5 border border-destructive/20">
              <div className="flex items-center gap-1.5 mb-1">
                <AlertCircle className="w-3 h-3 text-destructive" />
                <span className="text-[11px] font-semibold text-destructive">
                  {isRTL ? "נקודות לתשומת לב" : "Sticking points"}
                </span>
              </div>
              <ul className="space-y-0.5">
                {recentStuck.map((sp, i) => (
                  <li key={i} className="text-[11px] text-foreground/80">
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
