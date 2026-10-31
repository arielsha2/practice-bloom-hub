-- Ready-to-use deliverables the Mentor produces for a therapist (a focus sentence, outreach messages), kept in
-- "התיק שלי". Rows are written only by the generate-deliverable edge function (service role). The owner can read
-- their rows and edit the text (edited_content), nothing else. Every version is kept.
create table if not exists public.therapist_deliverables (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  tool text not null check (tool in ('niche-finder', 'contact-finder')),
  version integer not null default 1,
  content jsonb not null,
  edited_content jsonb,
  inputs jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, tool, version)
);

create index if not exists therapist_deliverables_user_idx on public.therapist_deliverables (user_id, tool, version desc);

alter table public.therapist_deliverables enable row level security;

create policy "Owners read their deliverables"
  on public.therapist_deliverables for select
  using (auth.uid() = user_id);

create policy "Owners edit their deliverables"
  on public.therapist_deliverables for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- The owner may change only the edited text (and its timestamp); everything else is the server's.
revoke update on public.therapist_deliverables from authenticated, anon;
grant update (edited_content, updated_at) on public.therapist_deliverables to authenticated;

-- What the therapist does with a deliverable (viewed, copied, downloaded, edited, regenerated): the measure of
-- whether the deliverables are actually used.
create table if not exists public.deliverable_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  deliverable_id uuid references public.therapist_deliverables(id) on delete cascade,
  tool text,
  kind text not null check (kind in ('viewed', 'copied', 'downloaded', 'edited', 'regenerated')),
  created_at timestamptz not null default now()
);

alter table public.deliverable_events enable row level security;

create policy "Users record their own deliverable events"
  on public.deliverable_events for insert
  with check (auth.uid() = user_id);

create policy "Admins read deliverable events"
  on public.deliverable_events for select
  using (has_role(auth.uid(), 'admin'::app_role));
