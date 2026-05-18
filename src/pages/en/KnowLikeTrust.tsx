import { AnswerPage } from "@/components/AnswerPage";

const KnowLikeTrust = () => (
  <AnswerPage
    lang="en"
    path="/en/know-like-trust-for-therapists"
    title="Know-Like-Trust for Therapists | TherapyKeys"
    metaDescription='How does the classic "Know, Like, Trust" framework actually work in a therapy practice? Dr. Ariel Shapira & Eliana Shapira translate it into something therapists can use without compromise.'
    h1="Know-Like-Trust for Therapists"
    intro='The "Know, Like, Trust" framework is the foundation of most relationship-based marketing — but the standard version was written for coaches, consultants, and creators, not therapists. For a private practice, each stage means something specific, and the stakes are higher: a prospective client isn\'t deciding whether to buy a product, they\'re deciding whether to be vulnerable in your room. Here\'s how each stage actually works for therapists, and what to do at each one.'
    stepsHeading="The 3 stages, translated for therapy"
    howToName="How Know-Like-Trust works in a private therapy practice"
    howToDescription="The classic marketing framework rebuilt for the reality of clinical work"
    steps={[
      { name: "Know — be findable and clearly described", text: "Someone considering therapy needs to be able to find you and understand what you do within 30 seconds. A clear website, an updated profile, and a one-sentence description of who you help with what. That's it." },
      { name: "Like — sound like a person they could sit with", text: "'Like' for therapists isn't about charm. It's about congruence. Your written voice should match the presence a client would meet in the room — calm, specific, undefended. If you sound like a brochure, you've failed this stage." },
      { name: "Trust — demonstrate clinical seriousness without performing", text: "Trust is built through evidence of how you think, not testimonials. One short article that shows your actual clinical reasoning will outperform a hundred 5-star reviews. Credentials matter; so does the careful way you handle nuance." },
    ]}
    postStepsSection={{
      heading: "What therapists should not do at each stage",
      bullets: [
        "Don't try to be 'Liked' by being entertaining. Entertainment and clinical authority pull in opposite directions.",
        "Don't manufacture 'Trust' through social proof theater — fake-looking testimonial walls and badge soup.",
        "Don't skip 'Know' because you assume people will find you. Most won't unless you've made it easy.",
        "Don't compress the stages. A prospective client moves at their own pace, and rushing them out of any stage is exactly what damages trust.",
      ],
    }}
    faqsHeading="Common questions"
    faqs={[
      { q: "Do I need testimonials?", a: "Useful, but optional and ethically careful. Most therapists do better with clear writing that demonstrates how they think than with stacks of reviews." },
      { q: "How long does the cycle take?", a: "Longer than for most businesses. A prospective therapy client often reads, leaves, and returns over weeks or months before booking. That's normal and healthy." },
      { q: "What's the single highest-leverage thing to do?", a: "Write one clear page describing exactly who you help, with what, and how you work. Almost everything else amplifies that page. Without it, amplification is wasted." },
      { q: "Does this work without social media?", a: "Yes. The framework was originally about referrals, professional reputation, and clear positioning — none of which require social media." },
    ]}
    ctaButtonHref="/turning-point"
  />
);

export default KnowLikeTrust;
