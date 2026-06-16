## Why /en/mentor shows 404

The route `/en/mentor` **is** defined in `src/App.tsx` and works in the Lovable preview. The 404 is happening on your live published site (`therapykeys.co.il`), and there are two likely causes:

### Cause 1 (most likely): the site hasn't been republished since the English routes were added
Frontend route changes only go live **after you click Publish/Update**. The `/en` and `/en/mentor` routes were added in code, but the production build on `therapykeys.co.il` is still the old one without those routes.

**Fix:** click Publish → Update in the editor. No code change needed.

### Cause 2: Netlify SPA fallback not catching the deep link
Your project deploys via `netlify.toml` to Netlify (not Lovable hosting), so the `public/_redirects` file (`/* /index.html 200`) is what makes deep links work. This file already exists and is correct, so this should not be the problem — but if after republishing `/en/mentor` still 404s while `/mentor` works, it means Netlify isn't picking up `_redirects`. In that case I'd add an explicit redirect rule to `netlify.toml`:

```toml
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### Plan of action

1. **You republish** the site (Publish → Update). This is the fix in 95% of cases.
2. **Test** `https://therapykeys.co.il/en/mentor` and `https://therapykeys.co.il/en` after publish completes (~1 min).
3. **If still 404 after republish**, I add the explicit `[[redirects]]` block to `netlify.toml` as a belt-and-suspenders fallback and you republish again.

No code changes are needed in step 1 — the routes are already there. Want me to proactively add the `netlify.toml` redirect rule now so a single republish definitely fixes it?
