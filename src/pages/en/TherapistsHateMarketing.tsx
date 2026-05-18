import { AnswerPage } from "@/components/AnswerPage";

const TherapistsHateMarketing = () => (
  <AnswerPage
    lang="en"
    path="/en/therapists-who-hate-marketing"
    title="Why Therapists Who Hate Marketing Are Actually Right | TherapyKeys"
    metaDescription="Most marketing advice fails therapists because it ignores the therapeutic relationship. Dr. Ariel Shapira & Eliana Shapira explain why — and what works instead."
    h1="Why Therapists Who Hate Marketing Are Actually Right"
    intro="If marketing feels wrong to you as a therapist, your instinct is correct. The standard playbook — funnels, hooks, urgency, pain-point copy — is built for transactional businesses where buyer and seller are clearly separate. In a private practice, the therapist is the product, and aggressive tactics actively damage the trust that therapy depends on. The answer isn't to do marketing harder. It's to do a different kind of marketing — one that feels like an extension of the work itself."
    preStepsSection={{
      heading: "What standard marketing gets wrong about therapy",
      bullets: [
        "Urgency tactics signal scarcity-thinking, which is the opposite of the secure presence clients are looking for.",
        "Pain-point copy that exaggerates suffering crosses an ethical line therapists already know not to cross.",
        "Funnels treat a prospective client as a conversion event, not a person making a vulnerable decision.",
        "Personal branding turns the therapist into a performer, which contradicts what makes therapy work.",
      ],
    }}
    stepsHeading="A different approach: 4 principles"
    howToName="Marketing principles for therapists who hate marketing"
    howToDescription="Four principles for building a practice without the tactics that feel wrong"
    steps={[
      { name: "Lead with clarity, not persuasion", text: "Describe what you actually do, who it's for, and what it isn't. Clarity removes the need for persuasion." },
      { name: "Write in the client's language", text: "Use the words your clients use about themselves — not clinical terms, not marketing jargon. This is the same listening skill you already have." },
      { name: "Make visibility low-cost emotionally", text: "Pick one channel that fits your personality. An introvert who writes is more sustainable than an extrovert format you'll abandon in three weeks." },
      { name: "Let the work speak", text: "Referrals from colleagues and satisfied clients outperform any paid funnel — because they already carry the trust marketing tries to manufacture." },
    ]}
    faqsHeading="Common questions"
    faqs={[
      { q: "Isn't all marketing manipulative?", a: "No. Manipulation hides intent. Honest marketing is just making it easy for the right person to find and understand you. That's a service, not a sell." },
      { q: "Do I have to share personal stories online?", a: "No. The 'be vulnerable on social media' advice doesn't apply to therapists. Your authority comes from boundaries, not exposure." },
      { q: "What about paid ads?", a: "They can work, but they're rarely the right first move. Most therapists fill a practice from referrals and a single piece of clear written content before ads make sense." },
      { q: "How do I start if I really hate this?", a: "Start with the part that doesn't feel like marketing: write one clear page that describes what you do and who it's for. That alone moves more prospective clients than most campaigns." },
    ]}
    ctaButtonHref="/turning-point"
  />
);

export default TherapistsHateMarketing;
