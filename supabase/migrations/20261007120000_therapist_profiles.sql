-- One shared "professional details" card per therapist (profession, modalities,
-- experience, location, current fee, client population), extracted from what
-- they already told the Mentor / other tools, so each agent can confirm instead
-- of re-asking. Kept separate from therapist_journeys on purpose: no change to
-- the journey row's lifecycle or to anything keyed on its existence.
-- Therapist's own professional facts only — never patient information.
create table if not exists public.therapist_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  profile jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.therapist_profiles enable row level security;

create policy "Users can read own therapist profile"
  on public.therapist_profiles for select
  using (auth.uid() = user_id);

create policy "Users can insert own therapist profile"
  on public.therapist_profiles for insert
  with check (auth.uid() = user_id);

create policy "Users can update own therapist profile"
  on public.therapist_profiles for update
  using (auth.uid() = user_id);

create policy "Users can delete own therapist profile"
  on public.therapist_profiles for delete
  using (auth.uid() = user_id);

create policy "Admins can view all therapist profiles"
  on public.therapist_profiles for select
  using (has_role(auth.uid(), 'admin'::app_role));
