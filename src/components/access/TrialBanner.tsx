import { Link } from "react-router-dom";
import { Sparkles, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUserPlan } from "@/hooks/useUserPlan";

const PAY_URL = "https://meshulam.co.il/quick_payment?b=692abdd2459224a95d57aef700a015ab";

export function TrialBanner() {
  const { trialActive, hasPaidAccess, trialDaysLeft, loading } = useUserPlan();

  if (loading || hasPaidAccess || !trialActive) return null;

  const urgent = trialDaysLeft <= 1;
  const daysText =
    trialDaysLeft === 0
      ? "היום האחרון בניסיון"
      : trialDaysLeft === 1
        ? "נשאר לך יום אחד בניסיון"
        : `נשארו לך ${trialDaysLeft} ימים בניסיון החינמי`;

  return (
    <div dir="rtl" className="container mx-auto px-4 pt-3">
      <div
        className={`max-w-5xl mx-auto rounded-2xl px-4 py-3 flex flex-wrap items-center justify-between gap-3 border shadow-sm ${
          urgent
            ? "bg-[#ff6f61]/10 border-[#ff6f61]/40"
            : "bg-primary/5 border-primary/20"
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
              urgent ? "bg-[#ff6f61]/20 text-[#ff6f61]" : "bg-primary/10 text-primary"
            }`}
          >
            <Clock className="w-4 h-4" />
          </div>
          <div className="text-sm md:text-base">
            <span className="font-semibold text-foreground">{daysText}</span>
            <span className="text-muted-foreground mr-2">· אחרי כן הגישה תיסגר עד שתשדרגי.</span>
          </div>
        </div>
        <a href={PAY_URL} target="_blank" rel="noreferrer">
          <Button
            size="sm"
            className={`rounded-xl ${
              urgent
                ? "bg-[#ff6f61] hover:bg-[#ff5a4d] text-white"
                : "bg-primary hover:bg-primary/90 text-primary-foreground"
            }`}
          >
            <Sparkles className="w-4 h-4 ms-1" />
            שדרגי עכשיו
          </Button>
        </a>
      </div>
    </div>
  );
}

export default TrialBanner;
