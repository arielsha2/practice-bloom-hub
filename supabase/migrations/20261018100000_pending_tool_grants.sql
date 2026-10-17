-- Tool access granted by email BEFORE the person has an account. user_tool_access needs a real user (its
-- user_id references auth.users), so the grant waits here and is applied the moment a profile with that
-- email is created. Written only by the admin-grant-tool-access edge function (service role).
create table if not exists public.pending_tool_grants (
  id uuid primary key default gen_random_uuid(),
  email text not null,                      -- stored lowercase
  bot_key text not null,
  created_at timestamptz not null default now(),
  created_by uuid,
  applied_at timestamptz,
  applied_user_id uuid
);

-- One open grant per (email, tool); once applied the row stays as history.
create unique index if not exists pending_tool_grants_open_idx
  on public.pending_tool_grants (email, bot_key) where applied_at is null;
create index if not exists pending_tool_grants_email_idx on public.pending_tool_grants (lower(email));

alter table public.pending_tool_grants enable row level security;

create policy "Admins can read pending tool grants"
  on public.pending_tool_grants for select
  using (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Applies the waiting grants to a brand-new profile. It runs inside the signup transaction, so it must never
-- raise: any failure is logged as a warning and the signup goes on without the grant (the admin can then
-- use the "grant tools" button on the new user).
create or replace function public.apply_pending_tool_grants()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  r record;
begin
  if NEW.email is null then
    return NEW;
  end if;
  for r in
    select id, bot_key from public.pending_tool_grants
    where lower(email) = lower(NEW.email) and applied_at is null
    for update
  loop
    insert into public.user_tool_access (user_id, bot_key, source)
    values (NEW.id, r.bot_key, 'manual_admin_pre')
    on conflict (user_id, bot_key) do nothing;

    update public.pending_tool_grants
       set applied_at = now(), applied_user_id = NEW.id
     where id = r.id;

    insert into public.payment_grant_events (provider, payer_email, user_id, tool, outcome, resolved, detail)
    values ('manual', NEW.email, NEW.id, r.bot_key, 'granted', true, jsonb_build_object('pre_grant', true));
  end loop;
  return NEW;
exception when others then
  raise warning 'apply_pending_tool_grants failed for %: %', NEW.email, sqlerrm;
  return NEW;
end;
$$;

drop trigger if exists apply_pending_tool_grants_trg on public.profiles;
create trigger apply_pending_tool_grants_trg
  after insert on public.profiles
  for each row execute function public.apply_pending_tool_grants();
