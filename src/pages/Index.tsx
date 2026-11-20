import { useLanguage } from "@/contexts/LanguageContext";
import { SEOHead } from "@/components/SEOHead";
import { Header } from "@/components/landing/Header";
import { Hero } from "@/components/landing/Hero";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { AboutFounders } from "@/components/landing/AboutFounders";
import { Benefits } from "@/components/landing/Benefits";
import { Testimonials } from "@/components/landing/Testimonials";
import { CTABanner } from "@/components/landing/CTABanner";
import { Footer } from "@/components/landing/Footer";
import { MentorSection } from "@/components/landing/MentorSection";
import { FAQ } from "@/components/landing/FAQ";
import { homeLd } from "../../netlify/edge-functions/lib/schema";

const Index = () => {
  const { isRTL } = useLanguage();

  return (
    <div dir={isRTL ? "rtl" : "ltr"} className="min-h-screen">
      <SEOHead
        title={
          isRTL
            ? 'שיווק לקליניקה פרטית וליווי עסקי למטפלים | על שפת הקליניקה'
            : "Dr. Ariel Shapira | Clinical Psychologist Guiding Therapists to a Stable Practice"
        }
        description={
          isRTL
            ? 'על שפת הקליניקה: ד"ר אריאל שפירא (פסיכולוג קליני מומחה) ואליענה שפירא מלווים מטפלים ופסיכותרפיסטים לבניית קליניקה פרטית מלאה ויציבה בדרך אתית ומותאמת.'
            : "Dr. Ariel Shapira, clinical psychologist, helps therapists build a thriving private practice without compromising their professional identity."
        }
        canonicalUrl={isRTL ? "/" : "/en"}
        jsonLd={homeLd(isRTL ? "he" : "en")}
        alternates={{ he: "/", en: "/en" }}
      />
      <Header />
      <main>
        <Hero />
        <HowItWorks />
        <MentorSection />
        <Testimonials />
        <AboutFounders />
        <Benefits />
        <FAQ />
        <CTABanner />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
