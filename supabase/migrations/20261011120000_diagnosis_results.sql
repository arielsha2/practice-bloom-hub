-- One row per completed diagnosis run, so a therapist who repeats the diagnosis
-- after improving can be compared against their earlier scores. therapist_journeys
-- keeps only the latest diagnosis_output (each run overwrites the previous one);
-- this table is the history. Rows are never updated.
create table if not exists public.diagnosis_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  conversation_id uuid,
  created_at timestamptz not null default now(),
  rubric_version integer not null,
  overall numeric(3,1),
  area_scores jsonb not null default '{}'::jsonb,
  report jsonb not null
);

create index if not exists diagnosis_results_user_created_idx
  on public.diagnosis_results (user_id, created_at desc);

alter table public.diagnosis_results enable row level security;

create policy "Users can read own diagnosis results"
  on public.diagnosis_results for select
  using (auth.uid() = user_id);

create policy "Users can insert own diagnosis results"
  on public.diagnosis_results for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own diagnosis results"
  on public.diagnosis_results for delete
  using (auth.uid() = user_id);

create policy "Admins can view all diagnosis results"
  on public.diagnosis_results for select
  using (has_role(auth.uid(), 'admin'::app_role));
