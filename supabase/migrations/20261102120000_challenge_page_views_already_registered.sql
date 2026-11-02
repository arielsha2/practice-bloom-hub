-- Marks visits from a browser that has already registered for this challenge
-- (a flag the page keeps in the visitor's own browser after a successful
-- sign-up), so the admin card can tell new visitors from people coming back.
alter table public.challenge_page_views
  add column if not exists already_registered boolean not null default false;
