

## Problem

The folder system is "virtual" - folders only exist as values in the `folder` column of media items. If you create a folder but don't immediately drag a file into it, the folder disappears on refresh. Empty folders cannot exist.

## Solution

Create a `media_folders` table to persist folder names independently of media items.

### Step 1: Database Migration
Create a `media_folders` table:
```sql
CREATE TABLE public.media_folders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.media_folders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage media folders" ON public.media_folders
  FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Course members can view media folders" ON public.media_folders
  FOR SELECT TO authenticated USING (is_course_member(auth.uid()));
```

### Step 2: Update MediaLibrary.tsx
- Fetch folders from `media_folders` table instead of deriving them from media items.
- `handleCreateFolder` inserts a row into `media_folders`.
- `handleDeleteFolder` deletes the row from `media_folders` (and moves items to root).
- Merge DB folders with any folders found on media items (for backward compatibility).

### Step 3: Update CreateFolderDialog
- Check duplicates against the DB-persisted folder list.

### Technical Details
- **Files to modify**: `src/pages/MediaLibrary.tsx`
- **New migration**: Create `media_folders` table with RLS
- **No changes needed** to `FolderCard.tsx`, `MediaLibraryTable.tsx`, or `CreateFolderDialog.tsx` (they receive folders as props)

