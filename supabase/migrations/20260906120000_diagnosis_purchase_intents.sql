-- Records every "buy" click on the diagnosis result dialog, with the
-- therapist's identity, so admins get an actual actionable list of hot
-- leads to personally follow up with — not just an anonymous GA4 count.
create table if not exists public.diagnosis_purchase_intents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  email text,
  full_name text,
  recommended_tool text not null,
  purchase_type text not null check (purchase_type in ('single_tool', 'full_mentor')),
  language text,
  clicked_at timestamptz not null default now()
);

alter table public.diagnosis_purchase_intents enable row level security;

create policy "Users can record their own purchase intent"
  on public.diagnosis_purchase_intents for insert
  with check (auth.uid() = user_id);

create policy "Admins can view all purchase intents"
  on public.diagnosis_purchase_intents for select
  using (has_role(auth.uid(), 'admin'::app_role));
