import { useEffect } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { Sparkles, Lock, Calendar, Check, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useUserPlan } from "@/hooks/useUserPlan";
import { SEOHead } from "@/components/SEOHead";

const PAY_URL = "https://meshulam.co.il/quick_payment?b=692abdd2459224a95d57aef700a015ab";

const INCLUDED = [
  "המנטור אליענה — שיחות אישיות בלי הגבלה",
  "מחשבון התמחור — לדעת בדיוק מה לבקש",
  "כל ההיסטוריה שלך נשמרת גם אחרי הניסיון",
];

const LOCKED = [
  { title: "מציאת נישה", desc: "לזקק את המטופל שאת/ה הכי טוב/ה איתו" },
  { title: "הצגה עצמית", desc: "נוסח קצר וחד שמרגיש כמוך" },
  { title: "רשת קשרים", desc: "מי הם 10 האנשים שיביאו לך פניות" },
  { title: "שיחת המרה", desc: "סימולציה של פגישת היכרות עד שיהיה זורם" },
];

export default function Welcome() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { hasPaidAccess, trialDaysLeft, loading: planLoading } = useUserPlan();

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth?intent=trial", { replace: true });
  }, [user, authLoading, navigate]);

  if (!planLoading && hasPaidAccess) return <Navigate to="/mentor" replace />;

  return (
    <div dir="rtl" className="min-h-screen bg-gradient-to-b from-secondary to-background">
      <SEOHead
        title="ברוכים הבאים | המסע שלך מתחיל — TherapyKeys"
        description="התחלת את 8 ימי הניסיון החינמי עם המנטור אליענה. הנה איך להתחיל ומה מחכה לך בהמשך."
        canonicalUrl="/welcome"
        noindex
      />

      <main className="container mx-auto px-4 py-16 max-w-3xl">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-2 mb-5">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-primary font-semibold text-sm">
              {trialDaysLeft > 0 ? `${trialDaysLeft} ימי ניסיון התחילו` : "הניסיון החינמי שלך מתחיל"}
            </span>
          </div>
          <h1 className="text-3xl md:text-5xl font-serif font-semibold text-primary mb-4 leading-tight">
            ברוכים הבאים למסע
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
            במשך 8 הימים הקרובים יש לך גישה מלאה למנטור ולמחשבון התמחור. בלי כרטיס אשראי, בלי מחויבות.
          </p>
        </div>

        {/* Card 1 — מה כלול */}
        <section className="bg-card rounded-3xl border border-primary/10 shadow-card p-8 mb-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-xl font-serif font-semibold text-foreground">8 ימים מתנה — מה כלול</h2>
          </div>
          <ul className="space-y-3">
            {INCLUDED.map((line, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <span className="text-foreground">{line}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Card 2 — נעול */}
        <section className="bg-card rounded-3xl border border-primary/10 shadow-card p-8 mb-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
              <Lock className="w-5 h-5 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-serif font-semibold text-foreground">מה נשאר נעול בינתיים</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            הכלים הבאים נפתחים עם שדרוג למסע המלא — וכל מה שתעשי בניסיון נשמר ומחכה לך.
          </p>
          <div className="grid sm:grid-cols-2 gap-3">
            {LOCKED.map((b, i) => (
              <div key={i} className="bg-secondary/50 rounded-xl p-4 border border-border/50">
                <h3 className="font-semibold text-foreground text-sm mb-1">{b.title}</h3>
                <p className="text-xs text-muted-foreground">{b.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Card 3 — אחרי הניסיון */}
        <section className="bg-gradient-to-br from-primary/5 to-[#ff6f61]/5 rounded-3xl border border-primary/10 shadow-card p-8 mb-8">
          <h2 className="text-xl font-serif font-semibold text-foreground mb-3">מה קורה אחרי 8 הימים?</h2>
          <p className="text-foreground/80 leading-relaxed mb-5">
            אם תבחרי להמשיך — תקבלי גישה לכל הכלים, לקבוצת המטפלים, ולליווי המלא. אם לא — לא קורה כלום, אף אחד לא יחייב אותך.
          </p>
          <a href={PAY_URL} target="_blank" rel="noreferrer">
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl border-primary/30 text-primary hover:bg-primary/5"
            >
              ראי את המסלול המלא
            </Button>
          </a>
        </section>

        {/* Main CTA */}
        <div className="text-center">
          <Link to="/mentor">
            <Button
              size="lg"
              className="bg-[#ff6f61] hover:bg-[#ff5a4d] text-white px-10 py-6 text-base rounded-xl shadow-lg group"
            >
              התחילי עכשיו עם המנטור
              <ArrowLeft className="w-4 h-4 me-2 transition-transform group-hover:-translate-x-1" />
            </Button>
          </Link>
          <p className="text-xs text-muted-foreground mt-4">
            המנטור זמין 24/7 — את יכולה לחזור מתי שתרצי.
          </p>
        </div>
      </main>
    </div>
  );
}
