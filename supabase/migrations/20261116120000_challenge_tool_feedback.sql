-- The therapist's own reflection at the end of a challenge tool (day 2, "the mirror"): what was new or became
-- clearer about their ideal client, and what would have helped them sharpen the mirror even more. Both answers are
-- optional. One row per user and tool (the page upserts), read by the admin on the analytics page.
create table if not exists public.challenge_tool_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  tool text not null,
  deliverable_id uuid,
  renewed text,
  wish text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, tool)
);

alter table public.challenge_tool_feedback enable row level security;

create policy "Users can add their own tool feedback"
  on public.challenge_tool_feedback for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own tool feedback"
  on public.challenge_tool_feedback for update
  using (auth.uid() = user_id);

create policy "Users can read their own tool feedback"
  on public.challenge_tool_feedback for select
  using (auth.uid() = user_id);

create policy "Admins can read all tool feedback"
  on public.challenge_tool_feedback for select
  using (has_role(auth.uid(), 'admin'::app_role));
