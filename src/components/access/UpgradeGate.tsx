import { Button } from "@/components/ui/button";
import { Lock, Sparkles } from "lucide-react";

const PAY_URL = "https://meshulam.co.il/quick_payment?b=692abdd2459224a95d57aef700a015ab";

interface UpgradeGateProps {
  title?: string;
  message?: string;
}

export function UpgradeGate({ title, message }: UpgradeGateProps) {
  return (
    <div
      dir="rtl"
      className="min-h-[60vh] flex items-center justify-center px-4 py-16 bg-gradient-to-b from-secondary to-background"
    >
      <div className="max-w-lg w-full bg-card rounded-3xl shadow-2xl p-10 text-center border border-primary/10">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
          <Lock className="w-7 h-7 text-primary" />
        </div>
        <h2 className="text-2xl md:text-3xl font-bold text-primary mb-3">
          {title ?? "זה חלק מהמסע המלא עם אליענה"}
        </h2>
        <p className="text-muted-foreground text-base leading-relaxed mb-8">
          {message ??
            "הכלי הזה זמין למי שממשיכות במסע המלא. כל ההיסטוריה והשיחות שלך נשמרות ויחכו לך ברגע שתשדרגי."}
        </p>
        <a href={PAY_URL} target="_blank" rel="noreferrer">
          <Button
            size="lg"
            className="bg-[#ff6f61] hover:bg-[#ff5a4d] text-white px-8 py-6 text-base rounded-xl shadow-lg"
          >
            <Sparkles className="w-4 h-4 ms-2" />
            המשיכי את המסע
          </Button>
        </a>
        <p className="text-xs text-muted-foreground mt-6">תשלום מאובטח דרך משולם</p>
      </div>
    </div>
  );
}

export default UpgradeGate;
