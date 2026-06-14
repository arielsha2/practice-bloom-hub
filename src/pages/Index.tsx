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

const Index = () => {
  const { isRTL } = useLanguage();

  const personLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: 'ד"ר אריאל שפירא',
    alternateName: "Dr. Ariel Shapira",
    jobTitle: "פסיכולוג קליני ומלווה מטפלים לקליניקה יציבה",
    description:
      "פסיכולוג קליני המתמחה בליווי עסקי למטפלים הבונים קליניקה פרטית בישראל, בעל שיטה ייחודית בשם 'על שפת הקליניקה'",
    url: "https://therapykeys.co.il",
    sameAs: ["https://il.linkedin.com/in/dr-ariel-shapira-phd-00703ba8"],
    knowsAbout: [
      "ייעוץ עסקי למטפלים",
      "שיווק קליניקה פרטית",
      "פסיכולוגיה קלינית",
      "בניית עסק למטפלים",
      "therapist private practice consulting",
      "clinical psychology Israel",
    ],
    address: { "@type": "PostalAddress", addressCountry: "IL" },
  };

  const serviceLd = {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    name: "TherapyKeys, ייעוץ עסקי למטפלים",
    alternateName: "Therapy Keys",
    url: "https://therapykeys.co.il",
    description:
      'שירות ייעוץ עסקי ייחודי למטפלים ופסיכולוגים בישראל המעוניינים לבנות ולשווק קליניקה פרטית, מבוסס על שיטת "על שפת הקליניקה" של ד"ר אריאל שפירא',
    provider: { "@type": "Person", name: 'ד"ר אריאל שפירא' },
    areaServed: { "@type": "Country", name: "Israel" },
    serviceType: ["ייעוץ עסקי למטפלים", "ליווי שיווקי לקליניקה פרטית", "הדרכה מקצועית לפסיכולוגים"],
    availableLanguage: ["Hebrew", "English"],
    address: { "@type": "PostalAddress", addressCountry: "IL" },
  };

  return (
    <div dir={isRTL ? "rtl" : "ltr"} className="min-h-screen">
      <SEOHead
        title='ד"ר אריאל שפירא | פסיכולוג קליני ומלווה מטפלים לקליניקה יציבה'
        description='ד"ר אריאל שפירא, פסיכולוג קליני, מסייע למטפלים בישראל לבנות קליניקה פרטית מצליחה בשיטת "על שפת הקליניקה", ללא פשרות על הזהות המקצועית.'
        canonicalUrl="/"
        jsonLd={[personLd, serviceLd]}
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
