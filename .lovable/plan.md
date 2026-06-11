
# Hybrid Analytics Dashboard — `/admin/analytics`

Build an admin-only analytics page that combines **internal Supabase data** (users, payments, conversations, lessons) with an **embedded Looker Studio report** for GA4 traffic data.

---

## Part A — Supabase Analytics Dashboard

### Route & access control
- Add route `/admin/analytics` in `src/App.tsx` → new `src/pages/AdminAnalytics.tsx`.
- Gate with `useIsAdmin` (same pattern as `AdminInsights.tsx`). Non-admins → redirect `/`.
- Add a card in `AdminQuickActions.tsx` titled "אנליטיקה" (BarChart icon) → `/admin/analytics`.

### Period selector
Top toolbar with 4 buttons: **1 יום / 7 ימים / 30 ימים / רבעון (90)**. Selection is local state; refetch on change. Auto-refresh runs once on mount.

### Sections (RTL, Hebrew labels)

1. **Overview KPIs** (4 stat cards)
   - Total users (`profiles` count)
   - New users in period (`profiles.created_at`)
   - Active users in period (distinct `user_id` from `user_lesson_progress.last_watched_at` ∪ `bot_messages.created_at` ∪ `qa_threads.updated_at`)
   - Paid users (`profiles.plan = 'paid'`)

2. **Trial & conversion funnel**
   - Trial active / Trial expired / Converted-to-paid counts (from `get_user_access` logic + `profiles.plan_updated_at`)
   - Conversion rate %

3. **Payments**
   - Total paid users, plus a recent-conversions list (last 20 with `plan_updated_at` in period). Pulls from `profiles` + matched `student_enrollments.notes LIKE 'meshulam:%'`.

4. **AI engagement**
   - Conversations started in period (`bot_conversations`, grouped by `bot_key`)
   - Messages count (`bot_messages`)
   - Top 5 bots by usage (bar chart, recharts)

5. **Course engagement**
   - Lessons watched in period
   - Top 5 lessons (from `user_lesson_progress.watched = true`)
   - Q&A questions asked (`qa_threads`)

6. **Signups over time**
   - Line chart of new profiles per day across the selected period (recharts).

### Data fetching
Single edge function `admin-analytics` (verify_jwt=false, manual JWT decode + `has_role` admin check, matches `check-admin` / `admin-insights` pattern) that accepts `{ period: '1d'|'7d'|'30d'|'90d' }` and returns all aggregates in one payload. Avoids 6 round-trips and keeps RLS clean by using `SUPABASE_SERVICE_ROLE_KEY` inside the function only.

### Charts
Use existing `recharts` (already shipped via `src/components/ui/chart.tsx`). Cards via shadcn `Card`. Tables via shadcn `Table`. No new deps.

---

## Part B — Looker Studio embed

### In-app side
- Add `LOOKER_STUDIO_EMBED_URL` row to `mentor_ai_settings`-style admin-editable config? **Simpler:** store in a new tiny table `app_settings (key text PK, value text)` admin-only, with one row `looker_analytics_url`. Inline editable from the page (admin only).
- Render as a responsive `<iframe>` (aspect-ratio 16/10, `allow="fullscreen"`) inside a "תנועה לאתר (GA4)" section at the top or bottom of the page.
- If no URL is saved → show a friendly empty state with a "הדבק קישור Looker Studio" button.

### Step-by-step instructions delivered to the user (in chat, not in code)
Once the page is built, I'll send you a Hebrew walkthrough with screenshots covering:
1. Open https://lookerstudio.google.com → New report
2. "Add data" → "Google Analytics" connector → authorize your Google account (the one that owns GA4 property `470895777`)
3. Pick **TherapyKeys** account → property `470895777` → Add
4. Build a one-page report with the 6 metrics requested (unique visitors, source/medium, avg session duration, device category, hour of day, conversion events `contact_button_click` / `form_submission` / `phone_click` / `whatsapp_click`)
5. File → Share → "Anyone with the link can view"
6. File → Embed report → copy the embed URL
7. Paste it into the box on `/admin/analytics`

---

## Database changes

```sql
CREATE TABLE public.app_settings (
  key text PRIMARY KEY,
  value text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.app_settings TO authenticated;
GRANT ALL ON public.app_settings TO service_role;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read app_settings"
  ON public.app_settings FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins write app_settings"
  ON public.app_settings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
```

No other schema changes — all analytics queries read existing tables.

---

## Files to create / edit

**New**
- `src/pages/AdminAnalytics.tsx`
- `src/components/admin/analytics/KPICards.tsx`
- `src/components/admin/analytics/PeriodSelector.tsx`
- `src/components/admin/analytics/SignupsChart.tsx`
- `src/components/admin/analytics/BotUsageChart.tsx`
- `src/components/admin/analytics/LookerEmbed.tsx`
- `src/hooks/useAdminAnalytics.ts`
- `supabase/functions/admin-analytics/index.ts`
- migration for `app_settings`

**Edited**
- `src/App.tsx` — register `/admin/analytics`
- `src/components/dashboard/AdminQuickActions.tsx` — add Analytics tile
- `supabase/config.toml` — `[functions.admin-analytics] verify_jwt = false`

---

## What you'll do vs what I'll do

| You | Me |
|---|---|
| Approve this plan | Build everything in Part A |
| After page is live: follow my Looker Studio walkthrough and paste the embed link into the page | Build the Looker embed input UI in Part B, then deliver the step-by-step walkthrough |

No secrets, no Service Accounts, no GCP work needed.
