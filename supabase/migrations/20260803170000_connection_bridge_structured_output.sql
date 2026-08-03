ALTER TABLE public.therapist_journeys
  ADD COLUMN IF NOT EXISTS connection_bridge_output jsonb;

UPDATE public.bot_configurations
SET system_prompt = replace(
  replace(
    system_prompt,
    'before proceeding to the simulation.',
    'before proceeding to the simulation. Before you do, ask the therapist: "On a scale of 1-10, how confident do you feel right now about this conversation?" Wait for their number, then continue.'
  ),
  'End with encouragement and actionable tips for the real conversation.',
  'End with encouragement and actionable tips for the real conversation. Finally, ask: "Now that we have practiced this - on a scale of 1-10, how confident do you feel about the real conversation?" Wait for their number.'
)
WHERE bot_key = 'connection-bridge';
