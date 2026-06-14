---
name: Mentor Personal Notebook
description: Pull-out side panel on /mentor with free-text notebook (mentor_notebooks table), auto-saved with 1.5s debounce, plus per-message "send to notebook" button that appends with date+stage header
type: feature
---
Table `mentor_notebooks` (one row per user_id, UNIQUE) stores a single free-form text doc.
UI: `MentorNotebookPanel` floating tab (start side in RTL, end side in LTR) opens a `Sheet`.
Append from chat via `window.dispatchEvent(new CustomEvent('mentor-notebook:append', { detail: { body, stageLabel } }))`.
Each appended block is prefixed with `\n\n---\n📅 [date] · [stageLabel]\n` where stageLabel comes from `journey.reflection.current` mapped via STAGE_DEFS.
Hook: `useMentorNotebook` (1.5s debounce save, immediate save on append).
