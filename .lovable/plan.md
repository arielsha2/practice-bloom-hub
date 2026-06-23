
# Plan: Edit /en/mentor sales page

This is a **pure edit pass** on the existing English Mentor sales page in `src/pages/Mentor.tsx` (the `en` branch). The Mentor AI product, payment URL (`https://meshulam.co.il/s/184c5865-65a4-10bb-33f5-5c6c966d83d3`), `/auth` link, color palette, typography, and overall design system stay untouched. All 13 changes ship in one pass.

## Scope guardrails

- File: `src/pages/Mentor.tsx`, English branch only. Hebrew page is not modified.
- No new dependencies, no global CSS changes, no design-token changes.
- All new sections reuse existing card/section primitives (cream `#FDFBF7`-style sections, dark burgundy sections, terracotta accents, Heebo font already loaded).
- Placeholder text (`[Name placeholder]`, `[License]`, `[Country]`) renders visibly on the live page until you replace it.
- Founders photo: you will upload a joint photo separately; I'll wire in a single `<img>` slot with a neutral background placeholder until the file lands.
- Pricing keeps both currencies; `$249 USD` becomes the visually dominant figure and shekel stays as secondary.

## Changes (in build order)

1. **Hero merge (Change 1)** — Delete the second hero block. Update headline, subheadline, and CTA label on the first hero. Add the small reassurance line under the CTA. Move "Already signed up? Log in" out of the hero body — but instead of editing `Header.tsx` globally (which would affect every page), add a small ghost "Log in" link in the hero's top-right corner area for the English page only. Keep the floating "The Clinic Mentor" pill.

2. **Trust bar (Change 2)** — New thin band directly under hero, cream background, 4 centered icon+label items using existing icon-card styling.

3. **The Gap (Change 3)** — Edit question 1 wording, append a new 5th question card matching existing card markup.

4. **Persona Mirror (Change 4)** — Replace items 01, 03, 07 text only.

5. **Early pull-quote (Change 5)** — New cream section between persona mirror and "What if someone held you right there?" Centered, max-width 700px, terracotta quote marks, italic quote, placeholder attribution.

6. **The Bridge (Change 6)** — Add the italic AI-clarification paragraph inside the existing card, before the "This is the Clinic Mentor." line.

7. **Founder credibility (Change 7)** — New cream section before "THE FIVE STAGES". Two-column desktop / stacked mobile. Left: image slot (placeholder until you upload joint photo) with "Ariel & Eliana Shapira" caption. Right: headline + body + "Send a WhatsApp message" ghost button reusing the existing WhatsApp href already on the page.

8. **5 Stages expansion (Change 8)** — Replace each stage's description string with the new 2–3 sentence version. Titles, icons, numbering, cards unchanged.

9. **Sample conversation (Change 9)** — Append to "What does it actually look like?" section. New chat-styled block, max-width 680px, three alternating bubbles (dark burgundy for Mentor, cream-with-border for You), small label above each, terracotta section sub-label.

10. **Testimonials replacement (Change 10)** — Replace the existing testimonial cards array with the 7 new quotes. Keep section label "FROM THE FIELD", headline, and dark background. Grid: 3 + 3 + 1 wide centered card on desktop, single column on mobile. Each card: cream bg, terracotta opening quote glyph, italic quote, thin terracotta divider, bold `[Name placeholder]`, muted `[License] · [Years] · [Country]`.

11. **Who it's for / Not for (Change 11)** — New cream section after testimonials, before pricing. Two columns with vertical divider. Left: green ✓ items. Right: neutral gray ○ items (explicitly not red X, not framed as rejection).

12. **FAQ (Change 12)** — New dark section before pricing. Reuses the existing `Accordion` shadcn component (already in the project per `src/components/ui/accordion.tsx`). 7 Q&A items, collapsed by default, terracotta left border on open state, cream expanded background.

13. **Pricing emphasis (Change 13)** — Inside existing pricing card: swap the type hierarchy so `$249 USD` is the dominant figure and the shekel amount becomes the secondary line. Add the italic price-anchor sentence below the inclusions checklist.

## Technical notes

- All edits stay in `src/pages/Mentor.tsx` and its `en` JSX branch. If a section grows unwieldy, I may extract it into a small co-located component file under `src/components/mentor/en/` to keep the page readable — no behavior change.
- Accordion uses existing `@/components/ui/accordion` — no new package.
- New icons (lock, users, star, message, check, circle, quote) all come from `lucide-react`, already a project dependency.
- The hero's top-right "Log in" mini-link is local to the English hero, so the global `Header.tsx` change from the previous task stays intact.
- Founders photo slot: render an `<img>` with a neutral cream box and the caption "Ariel & Eliana Shapira" so the layout is final the moment you drop the asset in.
- Copy is written verbatim from your spec; no rewording.

## What does NOT change

- Mentor chat product, methodology, payment URL, `/auth` link, color tokens, fonts, Hebrew Mentor page, Hebrew translations, nav/header on other pages, database, edge functions, or any backend logic.

After your approval I'll switch to build mode and apply all 13 edits in a single pass, then report back with a screenshot of the updated English page.
