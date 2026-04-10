

## Plan: Lesson Resource Enhancements

Three features for the lesson admin resource list: folder assignment, thumbnails with hover preview, and inline rename.

---

### Step 1: Database Migration — `media_folder_assignments` junction table

Create a many-to-many table so files can exist in multiple folders simultaneously. Migrate existing `media_library.folder` data into the new table.

```sql
CREATE TABLE public.media_folder_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  media_id uuid NOT NULL REFERENCES public.media_library(id) ON DELETE CASCADE,
  folder_id uuid NOT NULL REFERENCES public.media_folders(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(media_id, folder_id)
);
ALTER TABLE public.media_folder_assignments ENABLE ROW LEVEL SECURITY;
-- Admin ALL, course_member SELECT policies
-- Migrate existing folder data from media_library.folder column
INSERT INTO media_folder_assignments (media_id, folder_id)
  SELECT ml.id, mf.id FROM media_library ml
  JOIN media_folders mf ON mf.name = ml.folder
  WHERE ml.folder IS NOT NULL;
```

### Step 2: Update MediaLibrary.tsx to use junction table

Replace the single `media_library.folder` column logic with queries against `media_folder_assignments`. Folder filtering, moving, and deletion will all use the new table. Keep backward compatibility during transition.

### Step 3: Folder assignment from Lesson Resource list

**In `LessonResourceManager.tsx` / `SortableResourceItem`:**
- Add a small `FolderOpen` icon button next to each resource item
- On click, show a dropdown/popover listing all folders from `media_folders` + "Create new folder"
- On folder selection:
  1. Insert a row into `media_folder_assignments`
  2. Show a toast with an action button: "File assigned to folder X. Keep in previous folder too?" with Yes/No
  3. If "No", remove the old assignment

### Step 4: Thumbnails with hover preview

**Data flow:**
- Update `PortalAdmin.tsx` `fetchData` to include `thumbnail_url`, `external_id`, `url` in the media query
- Pass these through `Resource` interface → `SortableLessonCard` → `SortableResourceItem`

**Static thumbnail (40x30px):**
- YouTube: `https://img.youtube.com/vi/{external_id}/mqdefault.jpg`
- Others: use `thumbnail_url` if available, otherwise a type icon placeholder

**Hover preview:**
- Wrap thumbnail in a container with `onMouseEnter` / `onMouseLeave`
- On hover, show an enlarged popover/tooltip:
  - **YouTube videos**: render a small muted `<iframe>` with `autoplay=1&mute=1&start=0&end=5&loop=1` params
  - **Uploaded videos with URL**: render a `<video>` tag with `autoplay muted loop` playing first 5 seconds (use `ontimeupdate` to reset at 5s)
  - **Images/documents**: show a larger version of the thumbnail (200x150px)
- Use `loading="lazy"` on all thumbnail images

### Step 5: Inline rename

**In `SortableResourceItem`:**
- Add `editingId` state to `LessonResourceManager`
- When clicking the title text, set `editingId` to that resource's id
- Replace `<span>` with `<Input>` prefilled with current title
- On blur or Enter: `supabase.from('media_library').update({ title: newTitle }).eq('id', resource.media_id)` then call `onResourceChange()`
- On Escape: cancel editing

### Step 6: Translations

Add Hebrew/English strings for:
- `media.assignToFolder`, `media.keepInPreviousFolder`, `media.fileAssignedToFolder`
- Any new UI labels

---

### Files to modify

| File | Changes |
|------|---------|
| New migration | `media_folder_assignments` table + data migration |
| `src/integrations/supabase/types.ts` | Auto-updated |
| `src/pages/MediaLibrary.tsx` | Use junction table for folder logic |
| `src/pages/PortalAdmin.tsx` | Fetch `thumbnail_url`, `external_id`, `url` in media query |
| `src/components/portal/admin/LessonResourceManager.tsx` | Add folder dropdown, thumbnail, hover preview, inline rename to `SortableResourceItem` |
| `src/components/portal/admin/SortableLessonCard.tsx` | Pass new fields through Resource interface |
| `src/contexts/LanguageContext.tsx` | New translation strings |

