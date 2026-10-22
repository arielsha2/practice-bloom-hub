-- The people who finished the diagnosis, agreed to the mailing list and have not bought anything:
-- the list the admin emails a follow-up to. Admin-only (SECURITY DEFINER with an explicit check), so the
-- addresses never need row-level policies on profiles and never leave the admin session.
--
--   finished   an assistant message carrying the [STAGE:4] marker in a practice-diagnosis conversation
--   consent    profiles.mailing_list_consent
--   not bought profiles.plan <> 'paid' and no user_tool_access row
--   has_report a diagnosis_results row exists (the official report with the 1-10 scores; older runs have none)
--   clicked    a diagnosis_purchase_intents row (a purchase button was clicked, not a payment)
create or replace function public.admin_diagnosis_completers()
returns table (
  email text,
  display_name text,
  recommended_tool text,
  finished_on date,
  has_report boolean,
  clicked_buy boolean
)
language plpgsql
stable
security definer
set search_path = public, auth
as $$
#variable_conflict use_column
begin
  if not public.has_role(auth.uid(), 'admin'::public.app_role) then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  return query
  with reached as (
    select c.user_id, max(m.created_at) as finished_at
    from bot_conversations c
    join bot_messages m on m.conversation_id = c.id
    where c.bot_key = 'practice-diagnosis'
      and m.role = 'assistant'
      and m.content like '%[STAGE:4]%'
    group by c.user_id
  )
  select p.email::text,
         p.display_name::text,
         (select j.diagnosis_output ->> 'recommended_tool' from therapist_journeys j where j.user_id = r.user_id limit 1)::text,
         r.finished_at::date,
         exists (select 1 from diagnosis_results d where d.user_id = r.user_id),
         exists (select 1 from diagnosis_purchase_intents i where i.user_id = r.user_id)
  from reached r
  join profiles p on p.id = r.user_id
  where p.mailing_list_consent is true
    and p.email is not null
    and coalesce(p.plan, '') <> 'paid'
    and not exists (select 1 from user_tool_access t where t.user_id = r.user_id)
  order by r.finished_at;
end;
$$;

revoke all on function public.admin_diagnosis_completers() from public, anon;
grant execute on function public.admin_diagnosis_completers() to authenticated;
