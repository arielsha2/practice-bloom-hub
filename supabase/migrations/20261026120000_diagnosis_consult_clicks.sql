-- Records who opened the diagnosis report and who clicked the ways to talk to Eliana (WhatsApp, premium-fit form).
-- Until now these clicks only went to GA4 / Clarity, so there was no way to tell WHO was interested. Same shape as
-- diagnosis_purchase_intents: the email and name are copied at insert time (the FK points at auth.users, so
-- PostgREST cannot embed profiles).
create table if not exists public.diagnosis_consult_clicks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  email text,
  full_name text,
  kind text not null check (kind in ('report_opened', 'whatsapp', 'premium_form')),
  recommended_tool text,
  language text,
  clicked_at timestamptz not null default now()
);

create index if not exists diagnosis_consult_clicks_user_idx on public.diagnosis_consult_clicks (user_id, clicked_at desc);

alter table public.diagnosis_consult_clicks enable row level security;

create policy "Users can record their own consult click"
  on public.diagnosis_consult_clicks for insert
  with check (auth.uid() = user_id);

create policy "Admins can view all consult clicks"
  on public.diagnosis_consult_clicks for select
  using (has_role(auth.uid(), 'admin'::app_role));
