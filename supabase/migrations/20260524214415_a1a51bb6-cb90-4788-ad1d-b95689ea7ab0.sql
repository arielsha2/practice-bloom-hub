
UPDATE public.mentor_ai_settings
SET model = 'google/gemini-2.5-pro',
    max_tokens = 6000,
    temperature = 0.5,
    updated_at = now();

UPDATE public.bot_configurations
SET model = 'google/gemini-2.5-flash',
    max_tokens = CASE bot_key
      WHEN 'connection-bridge' THEN 2000
      ELSE 1500
    END,
    temperature = CASE bot_key
      WHEN 'connection-bridge' THEN 0.6
      ELSE 0.5
    END,
    updated_at = now()
WHERE bot_key IN ('niche-finder','pricing-calculator','contact-finder','self-presentation','connection-bridge');
