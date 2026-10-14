-- Phone becomes optional on the challenge sign-up form (email stays
-- required). The length check still applies when a phone is given.
alter table public.challenge_registrations alter column phone drop not null;
