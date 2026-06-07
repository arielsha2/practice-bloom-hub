## Sophistication pass for the marketing site

Goal: move from "flat single-tone page" to a classic, high-end landing-page feel — every section visibly distinct (cream / burgundy / charcoal), real iconography, weighted buttons, and a more grounded voice. No new hues — only the six palette colors you approved.

## Scope

Marketing surfaces only (portal/admin stay clean):
- `src/pages/Index.tsx` (homepage sections)
- `src/components/mentor/MentorSalesPage.tsx`
- `src/pages/TurningPoint.tsx` + `src/components/portal/landing/*`
- Shared: `src/components/landing/*` (Hero, HowItWorks, Testimonials, AboutFounders, Benefits, CTABanner, FAQ, MentorSection, Footer)
- Button system: `src/components/ui/button.tsx`

## 1. Section rhythm — alternating background bands

Each section becomes a full-width band with its own palette pairing, so the eye gets a deliberate cadence as it scrolls:

```text
Hero             → charcoal bg, cream text, terracotta CTA  (presence, gravity)
How it works     → cream bg, burgundy headings, terracotta icons
Testimonials     → burgundy bg, cream text, mauve quote marks
About founders   → cream bg, charcoal portrait frames
Benefits / Pillars → charcoal bg, terracotta icon chips, cream text
FAQ              → cream bg, burgundy accordion accents
CTA banner       → burgundy bg with subtle radial glow, terracotta CTA
Footer           → charcoal bg, cream text, terracotta link hovers
```

Each band gets:
- Generous vertical padding (`py-24 md:py-32`)
- A small `eyebrow` label above the H2 (uppercase, tracked, terracotta) — classic premium-landing-page pattern
- A thin terracotta divider rule (1px, 48px wide) as a visual anchor
- Subtle inner shadow at the top edge when band switches color, so transitions feel intentional, not abrupt

Same treatment applied to MentorSalesPage and TurningPoint sections.

## 2. Icon system

Replace decorative emoji / bare numbers with `lucide-react` icons rendered inside circular "chips":

- Icon chip: 56px circle, 1px border, soft inner highlight, drop shadow. Two variants:
  - On cream bg → burgundy border, terracotta icon, cream fill
  - On dark bg → terracotta border, terracotta icon, charcoal fill with mauve glow
- Curated icon set (sophisticated, not generic): `Compass`, `Sparkles`, `HeartHandshake`, `ScrollText`, `Gem`, `KeyRound`, `Anchor`, `Feather`, `Telescope`, `Flame`. Each section gets one signature icon.
- Mentor sales page 5-step "מה המנטור עושה" gets a numbered icon chip per step (number + icon stacked) instead of plain bullets.

## 3. Button system — add depth and a charcoal variant

Extend `src/components/ui/button.tsx` `variant` enum:

- `cta` (existing) — terracotta, now with layered shadow + 1px inner highlight + 1px terracotta-dark bottom border (so it looks pressed-in, not flat)
- `cta-dark` (new) — charcoal bg, cream text, terracotta hover glow. Used on cream sections where we want gravitas, not urgency
- `cta-burgundy` (new) — burgundy bg, cream text, terracotta underline-on-hover
- `ghost-cream` (new) — for use on charcoal/burgundy bands

Shared button polish:
- `shadow-[0_8px_24px_-8px_hsl(20_48%_42%/0.5)]` on terracotta CTA, equivalent burgundy / charcoal shadows on their respective variants
- `hover:translate-y-[-1px]` micro-lift with `transition`
- `active:translate-y-0 active:shadow-sm` for press feedback
- Subtle 1px top-inner-highlight via `inset 0 1px 0 hsl(0 0% 100% / 0.08)` for a tactile dimensional feel

## 4. Voice cleanup — remove em-dashes

Sweep all marketing copy and replace `—` (em-dash) and ` - ` (spaced hyphen used as em-dash) with natural Hebrew punctuation:
- Short pause → comma `,`
- Strong pause → period and sentence break
- Parenthetical → actual parentheses or a new sentence

Files affected: every component listed in Scope above plus copy strings in `MentorSalesPage.tsx` (heavy user of em-dashes), Hero, Testimonials, AboutFounders, Benefits.

Also remove em-dashes from any seeded testimonial / pillar text inside the listed components.

## 5. Small typographic depth moves

- H2 size bump to `text-4xl md:text-5xl lg:text-6xl`, tighter letter-spacing
- Add a light terracotta drop-cap or terracotta first-letter rule on the opening paragraph of major sections (CSS `::first-letter`)
- Pull-quotes in testimonials get an oversized burgundy/terracotta `"` glyph absolute-positioned behind the text
- Section dividers: thin terracotta hairline (1px, 48px) + small diamond/gem dot

## 6. Technical details

```text
button.tsx
 ├ add variants: cta-dark, cta-burgundy, ghost-cream
 ├ extend cta shadow + lift
 └ inner highlight via boxShadow stack

index.css
 ├ add utility .section-eyebrow (uppercase tracked terracotta label)
 ├ add utility .section-divider (terracotta hairline)
 ├ add shadow tokens: --shadow-button-cta, --shadow-button-dark, --shadow-burgundy-glow
 └ add @layer base rule for .on-charcoal / .on-burgundy text colors

landing components (one PR-style sweep)
 ├ wrap each section in <section className="band band--cream|burgundy|charcoal">
 ├ add eyebrow + divider + icon chip pattern
 ├ swap em-dashes for natural punctuation
 └ swap raw numbers/bullets for icon chips

MentorSalesPage.tsx
 ├ 11 sections re-grouped into 4 bands following the rhythm above
 ├ 5-step "מה המנטור עושה" → icon-chip grid with Compass/Sparkles/HeartHandshake/ScrollText/KeyRound
 ├ price card on charcoal band with terracotta strike-through styling
 ├ CTAs: primary = cta (terracotta), secondary = cta-dark on cream bands
 └ em-dash sweep

TurningPoint sections
 └ same band/eyebrow/icon-chip treatment, same em-dash sweep
```

## Out of scope

- Portal / lesson / admin UI (stays utilitarian per existing rule)
- New color hues — strictly the six approved colors
- New copy or new sections — only restructuring and visual treatment of existing content
- Hero photo / portrait sourcing — works with existing assets
