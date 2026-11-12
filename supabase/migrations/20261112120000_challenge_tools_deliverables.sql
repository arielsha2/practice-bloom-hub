-- The two free challenge tools (the professional business card, the personal note) store their results in
-- therapist_deliverables like the Mentor's own deliverables: one row per run, every version kept, written by an
-- edge function (service role), the owner reads and edits the text. Only the allowed tool names change here.
alter table public.therapist_deliverables drop constraint if exists therapist_deliverables_tool_check;
alter table public.therapist_deliverables
  add constraint therapist_deliverables_tool_check
  check (tool in ('niche-finder', 'contact-finder', 'professional-card', 'personal-note'));
