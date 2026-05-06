import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { Compass, Calculator, Mic, Users, Handshake, Sparkles, ArrowLeft, ArrowRight } from "lucide-react";

const STAGES_HE = [
  { icon: Compass, title: "מציאת הנישה" },
  { icon: Calculator, title: "תמחור" },
  { icon: Mic, title: "הצגה עצמית" },
  { icon: Users, title: "אנשי קשר להפניות" },
  { icon: Handshake, title: "גשר ההתקשרות" },
];

const STAGES_EN = [
  { icon: Compass, title: "Define Your Niche" },
  { icon: Calculator, title: "Set Your Pricing" },
  { icon: Mic, title: "Self-Presentation" },
  { icon: Users, title: "Referral Contacts" },
  { icon: Handshake, title: "The Connection Bridge" },
];

export function MentorSection() {
  const { isRTL, language } = useLanguage();
  const stages = language === "he" ? STAGES_HE : STAGES_EN;
  const Arrow = isRTL ? ArrowLeft : ArrowRight;

  return (
    <section className="py-20 bg-mentor-bg">
      <div className="container mx-auto px-4">
        <div className="max-w-5xl mx-auto bg-card border border-mentor-border/60 rounded-3xl p-8 md:p-12 shadow-card">
          <div className="text-center max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-mentor-accent/10 border border-mentor-accent/30 rounded-full px-4 py-1.5 mb-5">
              <Sparkles className="w-4 h-4 text-mentor-accent" />
              <span className="text-mentor-accent font-medium text-sm">
                {isRTL ? "חדש: המנטור" : "New: The Mentor"}
              </span>
            </div>
            <h2 className="text-3xl md:text-4xl font-serif font-medium text-foreground mb-4 tracking-tight">
              {isRTL ? "המנטור האישי שלך" : "Your Personal Mentor"}
            </h2>
            <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
              {isRTL
                ? "ליווי אסטרטגי וחם ב‑5 שלבים מוגדרים — מהגדרת נישה ועד סגירת מטופלים. שאלו, רפלקטו, וצמחו בקצב שלכם."
                : "Strategic, warm guidance in 5 defined stages — from niche to signed clients. Ask, reflect, and grow at your pace."}
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-10">
            {stages.map((s, i) => {
              const Icon = s.icon;
              return (
                <div
                  key={i}
                  className="flex flex-col items-center text-center gap-2 p-4 rounded-xl bg-mentor-surface border border-mentor-border/50"
                >
                  <div className="w-11 h-11 rounded-full bg-mentor-accent/15 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-mentor-accent" />
                  </div>
                  <div className="text-xs font-semibold text-mentor-accent">
                    {String(i + 1).padStart(2, "0")}
                  </div>
                  <div className="text-sm font-medium text-foreground leading-tight">{s.title}</div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-center mt-10">
            <Link to="/mentor">
              <Button size="lg" className="bg-mentor-accent hover:bg-mentor-accent/90 text-mentor-accent-foreground gap-2 px-8">
                {isRTL ? "התחילו שיחה עם המנטור" : "Start a conversation with The Mentor"}
                <Arrow className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
