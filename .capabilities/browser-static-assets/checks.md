# Checks

Run these after applying the Browser Module And Static Assets kit.

## Required

```bash
npm run build
npm run typecheck
npm run e2e
npx wrangler deploy --dry-run --experimental-provision=false --experimental-auto-create=false
npm run quality:gate
```

During local development, run `npm run dev` and confirm that changing a file under `src/browser/` triggers the configured browser rebuild.

## Expected Results

- `public/assets/browser-entry.js` is emitted and served as JavaScript.
- Every output from the target's pre-existing build still exists after the composed build runs.
- The external module sets `data-browser-module="ready"` on the document element.
- Worker-generated HTML includes the external `type="module"` script and remains usable when it is blocked or fails.
- Static responses receive the `_headers` security policy; Worker-generated responses set their own equivalent policy.
- Stable, unhashed JavaScript names revalidate rather than receiving an immutable cache lifetime.
- Worker routes remain authoritative and unmatched routes do not become an accidental single-page application fallback.
- `public/assets/` is treated as generated output and is not committed.

If the target uses Workers Builds, configure the same composed `npm run build` command because Workers Builds does not run Wrangler custom builds.
