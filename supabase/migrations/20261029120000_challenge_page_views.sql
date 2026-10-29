-- Visits to a challenge landing page, so the admin card can show visits
-- next to sign-ups per source (conversion per source without cross-checking
-- Meta). One row per browser tab session. Nothing identifying is stored:
-- visitor_id is a random id kept in the visitor's own browser, used only to
-- count distinct visitors. Visitors are signed out, so anon may insert but
-- never read.
create table if not exists public.challenge_page_views (
  id uuid primary key default gen_random_uuid(),
  challenge_key text not null check (char_length(challenge_key) between 1 and 64),
  source text check (char_length(source) <= 200),
  visitor_id text not null check (char_length(visitor_id) between 8 and 64),
  created_at timestamptz not null default now()
);

create index if not exists challenge_page_views_key_created_idx
  on public.challenge_page_views (challenge_key, created_at);

alter table public.challenge_page_views enable row level security;

create policy "Anyone can record a challenge page view"
  on public.challenge_page_views for insert
  to anon, authenticated
  with check (true);

create policy "Admins can view challenge page views"
  on public.challenge_page_views for select
  using (has_role(auth.uid(), 'admin'::app_role));
