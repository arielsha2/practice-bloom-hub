

# Improve Passwordless Signup UX in Auth.tsx

## Changes

### 1. Add new state: `signupSent`
Track when signup email was successfully sent (similar to `resetSent` for forgot mode).

### 2. Auth.tsx — Signup success screen
When `mode === 'signup' && signupSent`, show a success UI (like the forgot-password success screen) with:
- CheckCircle icon
- Success message: "Check your inbox! We've sent you a link to complete your registration and set your password."
- "Back to login" link

Replace the `toast.success` call with `setSignupSent(true)`.

### 3. Auth.tsx — Helper text under email input
When `mode === 'signup'`, add a `<p>` below the email input with helper text.

### 4. Auth.tsx — Better error for already_registered
Replace the toast with an inline error message or enhanced toast that includes guidance to check inbox or try signing in.

### 5. LanguageContext.tsx — Update translations
Update/add these keys in both `en` and `he`:
- `auth.signupSuccessPasswordless` → longer success message about checking inbox
- `auth.signupHelperText` → helper text below email
- `auth.alreadyRegistered` → more descriptive message with guidance

## Files to change
- `src/pages/Auth.tsx` — add `signupSent` state, success screen, helper text, better error
- `src/contexts/LanguageContext.tsx` — update 3 translation keys (en + he)

