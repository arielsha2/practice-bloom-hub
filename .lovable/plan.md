

## Plan: Fix Visibility Issues and Add Missing Features

### Problem
1. **LessonResourceManager features (thumbnails, inline rename, folder assign) exist in code but may not render** due to a React `forwardRef` warning on `SortableLessonCard` — the `useSortable` hook passes a ref to a function component that doesn't use `forwardRef`.
2. **MediaLibraryTable has no thumbnails or inline rename** — those features were only added to the lesson resource list, not the media library page.
3. All edit/rename/move operations are already admin-only via Supabase RLS policies. No changes needed for permissions.

### Step 1: Fix `SortableLessonCard` forwardRef warning
Wrap the component with `React.forwardRef` so `useSortable` can properly attach its ref. This may be causing the lesson cards to not render their content correctly.

### Step 2: Add thumbnails to `MediaLibraryTable`
- Replace the plain type icon in column 2 with a small thumbnail image (40x30px).
- For YouTube items, use `img.youtube.com/vi/{external_id}/mqdefault.jpg`.
- For others, use `thumbnail_url` if available, fall back to the type icon.
- Add hover preview (enlarged image or muted video loop for first 5 seconds) — reuse the `ResourceThumbnail` pattern from `LessonResourceManager.tsx`.

### Step 3: Add inline rename to `MediaLibraryTable`
- Make the title cell clickable to enter edit mode (show an `<Input>` field).
- On blur or Enter, update `media_library.title` globally via Supabase.
- On Escape, cancel.

### Step 4: Add inline rename to lesson title in `SortableLessonCard`
- Make the lesson title text clickable. On click, show an `<Input>`.
- Save updates to the `lessons` table on blur/Enter.

### Files to modify
| File | Changes |
|------|---------|
| `src/components/portal/admin/SortableLessonCard.tsx` | Fix forwardRef, add inline lesson title rename |
| `src/components/portal/admin/MediaLibraryTable.tsx` | Add thumbnails with hover preview, inline rename |
| `src/pages/MediaLibrary.tsx` | Pass `onRename` callback to `MediaLibraryTable` |
| `src/components/portal/admin/LessonResourceManager.tsx` | Extract `ResourceThumbnail` to shared file (or keep inline) |
| `src/contexts/LanguageContext.tsx` | Add any missing translation strings |

