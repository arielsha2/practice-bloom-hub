# GA4 Event Tracking — 4 Conversion Events

The site already loads gtag and has `src/lib/analytics.ts` with `trackEvent()`, but most CTAs only carry `data-track` attributes that nothing reads. I'll add explicit `trackEvent(...)` calls (alongside the existing attributes) so the 4 events fire reliably and consistently from every relevant touchpoint.

## Events and where each one fires

### 1. `whatsapp_click`
Fires on every WhatsApp link/button. `location` distinguishes them in GA4.

- `src/components/landing/Hero.tsx` — "הצטרפות לקבוצת הוואטסאפ" dialog button → `location: "hero_dialog"`
- `src/components/landing/CTABanner.tsx` — banner WhatsApp button → `location: "cta_banner"`
- `src/components/portal/landing/TurningPointCTA.tsx` — `wa.me/972544928993` link → `location: "turning_point_syllabus"`

### 2. `contact_button_click`
Fires on primary "contact us / join us / start" CTAs that lead to a conversation (not a passive newsletter signup).

- `src/components/landing/Hero.tsx` — "Start 8 free days" trial Link → `location: "hero_start_trial"`
- `src/components/landing/Hero.tsx` — "Join community" button (opens dialog) → `location: "hero_join_community"`
- `src/components/portal/landing/TurningPointCTA.tsx` — "אני רוצה להצטרף לתוכנית" (opens payment dialog) → `location: "turning_point_join"`
- `src/components/portal/landing/TurningPointCTA.tsx` — "הורדת סילבוס" button → `location: "turning_point_syllabus_download"`

### 3. `phone_click`
Fires on `tel:` and visible phone-number links.

- `src/components/portal/landing/TurningPointCTA.tsx` — the visible `054-4928993` phone number link (currently a `wa.me` href, but presented as a phone number — I'll also fire `phone_click` there since users perceive it as a phone tap; `whatsapp_click` still fires too)
- `src/pages/PublicTherapistSite.tsx` line 622 — `tel:${c.phone}` link → `location: "therapist_site_phone"`

### 4. `form_submission`
Fires on successful submission of public-facing forms.

- `src/pages/Auth.tsx` — inside `handleSubmit`, after each successful branch:
  - signup success → `trackEvent("form_submission", { form: "signup", location: "auth_page" })`
  - login success → `form: "login"`
  - forgot-password success → `form: "forgot_password"`
  - password reset success → `form: "password_reset"`

## Implementation pattern

For buttons that already have `onClick`, wrap or extend the handler:
```ts
onClick={() => {
  trackEvent("whatsapp_click", { location: "cta_banner" });
  window.open('https://chat.whatsapp.com/...', '_blank');
}}
```

For `<a>` tags with `href`, attach `onClick`:
```tsx
<a
  href="https://wa.me/972544928993"
  onClick={() => trackEvent("whatsapp_click", { location: "turning_point_syllabus" })}
  ...
/>
```

For `Auth.tsx`, add `trackEvent("form_submission", {...})` immediately after each `toast.success` / `setSignupSent(true)` line.

Existing `data-track` attributes stay in place (harmless, useful for any future delegated handler).

## Files edited

- `src/components/landing/Hero.tsx`
- `src/components/landing/CTABanner.tsx`
- `src/components/portal/landing/TurningPointCTA.tsx`
- `src/pages/Auth.tsx`
- `src/pages/PublicTherapistSite.tsx`

No new files, no schema changes, no new deps. After the changes are deployed, the 4 event names will start appearing in GA4 → Realtime → Events within minutes; once they show up, mark each as a **Key event** in GA4 Admin so they populate the Conversions chart in Looker Studio.
