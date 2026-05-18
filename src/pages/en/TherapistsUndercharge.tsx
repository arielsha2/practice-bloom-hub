import { AnswerPage } from "@/components/AnswerPage";

const TherapistsUndercharge = () => (
  <AnswerPage
    lang="en"
    path="/en/why-therapists-undercharge"
    title="The Real Reason Therapists Undercharge | TherapyKeys"
    metaDescription="It's not market rates or guilt about money. Dr. Ariel Shapira & Eliana Shapira explain the deeper reason therapists undercharge — and how to raise fees without losing clients."
    h1="The Real Reason Therapists Undercharge"
    intro="Most therapists undercharge — and most of the explanations they give themselves are wrong. It isn't really about local rates, insurance, or 'wanting to be accessible.' Underneath, there's almost always an unresolved internal question about whether the work is worth what it costs. Until that question is answered honestly, no fee feels right. Once it's answered, the right fee becomes obvious — and clients adapt faster than therapists expect."
    preStepsSection={{
      heading: "What undercharging actually signals",
      bullets: [
        "An unresolved belief that the work isn't 'worth that much' — usually held by the therapist alone, not by their clients.",
        "Fear that raising fees will expose the therapist as a fraud or push every client away.",
        "Confusion between accessibility (a value) and self-erasure (a wound).",
        "A practice structure where every client is a financial necessity, removing the ability to set terms.",
      ],
    }}
    stepsHeading="4 steps to charge what the work is worth"
    howToName="How therapists raise fees without losing their practice"
    howToDescription="A 4-step process for resolving the internal block and adjusting fees sustainably"
    steps={[
      { name: "Name the actual belief", text: "Write down the sentence you'd have to believe to charge more. Then write the one you actually believe right now. The gap is the work." },
      { name: "Audit what you actually deliver", text: "List specifically what a client receives — clinical hours, between-session thinking, professional development, the room, the boundaries. Most therapists wildly underestimate this." },
      { name: "Raise fees for new clients first", text: "Don't try to renegotiate every existing client at once. New inquiries get the new rate. This removes the loyalty conflict and tests reality fast." },
      { name: "Hold the rate when tested", text: "The first three inquiries who push back at the new fee are not a sign you were wrong. They're the calibration. Hold and watch what the next ten do." },
    ]}
    faqsHeading="Common questions"
    faqs={[
      { q: "How much should I raise my fee by?", a: "Smaller than you fear, larger than you'd prefer. A 15–25% raise is usually well-absorbed. The exact number matters less than your conviction holding it." },
      { q: "What if I lose clients?", a: "You'll lose some. The math almost always still works — fewer clients at a sustainable rate beats a full caseload that burns you out." },
      { q: "Isn't it more ethical to keep fees low?", a: "Accessibility matters, and many therapists hold a few low-fee or pro bono slots. But undercharging across the whole practice isn't ethical — it's unsustainable, and a burnt-out therapist helps no one." },
      { q: "What if my market really won't pay more?", a: "Possible, but rarely true. Far more often, the therapist's positioning hasn't communicated what the work is worth. That's solvable." },
    ]}
    ctaButtonHref="/turning-point"
  />
);

export default TherapistsUndercharge;
