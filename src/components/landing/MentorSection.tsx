import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { Sparkles, ArrowLeft, ArrowRight, TrendingUp, Heart, Clock, Target, Users2 } from "lucide-react";

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

export function MentorSection() {
  const { isRTL, language } = useLanguage();
  const benefits = language === "he" ? BENEFITS_HE : BENEFITS_EN;
  const Arrow = isRTL ? ArrowLeft : ArrowRight;

  return (
    <section className="py-20 bg-mentor-bg">
      <div className="container mx-auto px-4">
        <div className="max-w-5xl mx-auto bg-card border border-mentor-border/60 rounded-3xl p-8 md:p-12 shadow-card">
          <div className="text-center max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-mentor-accent/10 border border-mentor-accent/30 rounded-full px-4 py-1.5 mb-5">
              <Sparkles className="w-4 h-4 text-mentor-accent" />
              <span className="text-mentor-accent font-medium text-sm">{isRTL ? "המנטור" : "The Mentor"}</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-serif font-medium text-foreground mb-4 tracking-tight">
              {isRTL ? "קליניקה מלאה. ראש שקט. צמיחה אמיתית." : "A Full Practice. A Calm Mind. Real Growth."}
            </h2>
            <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
              {isRTL
                ? "המנטור הוא בן הזוג האסטרטגי שלכם, ללוות, לחדד החלטות ולהפוך מטפל מצוין לקליניקה משגשגת. הנה מה שתקבלו:"
                : "The Mentor is your strategic partner, guiding decisions and turning a great therapist into a thriving practice. Here is what you gain:"}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-10">
            {benefits.map((b, i) => {
              const Icon = b.icon;
              return (
                <div key={i} className="flex gap-4 p-5 rounded-xl bg-mentor-surface border border-mentor-border/50">
                  <div className="flex-shrink-0 w-11 h-11 rounded-full bg-mentor-accent/15 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-mentor-accent" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-semibold text-foreground mb-1">{b.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{b.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex flex-col items-center gap-3 mt-10">
            <Link to="/mentor">
              <Button
                size="lg"
                className="bg-mentor-accent hover:bg-mentor-accent/90 text-mentor-accent-foreground gap-2 px-8"
              >
                {isRTL ? "התחילו עכשיו עם המנטור" : "Start now with The Mentor"}
                <Arrow className="w-4 h-4" />
              </Button>
            </Link>
            <p className="text-xs text-muted-foreground"></p>
          </div>
        </div>
      </div>
    </section>
  );
}
