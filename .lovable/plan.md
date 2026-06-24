# Plan: Paying users bring their own Gemini API key

After payment, the mentor keeps working — but the first time a paying user sends a message, the mentor asks them to paste their own free Google Gemini API key. From that point on, their mentor chats run on Google's bill, not ours.

## The user experience (kept as simple as it gets)

1. User pays, lands in the mentor as usual.
2. Their first message triggers a clean dialog: *"To activate your personal mentor, paste your free Google Gemini API key. It takes 2 minutes — here's how:"* with a 3-step illustrated guide and a single input field.
   - **Step 1**: Click "Open Google AI Studio" (opens `aistudio.google.com/apikey` in new tab).
   - **Step 2**: Sign in with any Google account, click "Create API key".
   - **Step 3**: Copy the key (starts with `AIza...`) and paste it below.
3. They paste → we validate the key with a tiny test call → save → their original message is sent automatically. No second click.
4. From then on, the dialog never appears again unless the key fails (revoked, quota hit, invalid). In that case the same dialog reappears with a clear error: *"Your Gemini key stopped working — please paste a new one."*
5. A small "Manage AI key" link sits in the mentor header so they can replace it anytime.

Free / trial / non-paying users continue using our tokens via the existing Lovable AI Gateway path — nothing changes for them.

## Why this is the simplest viable shape

- **One field, one provider.** No model picker, no provider picker, no OpenRouter credits-to-load step.
- **Free for the user.** Gemini's free tier is generous enough that most therapists will never pay Google a cent.
- **Same model family already in use** (`google/gemini-2.5-flash` etc.) — prompts, temperatures, max tokens all carry over identically.
- **Lazy onboarding.** We only interrupt them the moment they actually try to use the mentor, not during checkout.

## Technical section

### Storage
- New table `public.user_ai_keys`:
  - `user_id uuid PK references auth.users on delete cascade`
  - `provider text not null default 'gemini'`
  - `encrypted_key text not null` (encrypted with `pgsodium` or app-level AES-GCM using a new `USER_KEY_ENCRYPTION_SECRET`)
  - `key_hint text` (last 4 chars, for "ending in ...A1b2" UI)
  - `created_at`, `updated_at`, `last_validated_at`, `last_error text`
- RLS: user can `SELECT key_hint, last_validated_at, last_error` for their own row; only edge functions (service role) read `encrypted_key`. Insert/update via edge function only.
- Standard `GRANT` block per project conventions.

### Edge functions
- **`save-user-ai-key`** (new): receives raw key from client, makes one cheap test call to Gemini (`models/gemini-2.5-flash:generateContent` with a 1-token prompt), encrypts, upserts row. Returns `{ ok: true, hint }` or `{ ok: false, error }`. Never logs the key.
- **`mentor-chat`** (modify): at the top, look up caller's plan via existing `get_user_access`. If `has_paid` is true → fetch + decrypt their Gemini key and call Google's Generative Language API directly (`https://generativelanguage.googleapis.com/v1beta/...`) instead of the Lovable gateway. If no key on file → return `{ error: 'BYOK_KEY_REQUIRED' }` with HTTP 402. If the Google call returns 401/403/429 → mark `last_error`, return `{ error: 'BYOK_KEY_INVALID' | 'BYOK_KEY_QUOTA' }`. Free users continue through the existing Lovable gateway path unchanged.
- Streaming behavior preserved: Google's native SSE format is forwarded as-is (same shape the AI SDK consumes).

### Frontend
- New `<ByokKeyDialog />` component (lives next to the mentor chat). Opens on:
  - First send when the chat hook receives `BYOK_KEY_REQUIRED`.
  - Any send that returns `BYOK_KEY_INVALID` / `BYOK_KEY_QUOTA`.
  - Click on a new "Manage AI key" link in the mentor header.
- Three-step illustrated content (Hebrew + English via existing LanguageContext), single text input, "Save & continue" button. On success, automatically retries the pending message.
- Small banner inside the dialog: *"Your key is encrypted and stored only on our server. We never see it. You can rotate or remove it anytime."*

### Secrets
- Add `USER_KEY_ENCRYPTION_SECRET` (generated, 64 chars) for app-level AES-GCM if we don't use `pgsodium`.

### Out of scope (intentionally)
- No usage analytics per user's key (Google's console already shows that).
- No multi-provider support.
- No admin override UI — admins keep using our tokens via the existing path.
- Voice/TTS (ElevenLabs) keeps using the platform key — only LLM text generation moves to BYOK.

## What we'll build, in order
1. Migration: `user_ai_keys` table + RLS + GRANTs.
2. `save-user-ai-key` edge function + secret.
3. Modify `mentor-chat` to branch on paid + key presence and call Gemini directly.
4. `ByokKeyDialog` component + integration into the mentor chat hook (`useBotChat` / mentor equivalent) + "Manage AI key" header link.
5. Manual QA: free user (unchanged), paid user without key (dialog appears, save works, message retries), paid user with bad key (dialog reappears with right error), key rotation from header.
