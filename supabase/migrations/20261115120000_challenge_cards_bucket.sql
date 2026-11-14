-- Public bucket for business-card images that challenge participants send to Eliana on WhatsApp for feedback.
-- A wa.me link can carry only text, so the card image is uploaded (by the challenge-tool-generate function,
-- service role) and its public link goes into the message. File names are random; no client policies are
-- needed because only the function writes. Size limit 3 MB, PNG only.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('challenge-cards', 'challenge-cards', true, 3145728, array['image/png'])
on conflict (id) do nothing;
