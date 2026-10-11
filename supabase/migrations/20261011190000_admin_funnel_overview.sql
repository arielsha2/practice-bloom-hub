-- One admin-only function that returns every number the business dashboard needs, so the
-- dashboard does not depend on row-level policies of a dozen tables and does not pull whole
-- tables into the browser. SECURITY DEFINER with an explicit admin check.
--
-- Definitions (all counts are distinct USERS unless noted):
--   signups         profiles created in the window
--   started         practice-diagnosis conversation with at least one user message
--   stage reached   the highest [STAGE:n] marker in the assistant messages of the user's conversations;
--                   "reached result" = stage 4
--   got report      a diagnosis_results row
--   clicked         a diagnosis_purchase_intents row (intent, not payment)
--   purchases       single tool: user_tool_access rows from the Grow / PayPal webhooks;
--                   full Mentor: profiles.plan = 'paid' with plan_updated_at in the window
--                   (meshulam_transaction_id set = Meshulam, otherwise PayPal or a manual grant)
--   silent signups  signed up more than an hour ago and never opened any conversation
create or replace function public.admin_funnel_overview(
  p_since timestamptz default null,
  p_until timestamptz default null
) returns jsonb
language plpgsql
stable
security definer
set search_path = public, auth
as $$
declare
  s timestamptz := coalesce(p_since, '-infinity'::timestamptz);
  u timestamptz := coalesce(p_until, now());
  res jsonb;
begin
  if not public.has_role(auth.uid(), 'admin'::public.app_role) then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  with
  -- diagnosis conversations in the window, with the highest stage each one reached
  conv as (
    select c.id, c.user_id,
           coalesce(max((substring(m.content from '\[STAGE:([0-9])\]'))::int) filter (where m.role = 'assistant'), 0) as stage,
           coalesce(bool_or(m.role = 'user'), false) as has_user
    from bot_conversations c
    left join bot_messages m on m.conversation_id = c.id
    where c.bot_key = 'practice-diagnosis' and c.created_at >= s and c.created_at < u
    group by c.id, c.user_id
  ),
  per_user as (
    select user_id, max(stage) as stage from conv where has_user group by user_id
  ),
  stage_conv as (
    select stage, count(*) as n from conv where has_user group by stage
  ),
  intents as (
    select user_id, purchase_type from diagnosis_purchase_intents where clicked_at >= s and clicked_at < u
  ),
  single_buys as (
    select t.user_id, t.bot_key, t.source,
           nullif(to_jsonb(t)->>'created_at', '')::timestamptz as at
    from user_tool_access t
    where t.source in ('grow_single_tool', 'paypal_single_tool')
      and ( nullif(to_jsonb(t)->>'created_at', '') is null
            or (nullif(to_jsonb(t)->>'created_at', '')::timestamptz >= s
                and nullif(to_jsonb(t)->>'created_at', '')::timestamptz < u) )
  ),
  full_buys as (
    select p.id as user_id, p.plan_updated_at as at,
           case when p.meshulam_transaction_id is not null then 'meshulam' else 'other' end as via
    from profiles p
    where p.plan = 'paid' and p.plan_updated_at >= s and p.plan_updated_at < u
  ),
  results as (
    select user_id, created_at, overall, area_scores, report from diagnosis_results where created_at >= s and created_at < u
  ),
  band as (
    select case when overall is null then 'none' when overall < 4 then 'immediate' when overall < 7 then 'improve' else 'strong' end as b
    from results
  ),
  area_avg as (
    select e.key as area, round(avg((e.value)::numeric), 1) as avg_score, count(*) as n
    from results r, lateral jsonb_each(r.area_scores) e
    where jsonb_typeof(e.value) = 'number'
    group by e.key
  ),
  central as (
    select report->'central_failure'->>'area' as area, count(*) as n from results group by 1
  ),
  repeaters as (
    select user_id,
           (array_agg(overall order by created_at))[1] as first_overall,
           (array_agg(overall order by created_at desc))[1] as last_overall
    from diagnosis_results
    group by user_id
    having count(*) >= 2
  ),
  silent as (
    select p.id, p.email, p.created_at
    from profiles p
    where p.created_at >= s and p.created_at < u and p.created_at < now() - interval '1 hour'
      and not exists (select 1 from bot_conversations bc where bc.user_id = p.id)
      and not exists (select 1 from mentor_conversations mc where mc.user_id = p.id)
  ),
  recent_purchases as (
    select 'single_tool' as kind, sb.source as via, sb.at, p.email, p.display_name, sb.bot_key as tool
    from single_buys sb left join profiles p on p.id = sb.user_id
    union all
    select 'full_mentor', fb.via, fb.at, p.email, p.display_name, null
    from full_buys fb left join profiles p on p.id = fb.user_id
  )
  select jsonb_build_object(
    'window', jsonb_build_object('since', p_since, 'until', u),
    'signups', (select count(*) from profiles where created_at >= s and created_at < u),
    'signups_with_consent', (select count(*) from profiles where created_at >= s and created_at < u and mailing_list_consent),
    'list_total', (select count(*) from profiles where mailing_list_consent),
    'started', (select count(*) from per_user),
    'reached_stage', jsonb_build_object(
      's1', (select count(*) from per_user where stage >= 1),
      's2', (select count(*) from per_user where stage >= 2),
      's3', (select count(*) from per_user where stage >= 3),
      's4', (select count(*) from per_user where stage >= 4)
    ),
    'conversations_by_stage', coalesce((select jsonb_object_agg(stage::text, n) from stage_conv), '{}'::jsonb),
    'got_report', (select count(distinct user_id) from results),
    'clicked', (select count(distinct user_id) from intents),
    'clicked_single', (select count(distinct user_id) from intents where purchase_type = 'single_tool'),
    'clicked_full', (select count(distinct user_id) from intents where purchase_type = 'full_mentor'),
    'purchases', jsonb_build_object(
      'single_grow', (select count(*) from single_buys where source = 'grow_single_tool'),
      'single_paypal', (select count(*) from single_buys where source = 'paypal_single_tool'),
      'full_meshulam', (select count(*) from full_buys where via = 'meshulam'),
      'full_other', (select count(*) from full_buys where via = 'other'),
      'buyers', (select count(distinct user_id) from (select user_id from single_buys union all select user_id from full_buys) x)
    ),
    'recent_purchases', coalesce((select jsonb_agg(to_jsonb(r) order by r.at desc nulls last) from (select * from recent_purchases order by at desc nulls last limit 15) r), '[]'::jsonb),
    'silent_signups', jsonb_build_object(
      'count', (select count(*) from silent),
      'rows', coalesce((select jsonb_agg(jsonb_build_object('email', email, 'created_at', created_at) order by created_at desc) from (select * from silent order by created_at desc limit 15) q), '[]'::jsonb)
    ),
    'scores', jsonb_build_object(
      'count', (select count(*) from results),
      'avg_overall', (select round(avg(overall), 1) from results where overall is not null),
      'bands', coalesce((select jsonb_object_agg(b, n) from (select b, count(*) as n from band group by b) x), '{}'::jsonb),
      'areas', coalesce((select jsonb_agg(jsonb_build_object('area', area, 'avg', avg_score, 'n', n) order by area) from area_avg), '[]'::jsonb),
      'central', coalesce((select jsonb_agg(jsonb_build_object('area', area, 'n', n) order by n desc) from central where area is not null), '[]'::jsonb),
      'repeaters', (select count(*) from repeaters),
      'repeaters_avg_change', (select round(avg(last_overall - first_overall), 1) from repeaters where first_overall is not null and last_overall is not null)
    )
  ) into res;

  return res;
end;
$$;

-- Only signed-in users may call it, and the function itself rejects non-admins.
revoke all on function public.admin_funnel_overview(timestamptz, timestamptz) from public;
grant execute on function public.admin_funnel_overview(timestamptz, timestamptz) to authenticated;
