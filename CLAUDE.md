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

`--ssl-no-revoke` is required for raw `curl` to external hosts in this environment (Windows/schannel quirk) — `npx supabase`'s own networking doesn't need it.

Direct DB queries when the CLI token is broken: `npx supabase db query --db-url "postgresql://postgres:<password>@db.<ref>.supabase.co:5432/postgres" "<SQL>"`. **This does not support multiple statements in one call or via `--file`** — run each DDL/DML statement as a separate invocation.

## Verify every deploy independently

A push succeeding or a query returning `UPDATE 1` is not proof something is live. Before telling anyone a change is deployed:
- **Frontend**: `curl` the production page, extract the current `/assets/index-*.js` hash, `curl` that bundle, `grep -c` for a string unique to the new code.
- **Edge function**: `curl -X OPTIONS` the function URL and confirm `200`, not `503` (a `503` means `BOOT_ERROR`, not "not deployed yet").
- **DB/prompt content**: query the live column back and read it, don't trust the write confirmation alone.

## Editing bot system prompts (`bot_configurations`)

Prompts (`system_prompt` / `system_prompt_en`) are **admin-editable content, not tracked in git** — edit them directly in the live DB, not as a repo file. Pattern: pull the live column to a scratchpad `.txt` file → edit locally → rebuild a dollar-quoted `UPDATE bot_configurations SET system_prompt = $TAG$...$TAG$ WHERE bot_key = '...';` via a small Node script (avoids shell quote-escaping) → apply with `db query`. Edit Hebrew and English versions separately and deploy both — it's easy to finish one and forget the other.

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
