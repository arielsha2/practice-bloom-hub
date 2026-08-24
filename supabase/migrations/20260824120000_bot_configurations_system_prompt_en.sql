-- Optional English variant of a bot's system prompt, mirroring the
-- system_prompt_he/system_prompt_en split already used on mentor_ai_settings.
-- Nullable: bots without an English prompt keep using system_prompt as-is
-- (bot-chat/index.ts falls back to system_prompt when this is null).
alter table public.bot_configurations
  add column if not exists system_prompt_en text;
