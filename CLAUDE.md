# CLAUDE.md

Operating conventions for this repo (TherapyKeys / practice-bloom-hub), learned the hard way across several sessions. Read this before touching Supabase deploys, bot prompts, or therapist-facing copy.

## Supabase Management API — deploying edge functions

`npx supabase functions deploy` / `db query --linked` can break if the CLI's personal access token expires or its client-side token-format check rejects a valid newer-format token (`sbp_v0_...`). When that happens, deploy directly via the Management API instead:

```bash
curl --ssl-no-revoke -sS -X POST "https://api.supabase.com/v1/projects/{ref}/functions/deploy?slug={slug}" \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@supabase/functions/{slug}/index.ts;filename=index.ts" \
  -F 'metadata={"entrypoint_path":"index.ts","verify_jwt":false,"name":"{slug}"};type=application/json'
```

**Do not** use `PATCH /v1/projects/{ref}/functions/{slug}` with a raw-source JSON body — it returns HTTP 200 and bumps the version number, but silently produces a broken function (`BOOT_ERROR` on every invocation). This has actually happened and taken down two live functions. Only the multipart `/functions/deploy` endpoint above is safe.

The Management API token expires (dashboard tokens last 6–90 days) — check it with a cheap `GET https://api.supabase.com/v1/projects/{ref}/functions/{slug}` (expect 200, not 401) *before* starting work that ends in a deploy, and ask the user for a fresh one if it's dead.

`--ssl-no-revoke` is required for raw `curl` to external hosts in this environment (Windows/schannel quirk) — `npx supabase`'s own networking doesn't need it.

Direct DB queries when the CLI token is broken: `npx supabase db query --db-url "postgresql://postgres:<password>@db.<ref>.supabase.co:5432/postgres" "<SQL>"`. **This does not support multiple statements in one call or via `--file`** — run each DDL/DML statement as a separate invocation.

## Verify every deploy independently

A push succeeding or a query returning `UPDATE 1` is not proof something is live. Before telling anyone a change is deployed:
- **Frontend**: `curl` the production page, extract the current `/assets/index-*.js` hash, `curl` that bundle, `grep -c` for a string unique to the new code.
- **Edge function**: `curl -X OPTIONS` the function URL and confirm `200`, not `503` (a `503` means `BOOT_ERROR`, not "not deployed yet").
- **DB/prompt content**: query the live column back and read it, don't trust the write confirmation alone.

## Editing bot system prompts (`bot_configurations`)

Prompts (`system_prompt` / `system_prompt_en`) are **admin-editable content, not tracked in git** — edit them directly in the live DB, not as a repo file. Pattern: pull the live column to a scratchpad `.txt` file → edit locally → rebuild a dollar-quoted `UPDATE bot_configurations SET system_prompt = $TAG$...$TAG$ WHERE bot_key = '...';` via a small Node script (avoids shell quote-escaping) → apply with `db query`. Edit Hebrew and English versions separately and deploy both — it's easy to finish one and forget the other.

## Type-checking

Use `npx tsc -p tsconfig.app.json --noEmit`. A bare `npx tsc --noEmit` checks **nothing** in this repo (the root tsconfig has `"files": []` and only references the app project), so "clean" from it means nothing. `npm run build` is plain `vite build`, which does not type-check either — type errors never block a deploy, so they only show up if you look.

- Known pre-existing errors (not from recent work): `src/pages/Mentor.tsx` (7), `src/hooks/useUserPlan.ts` (3), `src/components/mentor/FinalCelebration.tsx` (1). Compare against this baseline rather than expecting zero.
- `src/integrations/supabase/types.ts` is generated and goes stale: any table added by a migration here must be added to it, or every `supabase.from("new_table")` fails the real type-check. `supabase gen types typescript --db-url ... --schema public` works but emits an unformatted ~1000-line file, so add just the new tables by hand in the file's existing style, alphabetically. The checked-in file may have CRLF line endings after a `git checkout` — match them, and fail loudly if an anchor string isn't found (a missing anchor once made a script append the blocks after the end of the file).

## Testing edge-function logic

Edge functions can't be run locally, but their pure helpers can: slice the helper region out of `index.ts` into a scratch `.mts`, add an `export`, and run it with `node file.mts` (Node strips types). For anything that talks to the DB, pass a small fake client and stub `globalThis.fetch` for the LLM, then assert on what was called and written (cached / stale / fresh / LLM error / bad JSON / timeout). **Test against real rows, not hand-written shapes.** Doing so found two bugs synthetic data hid: `contact_finder_output` is a bare *array* (not `{contacts: [...]}`), and the extractors write filler ("משהו כללי", "לא נאמר", "המטפל לא ציין ...") into empty fields.

## "The system computes, the LLM only phrases"

Any structured/quantitative claim in a bot's output (a stage classification, a category, a percentage) should come from code computing it, not the LLM asserting it in prose. When adding a new "reference list" of causes/patterns to a conversational prompt, frame it explicitly as *a tool for checking against real evidence in the conversation, not a substitute for it* — otherwise the model pattern-matches to the list instead of grounding claims in what the person actually said.

## Therapist-facing copy

- Full data-backed word-choice glossary (which Hebrew term therapists actually use): `docs/therapist-natural-phrasing.md`, kept current via `docs/phrasing-audit.sql`. Check it before choosing between near-synonyms in prompts or UI copy.
- Framing rules (not vocabulary — how to characterize *problems* and *asks*):
  - Don't frame someone's core diagnosed blocker as "שיווק" (marketing) — it undersells what's actually going on (usually identity/visibility/not-asking, not tactics). The word itself is fine in plain prose.
  - Don't frame the ask as "לבקש" (to ask/request) — reads as needy/degrading to this audience. Reframe around being remembered / top-of-mind.
  - For direct-address copy, don't use gender-slash notation ("את/ה") — but don't drop second-person address either, that reads as a lecture and kills resonance. Use Hebrew prepositional-pronoun suffixes instead (שלך, עליך, אצלך, אליך, ממך) — spelled identically regardless of gender in unvocalized text, unlike verb conjugations (מרגיש/מרגישה), so they keep copy personal while staying gender-neutral.

## Architecture notes

- `practice-diagnosis` (the free "האבחון" tool) and the six paid Mentor tools (`niche-finder`, `pricing-calculator`, `self-presentation`, `contact-finder`, `connection-bridge`, `first-call-practice`) share `bot_conversations`/`bot_messages`, but the diagnosis's own richer chat history lives in `mentor_conversations` (freeform "Eliana" sessions) — different table, different shape (`messages`/`messages_archive` JSONB arrays), worth pulling from for anything analyzing real therapist language.
- `diagnosis_lead_signals`, `diagnosis_purchase_intents`, and `diagnosis_feedback` all key on `user_id` with denormalized `email` (their FKs point at `auth.users`, not `public.profiles`, so PostgREST can't auto-embed `profiles(email)` — email is written at insert time instead).

- **Agents share context** (`bot-chat`, `buildJourneyContextBlock`): every tool agent except `practice-diagnosis` (intake for a fresh person) gets a capped block built from `therapist_journeys` (other tools' outputs + diagnosis summary) and `therapist_profiles` (profession, modalities, experience, location, current fee, client population), with a mandatory "don't re-ask what's here" instruction. A tool never sees its own earlier output. Allowlisted fields only; extractor filler is dropped.
- **`therapist_profiles`** is extracted server-side in `bot-chat` (not in `mentor-analyze`, which has no auth and persists nothing — the client writes its results) from the therapist's own messages to the Mentor and to other tools, only when a NEW conversation starts after they said something new. It holds the therapist's own professional facts, never patient information. The admin reset hook (`useResetMentorJourney`) deletes it with everything else.
- **`reflection.tool_summaries`** is how the Mentor sees tool results (the client forwards it as `journey_context`; `mentor-chat` cuts each summary at 400 chars, and the "back from tool" card shows it to the therapist verbatim). `bot-extract-output` writes one for every structured tool via `buildToolSummary` — computed from the saved fields, no LLM. Its field choices mirror `CONTEXT_SPECS` in `bot-chat`; they are separate functions with no shared module in the deploy path, so keep the two in step.
- `contact_finder_output` items carry third parties' `name`/`phone`/`email` — only `profession` may ever be copied into a prompt or summary.
- **`bot_conversations.last_message_at` is never updated** (it always equals `created_at`). Derive activity from `bot_messages.created_at`; `mentor_conversations.updated_at` lags the real last message, so also use the `ts` inside its `messages` array.
