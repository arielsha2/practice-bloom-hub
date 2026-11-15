-- Steps on the way into a challenge tool (first: the business card homework link), so the admin page can show
-- where people drop off between opening the link and finishing: landed signed out / signed in, the sign-in screen,
-- code sent, code failed, signed in, questions shown, card made. One row per step per browser tab session.
-- Nothing identifying: visitor_id is the same random browser id as challenge_page_views. Visitors are often
-- signed out, so anon may insert but never read.
create table if not exists public.challenge_tool_funnel (
  id uuid primary key default gen_random_uuid(),
  tool text not null check (char_length(tool) between 1 and 40),
  step text not null check (char_length(step) between 1 and 40),
  visitor_id text not null check (char_length(visitor_id) between 8 and 64),
  source text check (char_length(source) <= 200),
  created_at timestamptz not null default now()
);

create index if not exists challenge_tool_funnel_tool_created_idx
  on public.challenge_tool_funnel (tool, created_at);

alter table public.challenge_tool_funnel enable row level security;

create policy "Anyone can record a challenge tool step"
  on public.challenge_tool_funnel for insert
  to anon, authenticated
  with check (true);

create policy "Admins can view challenge tool steps"
  on public.challenge_tool_funnel for select
  using (has_role(auth.uid(), 'admin'::app_role));
