import { Check } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface SignupStepperProps {
  current: 1 | 2 | 3 | 4;
  showStep4: boolean;
  /** Diagnosis entry point skips password setup entirely (see SignupFlow) — just email + verify. */
  skipPassword?: boolean;
}

const LABELS_HE = ["מייל", "אימות", "סיסמה", "מפתח AI"] as const;
const LABELS_EN = ["Email", "Verify", "Password", "AI Key"] as const;

export function SignupStepper({ current, showStep4, skipPassword }: SignupStepperProps) {
  const { isRTL } = useLanguage();
  const LABELS = isRTL ? LABELS_HE : LABELS_EN;
  const steps = skipPassword ? 2 : showStep4 ? 4 : 3;
  return (
    <ol
      className="flex items-center justify-center gap-2 mb-6"
      aria-label={isRTL ? "שלבי ההרשמה" : "Signup steps"}
    >
      {Array.from({ length: steps }, (_, i) => i + 1).map((n) => {
        const isDone = n < current;
        const isActive = n === current;
        return (
          <li key={n} className="flex items-center gap-2" aria-current={isActive ? "step" : undefined}>
            <span
              className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold transition-colors ${
                isDone
                  ? "bg-primary text-primary-foreground"
                  : isActive
                    ? "bg-primary/15 text-primary border-2 border-primary"
                    : "bg-muted text-muted-foreground"
              }`}
            >
              {isDone ? <Check className="w-3.5 h-3.5" /> : n}
            </span>
            <span
              className={`text-xs hidden sm:inline ${isActive ? "font-semibold text-foreground" : "text-muted-foreground"}`}
            >
              {LABELS[n - 1]}
            </span>
            {n < steps && <span className="w-4 h-px bg-border" />}
          </li>
        );
      })}
    </ol>
  );
}
