## What changes

Restyle the "את החידה הזו מטפלים מנסים לפתור לבד" section on `/mentor` (MentorSalesPage, the burgundy band around lines 233-275) to match the reference.

### Layout
- Replace the asymmetric `md:grid-cols-5` 60/40 grid with a single-column stack (`flex flex-col gap-3`), full width up to `max-w-3xl`.
- Each row becomes a long horizontal bar: number on the far left (LTR side after RTL flip), text right-aligned, comfortable padding (`py-5 px-6`), min-height so short and long items look balanced.

### Shape (single rounded corner)
- Drop `.card-asym` here. Apply only one rounded corner per row: top-right rounded (`rounded-tr-2xl`), other three corners square (`rounded-tl-none rounded-br-none rounded-bl-none`).
- Keeps the artisan/architectural feel without the diagonal look.

### Surface
- Background `bg-background/[0.06]`, 1px border `border-background/15`, no backdrop blur change.
- Number stays terracotta, Miriam Libre, tabular-nums, small (`text-xs`), no circular chip — just inline label like the reference ("01", "02", …).
- Body text in cream (`text-background/90`), `leading-relaxed`.

### Motion
- Keep `fadeUp` on the container. Add `.reveal .stagger-{i}` per row so they cascade in (respects the existing 3-animation rule, no new animation types).

### Scope guardrails
- Only this one section in `MentorSalesPage.tsx`. No token changes, no new colors, no changes to `.card-asym` (still used by persona cards elsewhere / price card).
- No copy edits, no logic changes.

## Files touched
- `src/components/mentor/MentorSalesPage.tsx` — replace the `<motion.ul>` block at ~lines 243-273.

## Credits
Single small edit in one file — roughly **1 credit** (one standard message).
