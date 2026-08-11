# Therapist natural-phrasing glossary

Living reference for how real therapists actually talk about their practice,
used to calibrate every Mentor bot's `system_prompt`. The goal: the Mentor's
language should sound like a peer, not a business consultant or an HR memo.

**Process**: run `docs/phrasing-audit.sql` in the Supabase SQL Editor
periodically (tied to the existing roadmap-checkpoint cadence — no separate
schedule), paste the resulting counts here, and update entries below. Add new
candidate phrases to the SQL file whenever a new tool/topic is designed, so
the list compounds over time instead of staying static.

Entries are either **confirmed** (validated against real message counts) or
**pending** (a correction flagged by the product owner, not yet SQL-checked).

## Getting patients

**Unresolved — first SQL run (2026-08-12) actually weakened, not confirmed,
the original flag.** Raw counts: גיוס מטופלים=3, לקבל מטופלים=1, all other
candidates (להשיג/להביא/לגרום לבוא/מטופלים מגיעים/מטופלים פונים)=0. n=4
total across the whole topic — far too small to settle this either way, and
"גיוס" is the *most*-used of the seven, not the least. Checked the repo's
bot system prompts for "גיוס" as an echo/contamination check (a therapist
might just be mirroring the assistant's own word, not using their native
vocabulary) — not present in any migration or edge function. Can't fully
rule this out though: the live `mentor-chat` prompt is edited via the
`mentor_ai_settings` admin table, not stored in the repo, so it wasn't
checked directly.

**Current call**: keep the product owner's professional judgment (a working
therapist's ear beats n=4) as the default — "להביא מטופלים" / "להשיג
מטופלים" / "לגרום למטופלים לבוא לטיפול" over "גיוס מטופלים" — but this is a
judgment call, not a data-confirmed fact. Re-run once there's more volume
before trusting either direction.

| Avoid | Prefer | Status |
|---|---|---|
| גיוס מטופלים (recruitment-style, HR-sounding) | להביא מטופלים / להשיג מטופלים / לגרום למטופלים לבוא לטיפול | unresolved — data doesn't confirm, kept on the product owner's judgment (2026-08-12) |

## Advertising / marketing

פרסום and שיווק tied at 10 mentions each, קידום at 0. Both are genuinely
in use — no reason to prefer one over the other; avoid קידום.

## Referrals

הפניות clearly dominant (6), vs. מפנים and אנשי קשר (both 0). **Confirmed**:
use הפניות.

## Pricing

**Confirmed** — לגבות (12) and המחיר (9) clearly beat תמחור (4) and שכר
טרחה (0). Notable because תמחור is literally the pricing tool's own name
("מחשבון התמחור"), so its 4 mentions are plausibly an echo of the tool
label rather than organic usage — makes the verb/plain-noun forms (לגבות,
המחיר) the more trustworthy natural choice. Prefer "לגבות" / "המחיר" in
prose; "תמחור" is fine only when literally naming the tool itself.

## Self-presentation

הצגה עצמית (3) vs. איך אני מציג את עצמי (0) — inconclusive: "הצגה עצמית"
is also the self-presentation tool's own name, so this result is likely
contaminated by tool-label echo the same way תמחור was above. No confirmed
preference yet; needs candidates that aren't also literal tool names.

## First call / booking

All candidates at 0 — expected, first-call-practice only just shipped
(2026-08-10/11) and hasn't accumulated real conversation volume yet.
Re-check next audit cycle.

---

**Last updated**: 2026-08-12. **Last SQL run**: 2026-08-12 (first run).
