-- Direct accuracy feedback on the diagnosis result itself (thumbs up/down,
-- with an optional free-text reason on thumbs-down) — replaces guessing at
-- resonance from keyword-mining transcripts with a real, if lightweight,
-- signal. One row per user (upsert), same pattern as diagnosis_lead_signals.
create table if not exists public.diagnosis_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  email text,
  rating text not null check (rating in ('up', 'down')),
  feedback_text text,
  recommended_tool text,
  language text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.diagnosis_feedback enable row level security;

create policy "Users can record their own diagnosis feedback"
  on public.diagnosis_feedback for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own diagnosis feedback"
  on public.diagnosis_feedback for update
  using (auth.uid() = user_id);

create policy "Admins can view all diagnosis feedback"
  on public.diagnosis_feedback for select
  using (has_role(auth.uid(), 'admin'::app_role));
