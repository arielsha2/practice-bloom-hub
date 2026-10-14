-- Sign-ups from free-challenge landing pages (first: "ממטפל אנונימי למומחה
-- מבוקש", 9-11.11.2026). Kept apart from site accounts: registering does not
-- create a user, and one table serves every future challenge via
-- challenge_key. Visitors are signed out, so anon may insert but never read;
-- the page treats a duplicate (same challenge + email) as success.
create table if not exists public.challenge_registrations (
  id uuid primary key default gen_random_uuid(),
  challenge_key text not null check (char_length(challenge_key) between 1 and 64),
  full_name text not null check (char_length(full_name) between 2 and 120),
  email text not null check (char_length(email) between 5 and 254 and email like '%_@_%._%'),
  phone text not null check (char_length(phone) between 9 and 20),
  source text check (char_length(source) <= 200),
  marketing_consent boolean not null default false,
  created_at timestamptz not null default now(),
  unique (challenge_key, email)
);

alter table public.challenge_registrations enable row level security;

create policy "Anyone can register for a challenge"
  on public.challenge_registrations for insert
  to anon, authenticated
  with check (true);

create policy "Admins can view challenge registrations"
  on public.challenge_registrations for select
  using (has_role(auth.uid(), 'admin'::app_role));

create policy "Admins can delete challenge registrations"
  on public.challenge_registrations for delete
  using (has_role(auth.uid(), 'admin'::app_role));
