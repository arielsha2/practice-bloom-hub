

## Plan: New Color Palette & Typography Update

### Color Analysis

Converting your hex colors to HSL for the CSS variable system:

| Hex | HSL | Role |
|-----|-----|------|
| `#58005a` | `299 100% 18%` | Primary — fonts, borders, headings |
| `#f5f2ff` | `253 100% 97%` | Background — soft lavender white |
| `#3b267a` | `253 52% 31%` | Accent dark — depth, sidebar |
| `#5327d8` | `255 72% 50%` | Accent bright — links, highlights |
| `#ff6f61` | `5 100% 69%` | CTA — warm coral for action buttons |

### Design Advice

This purple-violet palette with coral CTA is excellent for therapists — it conveys:
- **Trust & calm** (deep purple) without being clinical
- **Warmth & approachability** (coral CTA) — inviting action
- **Sophistication** (lavender background) — premium feel

**Suggested complementary colors** for the full system:
- **Card surface**: `#faf8ff` (slightly warmer than background)
- **Muted text**: `#58005a` at 50% opacity → a soft plum gray
- **Border**: light lavender `#e8e2f5`
- **Success**: keep sage green `#82A67D` — works well with purple
- **Secondary**: light lavender `#ede8f7`

### Typography Change

Headers (H1-H6) will all use **Heebo Bold** (already loaded) instead of the current Playfair Display / Assistant mix. This gives a modern, bold Hebrew-first feel.

### Files to Change

**1. `src/index.css`** — Update all CSS custom properties:
- `:root` light theme: new purple/lavender/coral values
- `.dark` theme: dark purple variants
- Typography rules: H1-H6 all use `'Heebo', sans-serif` with `font-weight: 700`

**2. `tailwind.config.ts`** — Update font families:
- `fontFamily.sans` → `['Heebo', 'sans-serif']`
- `fontFamily.display` → `['Heebo', 'sans-serif']` (was Playfair Display)
- `fontFamily.serif` → `['Heebo', 'sans-serif']` (unify)

**3. `src/components/ui/button.tsx`** — Update `cta` variant:
- Change from `bg-accent` to use the new coral CTA color token

### Detailed Variable Mapping

```text
Light Theme (:root)
──────────────────────────────
--background:        253 100% 97%    (#f5f2ff)
--foreground:        299 100% 18%    (#58005a)
--card:              260 60% 99%     (#faf8ff)
--card-foreground:   299 100% 18%
--primary:           299 100% 18%    (#58005a)
--primary-foreground: 253 100% 97%
--secondary:         260 40% 94%     (#ede8f7)
--secondary-foreground: 299 80% 22%
--muted:             260 20% 92%
--muted-foreground:  299 30% 40%
--accent:            5 100% 69%      (#ff6f61 — coral CTA)
--accent-foreground: 0 0% 100%      (white text on coral)
--border:            260 30% 90%     (#e8e2f5)
--ring:              255 72% 50%     (#5327d8)
--sidebar-background: 253 52% 31%   (#3b267a)
```

This keeps the existing design system structure while completely refreshing the palette. No structural changes needed — just values.

