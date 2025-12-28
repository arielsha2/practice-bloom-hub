-- Add url and source columns for external video links
ALTER TABLE lesson_resources 
  ADD COLUMN url TEXT,
  ADD COLUMN source TEXT DEFAULT 'file' 
    CHECK (source IN ('file', 'youtube', 'zoom', 'vimeo'));

-- Make file_path optional (links don't need file storage)
ALTER TABLE lesson_resources 
  ALTER COLUMN file_path DROP NOT NULL;

-- Ensure resource has either file_path or url
ALTER TABLE lesson_resources 
  ADD CONSTRAINT resource_has_content 
  CHECK (file_path IS NOT NULL OR url IS NOT NULL);