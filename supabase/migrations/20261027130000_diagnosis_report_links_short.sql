-- The personal report link is shown as plain text in the e-mail (the mailing tool cannot put a per-person address
-- behind a link), so the token is shortened from 64 to 16 hex characters (64 random bits, from the strong random
-- generator behind gen_random_uuid()). With a few dozen valid links in a space of 1.8e19 the address stays
-- unguessable. Links created before this ran (they had not been sent to anyone yet) get a new short token, so
-- the file with the long ones must be downloaded again.
alter table public.diagnosis_report_links drop constraint if exists diagnosis_report_links_token_check;
update public.diagnosis_report_links set token = substr(replace(gen_random_uuid()::text, '-', ''), 1, 16);
alter table public.diagnosis_report_links
  add constraint diagnosis_report_links_token_check check (token ~ '^[a-f0-9]{16}$');

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
         substr(replace(gen_random_uuid()::text, '-', ''), 1, 16),
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
