-- Publishing a personal page is part of the full Mentor. The wizard checks this in the interface, and this trigger
-- enforces it in the database, since the table lets an owner write their own row. It only looks at the moment a page
-- BECOMES published, so pages that are already live (and edits to them) are not affected, and it never blocks saving
-- a draft. Admins can always publish.
create or replace function public.enforce_site_publish_access()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  allowed boolean;
begin
  if new.is_published is true and (tg_op = 'INSERT' or old.is_published is distinct from true) then
    select coalesce((select a.has_paid from public.get_user_access(new.user_id) a limit 1), false)
           or public.has_role(new.user_id, 'admin'::public.app_role)
      into allowed;
    if not allowed then
      raise exception 'publishing a page requires the full Mentor' using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_therapist_websites_publish_gate on public.therapist_websites;
create trigger trg_therapist_websites_publish_gate
  before insert or update on public.therapist_websites
  for each row execute function public.enforce_site_publish_access();
