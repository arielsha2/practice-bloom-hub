-- A personal link to the stored diagnosis report, for the follow-up e-mail: opening it needs no account and no
-- login (the page asks the diagnosis-report-view edge function, which reads the report with the service role).
-- The token is 64 random hex characters (two UUIDs, about 244 bits), shown only to the admin who exports the list,
-- and it expires. The table has no policies at all: nobody reads it through the API, only the SECURITY DEFINER
-- function below and the edge function.
create table if not exists public.diagnosis_report_links (
  user_id uuid primary key references auth.users(id) on delete cascade,
  token text not null unique check (token ~ '^[a-f0-9]{64}$'),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  first_opened_at timestamptz,
  last_opened_at timestamptz,
  open_count integer not null default 0
);

alter table public.diagnosis_report_links enable row level security;

-- One link per person who is on the follow-up list (finished the diagnosis, agreed to mailing, has not bought).
-- Calling it again returns the SAME tokens (so e-mails already sent keep working) and pushes the expiry forward.
create or replace function public.admin_report_links_for_completers(p_days integer default 60)
returns table (email text, token text)
language plpgsql
security definer
set search_path = public, auth
as $$
#variable_conflict use_column
begin
  if not public.has_role(auth.uid(), 'admin'::public.app_role) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if p_days is null or p_days < 1 or p_days > 365 then
    raise exception 'p_days must be between 1 and 365';
  end if;

  insert into public.diagnosis_report_links (user_id, token, expires_at)
  select p.id,
         replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', ''),
         now() + make_interval(days => p_days)
  from public.admin_diagnosis_completers() c
  join public.profiles p on lower(p.email) = lower(c.email)
  on conflict (user_id) do update
    set expires_at = greatest(public.diagnosis_report_links.expires_at, excluded.expires_at);

  return query
  select p.email::text, l.token
  from public.admin_diagnosis_completers() c
  join public.profiles p on lower(p.email) = lower(c.email)
  join public.diagnosis_report_links l on l.user_id = p.id;
end;
$$;

revoke all on function public.admin_report_links_for_completers(integer) from public, anon;
grant execute on function public.admin_report_links_for_completers(integer) to authenticated;

-- Counts an opening of a link (called by the edge function with the service role only).
create or replace function public.touch_diagnosis_report_link(p_user_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.diagnosis_report_links
     set open_count = open_count + 1,
         first_opened_at = coalesce(first_opened_at, now()),
         last_opened_at = now()
   where user_id = p_user_id;
$$;

revoke all on function public.touch_diagnosis_report_link(uuid) from public, anon, authenticated;
