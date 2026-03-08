

## Plan: Replace YouTube Video with Infographic Image in Hero Section

Replace the YouTube iframe embed in `src/components/landing/Hero.tsx` (lines ~107-118) with the uploaded infographic image (`src/assets/infographic-clinic-edge.png`).

### Changes

**`src/components/landing/Hero.tsx`**:
- Import the infographic image
- Replace the `<iframe>` YouTube embed with an `<img>` tag showing the infographic
- Keep the same container styling (rounded corners, shadow, border)
- Make the image clickable to open full-size in a new tab (optional but useful for readability)

