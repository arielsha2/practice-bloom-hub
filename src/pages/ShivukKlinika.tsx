import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
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
import { contentPath } from "../../netlify/edge-functions/lib/slug";
import {
  ABOUT,
  CTA,
  FAQS,
  groupArticles,
  INTRO,
  PILLAR_DESCRIPTION,
  PILLAR_H1,
  PILLAR_TITLE,
  PILLAR_URL,
  pillarJsonLd,
  STEPS,
  TOC,
  WHY,
  type PillarArticle,
} from "../../netlify/edge-functions/lib/pillar-clinic-marketing";

// The page's text, its topics and its structured data live in netlify/edge-functions/lib/pillar-clinic-marketing.ts
// (also used by the build step that writes the text into the raw HTML for crawlers): edit them there.

const ShivukKlinika = () => {
  // Every published Hebrew article, so that each is linked from this page
  const { data: articles = [] } = useQuery({
    queryKey: ["pillar-clinic-marketing-articles"],
    staleTime: 10 * 60 * 1000,
    queryFn: async (): Promise<PillarArticle[]> => {
      const { data, error } = await supabase
        .from("contents")
        .select("id,slug,title")
        .eq("status", "published")
        .eq("language", "he")
        .order("published_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
  const groups = groupArticles(articles);
  const topicIds = new Set(groups.map((g) => g.id));

  return (
    <div dir="rtl" className="min-h-screen bg-background">
      <SEOHead title={PILLAR_TITLE} description={PILLAR_DESCRIPTION} canonicalUrl={PILLAR_URL} ogType="article" jsonLd={pillarJsonLd()} />
      <Header />
      <main className="pt-24 pb-16">
        <article className="container mx-auto px-4 max-w-3xl">
          <header className="mb-10">
            <h1 className="text-3xl md:text-5xl font-bold text-foreground mb-6 leading-tight">{PILLAR_H1}</h1>
            <p className="text-lg md:text-xl text-foreground/90 leading-relaxed">{INTRO}</p>
          </header>

          <nav aria-label="תוכן עניינים" className="mb-12 bg-card border border-border rounded-xl p-5 md:p-6">
            <h2 className="text-lg font-bold text-foreground mb-3">בדף הזה</h2>
            <ul className="space-y-2">
              {TOC.filter((t) => t.id !== "articles" || groups.length > 0).map((t) => (
                <li key={t.id}>
                  <a href={`#${t.id}`} className="text-primary hover:underline">
                    {t.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <section id="why" className="mb-12 scroll-mt-24">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">{WHY.heading}</h2>
            <p className="text-base md:text-lg text-muted-foreground mb-4 leading-relaxed">{WHY.intro}</p>
            <ul className="list-disc pr-6 space-y-2 text-base md:text-lg text-muted-foreground">
              {WHY.points.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          </section>

          <section id="steps" className="mb-12 scroll-mt-24">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-6">{TOC[1].label}</h2>
            <ol className="space-y-6">
              {STEPS.map((s, i) => (
                <li key={s.name} className="border-r-4 border-primary pr-4">
                  <h3 className="text-lg md:text-xl font-semibold text-foreground mb-2">
                    שלב {i + 1}: {s.name}
                  </h3>
                  <p className="text-base text-muted-foreground leading-relaxed">{s.text}</p>
                  {topicIds.has(s.topic) && (
                    <p className="mt-2">
                      <a href={`#${s.topic}`} className="text-sm text-primary hover:underline">
                        למאמרים בנושא
                      </a>
                    </p>
                  )}
                </li>
              ))}
            </ol>
          </section>

          {groups.length > 0 && (
            <section id="articles" className="mb-12 scroll-mt-24">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-6">מאמרים לפי נושא</h2>
              <div className="space-y-8">
                {groups.map((g) => (
                  <section key={g.id} id={g.id} className="scroll-mt-24">
                    <h3 className="text-xl font-semibold text-foreground mb-2">{g.title}</h3>
                    <p className="text-base text-muted-foreground mb-3 leading-relaxed">{g.intro}</p>
                    <ul className="space-y-1.5 pr-5 list-disc marker:text-primary">
                      {g.articles.map((a) => (
                        <li key={a.id}>
                          <Link to={contentPath(a)} className="text-foreground hover:text-primary hover:underline">
                            {a.title.trim()}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </section>
                ))}
              </div>
            </section>
          )}

          <section id="faq" className="mb-12 scroll-mt-24">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-6">{TOC[3].label}</h2>
            <Accordion type="single" collapsible className="w-full space-y-3">
              {FAQS.map((f, i) => (
                <AccordionItem key={f.q} value={`faq-${i}`} className="bg-card border border-border rounded-lg px-5 shadow-sm">
                  <AccordionTrigger className="text-right text-base md:text-lg font-semibold text-foreground hover:no-underline">
                    {f.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground text-base leading-relaxed pt-2">{f.a}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </section>

          <section id="about" className="mb-12 scroll-mt-24">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">{ABOUT.heading}</h2>
            <ul className="space-y-2 mb-4 text-base md:text-lg text-muted-foreground">
              {ABOUT.people.map((p) => (
                <li key={p.name}>
                  <strong className="text-foreground">{p.name}</strong> — {p.role}
                </li>
              ))}
            </ul>
            <p className="text-base md:text-lg text-muted-foreground leading-relaxed">{ABOUT.text}</p>
          </section>

          <section id="next" className="bg-secondary rounded-2xl p-8 md:p-10 text-center scroll-mt-24">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">{CTA.heading}</h2>
            <p className="text-base md:text-lg text-muted-foreground mb-6 leading-relaxed max-w-2xl mx-auto">{CTA.text}</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button asChild variant="cta" size="xl">
                <Link to={CTA.programPath}>{CTA.programLabel}</Link>
              </Button>
              <Button asChild variant="outline" size="xl">
                <Link to={CTA.diagnosisPath}>{CTA.diagnosisLabel}</Link>
              </Button>
            </div>
          </section>
        </article>
      </main>
      <Footer />
    </div>
  );
};

export default ShivukKlinika;
