import { ArrowDown } from "lucide-react";
import step1Img from "@/assets/byok/step1-create-key.jpg";
import step2Img from "@/assets/byok/step2-copy-key.jpg";
import step3Img from "@/assets/byok/step3-paste.jpg";

const steps = [
  {
    n: 1,
    img: step1Img,
    text: 'היכנס/י ל-Google AI Studio ולחץ/י על "Create API key" בפינה הימנית העליונה.',
  },
  {
    n: 2,
    img: step2Img,
    text: 'בדיאלוג שנפתח לחץ/י על "Copy key" בתחתית.',
  },
  {
    n: 3,
    img: step3Img,
    text: "חזור/י לכאן — המפתח יזוהה אוטומטית, או הדבק/י ידנית בשדה למטה.",
  },
];

export function ByokVisualGuide() {
  return (
    <div className="space-y-1">
      <p className="text-sm font-medium text-foreground text-center mb-2">
        3 צעדים פשוטים — לוקח כ-2 דקות
      </p>
      <div className="flex flex-col items-stretch gap-1">
        {steps.map((s, i) => (
          <div key={s.n}>
            <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-2.5">
              <div className="w-8 h-8 shrink-0 rounded-full bg-primary text-primary-foreground text-sm font-bold flex items-center justify-center shadow">
                {s.n}
              </div>
              <p className="flex-1 text-sm text-foreground leading-snug text-right">
                {s.text}
              </p>
              <img
                src={s.img}
                alt={`שלב ${s.n}`}
                loading="lazy"
                width={120}
                height={72}
                className="w-20 h-14 object-cover rounded-md border border-border bg-muted shrink-0"
              />
            </div>
            {i < steps.length - 1 && (
              <div className="flex justify-center py-0.5" aria-hidden>
                <ArrowDown className="w-4 h-4 text-muted-foreground" />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default ByokVisualGuide;
