-- Stores RAW behavioral/linguistic signals per completed diagnosis, not just
-- a final score — so that once real purchases exist to validate against, the
-- weighting formula can be recalibrated without re-parsing transcripts.
-- composite_score_v1 is a first-pass heuristic (unvalidated: there were zero
-- purchases to learn from when it was built) and is expected to be replaced
-- by a v2 formula once enough real conversions exist to check which signals
-- actually correlate with buying.
create table if not exists public.diagnosis_lead_signals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  conversation_id uuid references public.bot_conversations(id) on delete set null,
  -- Denormalized rather than joined to profiles at query time — PostgREST
  -- embedding needs a direct FK to the embedded table, and this FK points at
  -- auth.users (matching the pattern already used by
  -- diagnosis_purchase_intents for the same reason).
  email text,
  user_message_count int not null default 0,
  avg_user_message_words numeric not null default 0,
  numbers_mentioned_count int not null default 0,
  urgency_phrase_count int not null default 0,
  emotional_intensity_count int not null default 0,
  composite_score_v1 numeric not null default 0,
  computed_at timestamptz not null default now(),
  unique(user_id)
);

alter table public.diagnosis_lead_signals enable row level security;

create policy "Admins can view all lead signals"
  on public.diagnosis_lead_signals for select
  using (has_role(auth.uid(), 'admin'::app_role));

-- bot-extract-output writes with the calling user's own session (anon key +
-- their Authorization header), not a service-role client, so it needs these.
create policy "Users can record their own lead signals"
  on public.diagnosis_lead_signals for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own lead signals"
  on public.diagnosis_lead_signals for update
  using (auth.uid() = user_id);
