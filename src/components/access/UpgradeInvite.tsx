import { useState } from "react";
import { Button } from "@/components/ui/button";
import { X, Heart } from "lucide-react";

const PAY_URL = "https://meshulam.co.il/quick_payment?b=692abdd2459224a95d57aef700a015ab";

interface UpgradeInviteProps {
  onDismiss?: () => void;
}

export function UpgradeInvite({ onDismiss }: UpgradeInviteProps) {
  const [hidden, setHidden] = useState(false);
  if (hidden) return null;

  const dismiss = () => {
    setHidden(true);
    onDismiss?.();
  };

  return (
    <div
      dir="rtl"
      className="max-w-3xl mx-auto my-6 bg-gradient-to-br from-primary/5 via-card to-[#ff6f61]/5 border border-primary/20 rounded-2xl p-6 md:p-8 shadow-md relative"
    >
      <button
        onClick={dismiss}
        aria-label="סגירה"
        className="absolute top-3 left-3 text-muted-foreground hover:text-foreground transition"
      >
        <X className="w-4 h-4" />
      </button>

      <div className="flex items-start gap-3 mb-3">
        <div className="w-10 h-10 rounded-full bg-[#ff6f61]/10 flex items-center justify-center shrink-0">
          <Heart className="w-5 h-5 text-[#ff6f61]" />
        </div>
        <div>
          <h3 className="text-lg md:text-xl font-bold text-primary mb-1">
            יש לי הרגשה שאת מוכנה להמשיך
          </h3>
        </div>
      </div>

      <p className="text-base leading-relaxed text-foreground/90 mb-5">
        סיימנו את עבודת התמחור יחד, ואני כבר מרגישה שיש לך הרבה יותר בהירות בנושא הזה.
        יש עוד כל כך הרבה שאפשר לעבוד עליו יחד – קהל יעד, ניסוחים, שיווק מודע.
        אם את מוכנה להמשיך, אני כאן.
      </p>

      <div className="flex flex-wrap gap-3">
        <a href={PAY_URL} target="_blank" rel="noreferrer">
          <Button className="bg-[#ff6f61] hover:bg-[#ff5a4d] text-white rounded-xl px-6">
            המשיכי את המסע
          </Button>
        </a>
        <Button variant="ghost" onClick={dismiss} className="text-muted-foreground">
          לא עכשיו
        </Button>
      </div>
    </div>
  );
}

export default UpgradeInvite;
