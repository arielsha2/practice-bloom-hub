

## Plan: RTL/LTR-aware lesson layout with sidebar placement

### Current State
The `LessonDetail` page uses a sidebar on the left and video content on the right. The `flex-row-reverse` is applied in RTL mode, but needs refinement to ensure the sidebar is always on the reading-end side (right for Hebrew, left for English).

### What Changes

**1. `src/pages/LessonDetail.tsx` — Fix flex direction and sidebar placement**
- Remove the manual `flex-row-reverse` on the container. Instead, rely on the native `dir="rtl"` / `dir="ltr"` attribute which automatically handles logical ordering.
- The layout uses `flex` — in RTL mode, flexbox naturally places children right-to-left, so the sidebar (rendered first in JSX) will appear on the right, and the video content area on the left. In LTR, sidebar stays on the left.
- No structural JSX reorder needed — just remove the `isRTL && "flex-row-reverse"` class since `dir` already handles it.

**2. `src/components/portal/LessonSidebar.tsx` — Ensure text alignment follows language**
- The sidebar already uses `text-start` which respects `dir`. No changes needed for text alignment — it will naturally be right-aligned in RTL and left-aligned in LTR.
- Labels are already bilingual (Hebrew/English via `isRTL`).

### Summary of File Changes

| File | Change |
|------|--------|
| `src/pages/LessonDetail.tsx` | Remove `isRTL && "flex-row-reverse"` from the flex container (line 192). The `dir="rtl"` on the root div already handles correct ordering. |

This is a single-line change. The `dir` attribute on the root `div` (line 189) already sets the document direction, which makes flexbox lay out children right-to-left in RTL mode automatically. The explicit `flex-row-reverse` was fighting with this and is redundant.

