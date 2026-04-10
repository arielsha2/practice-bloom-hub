

## Problem

The hover preview boxes appear white/empty because:

1. **YouTube thumbnails don't load**: The code checks `item.external_id` for YouTube video IDs, but **all YouTube items in the database have `external_id: null`**. The video ID was never extracted from the URL and saved.
2. **Google Drive videos can't play in `<video>` tags**: The fallback path tries to render Google Drive URLs in a `<video src="...">` element, which doesn't work — GDrive requires an `<iframe>` embed.
3. **No `thumbnail_url` stored**: Most items have `thumbnail_url: null`, so there's no fallback image either.

The same issue affects both `MediaLibraryTable.tsx` and `LessonResourceManager.tsx`.

## Solution

Extract YouTube/Vimeo/GDrive IDs at **render time** from the URL using the existing `videoUtils.ts` utility functions, instead of relying on the (empty) `external_id` column.

### Changes to `MediaLibraryTable.tsx` — `MediaThumbnail` component

Update `getThumbnailUrl()` and the hover preview logic:

```typescript
import { extractYouTubeId, extractVimeoId, extractGoogleDriveId } from '@/lib/videoUtils';

// In getThumbnailUrl:
const youtubeId = item.external_id || (item.url ? extractYouTubeId(item.url) : null);
if (item.source === 'youtube' && youtubeId) {
  return `https://img.youtube.com/vi/${youtubeId}/mqdefault.jpg`;
}

// In hover preview, use the derived youtubeId for YouTube embed
// For GDrive videos, use iframe with /preview URL instead of <video>
// For Vimeo, use player.vimeo.com embed
```

### Changes to `LessonResourceManager.tsx` — `ResourceThumbnail` component

Apply the same fix: derive `youtubeId` / `gdriveId` from the URL at render time.

### Specific hover preview logic by source

| Source | Static Thumbnail | Hover Preview |
|--------|---------|------|
| YouTube | `img.youtube.com/vi/{id}/mqdefault.jpg` | YouTube embed iframe with autoplay+mute |
| Google Drive | GDrive icon placeholder | GDrive iframe with `/preview` URL |
| Vimeo | Vimeo icon placeholder | Vimeo player iframe |
| File (video) | `thumbnail_url` or icon | `<video>` tag with file URL |
| File (doc/pres) | `thumbnail_url` or icon | Enlarged thumbnail or icon |

### Files to modify

| File | Change |
|------|--------|
| `src/components/portal/admin/MediaLibraryTable.tsx` | Fix `MediaThumbnail` to extract IDs from URL, add GDrive iframe support |
| `src/components/portal/admin/LessonResourceManager.tsx` | Fix `ResourceThumbnail` with same URL-based ID extraction |

