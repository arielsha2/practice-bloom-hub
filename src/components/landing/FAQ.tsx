import { Helmet } from "react-helmet-async";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

import { HOME_FAQ, buildFaqJsonLd } from "../../../netlify/edge-functions/lib/home-faq";

const faqJsonLd = buildFaqJsonLd(HOME_FAQ);

export const FAQ = () => {
  return (
    <section
      id="faq"
      className="py-20 bg-secondary"
      aria-labelledby="faq-heading"
    >
      <Helmet>
        <script type="application/ld+json">{JSON.stringify(faqJsonLd)}</script>
      </Helmet>
      <div className="container mx-auto px-4 max-w-3xl">
        <header className="text-center mb-12">
          <h2
            id="faq-heading"
            className="font-display text-3xl md:text-4xl text-foreground mb-3"
          >
            שאלות שמטפלים שואלים
          </h2>
          <p className="text-muted-foreground text-lg">
            כל מה שחשוב לדעת לפני שמתחילים
          </p>
        </header>

        <Accordion type="single" collapsible className="w-full space-y-3">
          {HOME_FAQ.map((item, idx) => (
            <AccordionItem
              key={idx}
              value={`item-${idx}`}
              className="bg-card border border-border rounded-lg px-5 shadow-sm"
            >
              <AccordionTrigger className="text-right text-base md:text-lg font-semibold text-foreground hover:no-underline">
                {item.q}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground text-base leading-relaxed pt-2">
                {item.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
};

export default FAQ;
