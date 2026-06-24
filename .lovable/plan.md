## Goal
Make the Gemini API-key setup dialog appear reliably for a newly paid mentor user.

## Likely cause
The dialog currently opens only after `mentor-chat` returns `BYOK_KEY_REQUIRED`. But `mentor-chat` is trying to identify the logged-in user with `userClient.auth.getClaims(...)`, and the logs show that method is not available in the deployed Supabase client runtime. Because that throws, the function falls back to a permissive path and never reaches the paid-user BYOK check.

There is also a UX mismatch: the current implementation waits until the first message fails. You expected the setup prompt to be visible for a new paid user without confusion.

## Plan
1. **Fix auth detection in `mentor-chat`**
   - Replace the unsupported `auth.getClaims(...)` call with the working project pattern: create a Supabase client with the caller Authorization header and call `auth.getUser()`.
   - Use that user id to call `get_user_access` and check admin status.
   - This restores the server-side condition: paid, non-admin, no saved Gemini key → return `BYOK_KEY_REQUIRED`.

2. **Fix auth detection in `save-user-ai-key`**
   - Replace the same unsupported `auth.getClaims(...)` usage there too.
   - This prevents the next step from failing when the user tries to save their Gemini key.

3. **Show the setup dialog proactively for paid users without a key**
   - In `Mentor.tsx`, after auth and plan loading finish, check `user_ai_keys` for the current user.
   - If the user is paid, non-admin behavior applies, and no `key_hint` exists, open `ByokKeyDialog` automatically once.
   - Keep the existing first-message fallback too, so revoked/invalid/quota keys still reopen the dialog.

4. **Keep admin/free behavior unchanged**
   - Admin users and free/trial users continue using the platform gateway.
   - The “Manage AI key” button remains available for paid users.

5. **Validate the fix**
   - Confirm TypeScript/build signal passes.
   - Verify the server no longer logs `getClaims is not a function` and that a paid user without a key gets the BYOK setup path.