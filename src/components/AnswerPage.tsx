import { Link } from "react-router-dom";
import { SEOHead } from "@/components/SEOHead";
import { Header } from "@/components/landing/Header";
import { Footer } from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export interface AnswerStep {
  name: string;
  text: string;
}

export interface AnswerFAQ {
  q: string;
  a: string;
}

export interface AnswerSection {
  heading: string;
  paragraph?: string;
  bullets?: string[];
}

export interface AnswerPageProps {
  path: string;
  title: string;
  metaDescription: string;
  h1: string;
  intro: string;
  preStepsSection?: AnswerSection;
  postStepsSection?: AnswerSection;
  stepsHeading: string;
  steps: AnswerStep[];
  faqsHeading: string;
  faqs: AnswerFAQ[];
  ctaHeading?: string;
  ctaText?: string;
  ctaButtonLabel?: string;
  ctaButtonHref?: string;
  howToName: string;
  howToDescription: string;
  lang?: "he" | "en";
  dir?: "rtl" | "ltr";
  stepLabel?: string;
}

const DEFAULTS = {
  he: {
    ctaHeading: "איך TherapyKeys עוזר למטפלים",
    ctaText: 'תוכנית "נקודת המפנה" של ד"ר אריאל ואליענה שפירא היא ליווי של 3 חודשים המשלב שינוי פנימי עם כלים שיווקיים אותנטיים.',
    ctaButtonLabel: "לפרטים על תוכנית נקודת המפנה",
    stepLabel: "שלב",
    authors: [
      { "@type": "Person" as const, name: 'ד"ר אריאל שפירא', url: "https://therapykeys.co.il" },
      { "@type": "Person" as const, name: "אליענה שפירא" },
    ],
  },
  en: {
    ctaHeading: "How TherapyKeys helps therapists",
    ctaText: 'The "Turning Point" program by Dr. Ariel Shapira & Eliana Shapira is a 3-month mentorship combining inner change with authentic marketing tools.',
    ctaButtonLabel: "Learn about the Turning Point program",
    stepLabel: "Step",
    authors: [
      { "@type": "Person" as const, name: "Dr. Ariel Shapira", url: "https://therapykeys.co.il" },
      { "@type": "Person" as const, name: "Eliana Shapira" },
    ],
  },
};

export const AnswerPage = ({
  path,
  title,
  metaDescription,
  h1,
  intro,
  preStepsSection,
  postStepsSection,
  stepsHeading,
  steps,
  faqsHeading,
  faqs,
  ctaHeading,
  ctaText,
  ctaButtonLabel,
  ctaButtonHref = "/turning-point",
  howToName,
  howToDescription,
  lang = "he",
  dir,
  stepLabel,
}: AnswerPageProps) => {
  const d = DEFAULTS[lang];
  const pageDir = dir ?? (lang === "he" ? "rtl" : "ltr");
  const canonical = `https://therapykeys.co.il${encodeURI(path)}`;
  const today = new Date().toISOString().split("T")[0];

  const articleLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: h1,
    author: d.authors,
    datePublished: today,
    dateModified: today,
    publisher: {
      "@type": "Organization",
      name: "TherapyKeys",
      logo: { "@type": "ImageObject", url: "https://therapykeys.co.il/og-image.jpg" },
    },
    inLanguage: lang,
    mainEntityOfPage: canonical,
  };

  const howToLd = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: howToName,
    description: howToDescription,
    inLanguage: "he",
    step: steps.map((s, i) => ({
      "@type": "HowToStep",
      position: i + 1,
      name: s.name,
      text: s.text,
    })),
  };

  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  const renderSection = (s: AnswerSection) => (
    <section className="mb-12">
      <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">{s.heading}</h2>
      {s.paragraph && (
        <p className="text-base md:text-lg text-muted-foreground mb-4 leading-relaxed">
          {s.paragraph}
        </p>
      )}
      {s.bullets && (
        <ul className="list-disc pr-6 space-y-2 text-base md:text-lg text-muted-foreground">
          {s.bullets.map((b, i) => (
            <li key={i}>{b}</li>
          ))}
        </ul>
      )}
    </section>
  );

  return (
    <div dir="rtl" className="min-h-screen bg-background">
      <SEOHead
        title={title}
        description={metaDescription}
        canonicalUrl={canonical}
        ogType="article"
        jsonLd={[articleLd, howToLd, faqLd]}
      />
      <Header />
      <main className="pt-24 pb-16">
        <article className="container mx-auto px-4 max-w-3xl">
          <header className="mb-10">
            <h1 className="text-3xl md:text-5xl font-bold text-foreground mb-6 leading-tight">
              {h1}
            </h1>
            <p className="text-lg md:text-xl text-foreground/90 leading-relaxed">{intro}</p>
          </header>

          {preStepsSection && renderSection(preStepsSection)}

          <section className="mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-6">
              {stepsHeading}
            </h2>
            <ol className="space-y-6">
              {steps.map((s, i) => (
                <li key={i} className="border-r-4 border-primary pr-4">
                  <h3 className="text-lg md:text-xl font-semibold text-foreground mb-2">
                    שלב {i + 1}: {s.name}
                  </h3>
                  <p className="text-base text-muted-foreground leading-relaxed">{s.text}</p>
                </li>
              ))}
            </ol>
          </section>

          {postStepsSection && renderSection(postStepsSection)}

          <section className="mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-6">
              {faqsHeading}
            </h2>
            <Accordion type="single" collapsible className="w-full space-y-3">
              {faqs.map((f, i) => (
                <AccordionItem
                  key={i}
                  value={`faq-${i}`}
                  className="bg-card border border-border rounded-lg px-5 shadow-sm"
                >
                  <AccordionTrigger className="text-right text-base md:text-lg font-semibold text-foreground hover:no-underline">
                    {f.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground text-base leading-relaxed pt-2">
                    {f.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </section>

          <section className="bg-secondary rounded-2xl p-8 md:p-10 text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
              {ctaHeading}
            </h2>
            <p className="text-base md:text-lg text-muted-foreground mb-6 leading-relaxed max-w-2xl mx-auto">
              {ctaText}
            </p>
            <Button asChild variant="cta" size="xl">
              <Link to={ctaButtonHref}>{ctaButtonLabel}</Link>
            </Button>
          </section>
        </article>
      </main>
      <Footer />
    </div>
  );
};

export default AnswerPage;
