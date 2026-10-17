-- Every single-tool payment webhook outcome, written by the Grow / PayPal webhooks (service role).
-- Purpose: a payment that is taken but grants no access (no account with the paying email, no saved
-- recommendation, an unrecognized amount) used to be visible only in function logs. The admin dashboard
-- lists the unresolved ones so nobody pays and silently gets nothing.
create table if not exists public.payment_grant_events (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  provider text not null,                 -- 'grow' | 'paypal'
  transaction_id text,
  payer_email text,
  user_id uuid,
  tool text,                              -- bot_key that was granted / would have been granted
  outcome text not null,                  -- granted | already_had_tool | no_profile | no_recommendation | unrecognized_amount | grant_failed
  email_sent boolean not null default false,
  email_error text,
  detail jsonb,
  resolved boolean not null default false,
  resolved_at timestamptz,
  resolved_note text
);

-- A retried webhook for the same transaction must not create a second row for the same outcome.
create unique index if not exists payment_grant_events_txn_outcome_idx
  on public.payment_grant_events (provider, transaction_id, outcome)
  where transaction_id is not null;

create index if not exists payment_grant_events_created_idx on public.payment_grant_events (created_at desc);

alter table public.payment_grant_events enable row level security;

-- Writes come only from the service role (it bypasses RLS). Admins can read and mark rows resolved.
create policy "Admins can read payment grant events"
  on public.payment_grant_events for select
  using (public.has_role(auth.uid(), 'admin'::public.app_role));

create policy "Admins can update payment grant events"
  on public.payment_grant_events for update
  using (public.has_role(auth.uid(), 'admin'::public.app_role))
  with check (public.has_role(auth.uid(), 'admin'::public.app_role));
