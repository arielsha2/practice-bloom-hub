import { useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { SEOHead } from "@/components/SEOHead";
import { trackEvent } from "@/lib/analytics";
import { NEXT_CHALLENGE } from "@/lib/challengeRound";

// What anyone sees at the challenge tool links once the challenge has ended (see src/lib/challengeRound.ts): no
// sign-up, no tool, just the news and the way to the next round. Tagged ?src=tools-closed on the way to the landing
// page, so the registrations from here can be told apart.
const ChallengeToolsClosed = ({ tool }: { tool: "card" | "letter" }) => {
  useEffect(() => {
    trackEvent("challenge_tools_closed_view", { tool });
  }, [tool]);

  return (
    <div dir="rtl" className="min-h-screen bg-mentor-bg font-body text-foreground">
      <SEOHead
        title="האתגר הסתיים | על שפת הקליניקה"
        description="האתגר הסתיים. האתגר הבא: 20-24 בדצמבר, חמישה ימים, חינם."
        canonicalUrl={`/challenge-tools/${tool}`}
        noindex
      />
      <div className="mx-auto flex min-h-screen max-w-xl flex-col justify-center px-5 py-16 text-center">
        <p className="section-eyebrow justify-center">אתגר להיות מומחה מבוקש</p>
        <h1 className="font-display text-4xl leading-tight text-primary md:text-5xl">האתגר הסתיים</h1>
        <p className="mt-5 text-lg leading-[1.9] text-foreground/85">
          תודה לכל מי שהשתתף. כלי כרטיס הביקור והמראה היו חלק מהאתגר, והגישה אליהם נסגרה עם סיומו.
        </p>

        <div className="card-asym mt-10 border border-accent/40 bg-accent/10 p-7">
          <p className="text-sm font-semibold tracking-wide text-accent">האתגר הבא</p>
          <p className="mt-2 font-display text-3xl text-primary">{NEXT_CHALLENGE.dates}</p>
          <p className="mt-2 leading-relaxed text-muted-foreground">חמישה ימים, חינם. {NEXT_CHALLENGE.workshop}.</p>
          <p className="mt-4 leading-relaxed">מוזמנים להצטרף. ההרשמה והפרטים בדף האתגר.</p>
          <Link
            to={`${NEXT_CHALLENGE.landingPath}?src=tools-closed`}
            onClick={() => trackEvent("challenge_tools_closed_click", { tool })}
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#ff6f61] px-8 py-4 text-lg font-semibold text-white shadow-lg transition-colors hover:bg-[#ff5a4d] sm:w-auto"
          >
            לדף האתגר ולהרשמה
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ChallengeToolsClosed;
