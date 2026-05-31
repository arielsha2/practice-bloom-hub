## Plan

1. **Update `supabase/config.toml`** — add `[functions.mentor-score] verify_jwt = false` (the project uses a single config.toml; per project rules we do not create per-function config files).

2. **Edit `supabase/functions/mentor-analyze/index.ts`** — replace the `mentor-score` fetch call:
   - Remove `Authorization` and `apikey` headers
   - Change body shape to: `{ user_id, messages, journey_context: { completed_stages: completed, current }, trigger_event: completed.length > 0 ? "stage_completed" : "stuck_point_detected" }`
   - Keep `EdgeRuntime.waitUntil` wrapping and `.catch` error logging

3. **Deploy** both `mentor-analyze` and `mentor-score`.

Note: you asked to create `supabase/functions/mentor-score/config.toml`, but this project's convention (and Supabase's) is a single `supabase/config.toml`. I'll put the `verify_jwt = false` block there instead — same effect. Let me know if you'd prefer otherwise.