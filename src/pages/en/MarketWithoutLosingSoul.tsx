import { AnswerPage } from "@/components/AnswerPage";

const MarketWithoutLosingSoul = () => (
  <AnswerPage
    lang="en"
    path="/en/market-without-losing-soul"
    title="Can Therapists Market Themselves Without Losing Their Soul? | TherapyKeys"
    metaDescription="Yes — but only by changing what 'marketing' means. Dr. Ariel Shapira & Eliana Shapira explain how to build a practice without compromising who you are as a therapist."
    h1="Can Therapists Market Themselves Without Losing Their Soul?"
    intro="Yes — but not by following the standard advice. The reason most marketing feels soul-crushing to therapists is that it asks you to behave in ways that contradict the therapeutic stance: be loud, exaggerate, create urgency, perform. The alternative isn't 'no marketing.' It's a marketing practice that grows out of the same skills that make you a good therapist — listening, clarity, presence, and respect for the other person's pace."
    stepsHeading="4 ways to market that feel like an extension of the work"
    howToName="How to market a practice without compromising your identity as a therapist"
    howToDescription="Four practical approaches to visibility that fit the therapeutic stance"
    steps={[
      { name: "Replace 'pitching' with describing", text: "You're not selling a treatment. You're describing what happens in your room, who it tends to help, and what kind of relationship you offer. Description is honest. Pitching is not." },
      { name: "Use clinical listening to find your voice", text: "The exact phrases your clients use about themselves are your content. Not as quotes — as the vocabulary that proves you understand the experience from the inside." },
      { name: "Choose visibility you can sustain", text: "A weekly blog post you'll actually write beats a daily reel you'll quit. Match the format to your personality, not to what's 'working' for someone else." },
      { name: "Let referrals do the structural work", text: "Build relationships with colleagues, GPs, and adjacent professionals. This is how most full practices were actually built — not through ads." },
    ]}
    postStepsSection={{
      heading: "Signs you're marketing in a way that doesn't damage you",
      bullets: [
        "You can read what you wrote out loud to a client without flinching.",
        "Your content reflects how you actually speak — not a 'professional voice' you've adopted.",
        "Saying no to a poor-fit inquiry feels easier, not harder, because your description was honest.",
        "You don't dread sitting down to do the next piece of work.",
      ],
    }}
    faqsHeading="Common questions"
    faqs={[
      { q: "Doesn't marketing always involve some self-promotion?", a: "Yes, but self-promotion isn't the same as self-distortion. Saying 'this is what I do and who it helps' is promotion. Performing a personality to attract attention is distortion." },
      { q: "What about therapists who do feel comfortable being visible?", a: "Great — but that visibility still has to be congruent with how they actually work. The test is the same: does it match what a client would experience in the room?" },
      { q: "How do I know if I've crossed a line?", a: "Two signals: you wouldn't want a current client to see it, or you feel a small private cringe writing it. Both mean stop." },
      { q: "Is it possible to have a full practice without social media?", a: "Yes. Many therapists build full practices through referrals, a clear website, and a single piece of trust-building content. Social media is one option, not a requirement." },
    ]}
    ctaButtonHref="/turning-point"
  />
);

export default MarketWithoutLosingSoul;
