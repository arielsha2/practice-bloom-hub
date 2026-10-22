-- A single tool bought at the introductory price opens for a limited time (30 days); the full single-tool
-- price and every manual grant open it for good. expires_at null = permanent, so every existing row keeps
-- working exactly as before. The grow-payment-webhook sets it; the app (useBotAccess and the diagnosis
-- dialog) ignores a row whose expires_at is in the past.
alter table public.user_tool_access
  add column if not exists expires_at timestamptz;

comment on column public.user_tool_access.expires_at is
  'End of a time-limited access (introductory single-tool price). Null means the access does not expire.';
