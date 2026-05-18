import { AnswerPage } from "@/components/AnswerPage";

const FirstClients = () => (
  <AnswerPage
    lang="en"
    path="/en/first-private-practice-clients"
    title="How to Get Your First Private Practice Clients | TherapyKeys"
    metaDescription="Your first private practice clients don't come from ads. Dr. Ariel Shapira & Eliana Shapira explain where they actually come from — and how to make the first ones arrive faster."
    h1="How to Get Your First Private Practice Clients"
    intro={`The first clients in a private therapy practice almost never come from paid marketing. They come from people who already know you or who trust someone who does. The question isn't how to "generate leads" — it's how to make the existing trust around you flow into your calendar. This is the most concrete, solvable problem in early-stage private practice, and it usually moves faster than therapists expect once they stop looking in the wrong places.`}
    preStepsSection={{
      heading: "Where first clients actually come from",
      bullets: [
        "Colleague referrals — fastest and highest quality. Other therapists with full caseloads need somewhere to send overflow.",
        "Your existing network — people who already know you're a therapist, even casually.",
        "One clear written piece — a single page or article that lets a referrer forward you without explaining.",
        "Adjacent professionals — GPs, school counselors, coaches who meet people earlier in the help-seeking journey.",
      ],
    }}
    stepsHeading="4 steps to your first clients"
    howToName="How to land your first private practice clients"
    howToDescription="A 4-step process for turning existing trust into your first booked sessions"
    steps={[
      { name: "Map who already knows what you do", text: "Write a list of 50 people — colleagues, former classmates, friends, professional contacts — who know or could easily know that you're now in private practice. Most therapists are shocked at how short the list feels and how warm it actually is." },
      { name: "Make a one-sentence description they can repeat", text: "Not 'I'm a psychologist.' Try: 'I work with adults dealing with anxiety after a major life change.' Specific enough to be remembered. Short enough to be passed on in a text." },
      { name: "Make referring you effortless", text: "A clean website with a working contact form, a short bio, and your specialty above the fold. A referrer should be able to send your link in 5 seconds without writing an explanation." },
      { name: "Treat the first client as a milestone, not an event", text: "Each first client builds the confidence that opens the next. Don't measure success by the count — measure it by whether the inquiries are getting more aligned with the work you want to do." },
    ]}
    faqsHeading="Common questions"
    faqs={[
      { q: "Do I need paid ads to start?", a: "Almost never. Most full private practices were built primarily on referrals and a clear web presence — not ads." },
      { q: "How long until the practice is full?", a: "With consistent effort and good positioning, 3–6 months from the first client to a comfortably full caseload is realistic. Faster if you have an existing professional network." },
      { q: "What if I have no referral sources yet?", a: "Build them. Reach out to 5 therapists a week to introduce yourself. Most won't reply; some will, and those relationships compound." },
      { q: "Do I need a website on day one?", a: "Not a sophisticated one — but yes, you need something findable. A simple one-page site or a thorough professional directory profile is enough to start." },
    ]}
    ctaButtonHref="/turning-point"
  />
);

export default FirstClients;
