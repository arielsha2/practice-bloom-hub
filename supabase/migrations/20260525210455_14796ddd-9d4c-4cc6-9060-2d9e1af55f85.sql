CREATE TABLE public.promo_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  countdown_target timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);

ALTER TABLE public.promo_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read promo settings"
ON public.promo_settings FOR SELECT
USING (true);

CREATE POLICY "Admins manage promo settings"
ON public.promo_settings FOR ALL
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

INSERT INTO public.promo_settings (key, countdown_target)
VALUES ('turning_point_discount', '2026-03-12T00:00:00+03:00');