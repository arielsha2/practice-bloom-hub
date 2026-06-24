CREATE TABLE public.signup_otp_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  code_hash text NOT NULL,
  expires_at timestamptz NOT NULL,
  consumed_at timestamptz,
  attempts integer NOT NULL DEFAULT 0,
  last_sent_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX signup_otp_codes_email_idx ON public.signup_otp_codes (LOWER(email), created_at DESC);

GRANT ALL ON public.signup_otp_codes TO service_role;

ALTER TABLE public.signup_otp_codes ENABLE ROW LEVEL SECURITY;

-- No policies for anon/authenticated → table is unreadable from client; only service_role (edge functions) touches it.
CREATE POLICY "service role only" ON public.signup_otp_codes FOR ALL TO service_role USING (true) WITH CHECK (true);