# Checks

Run these after applying the Progressive Interaction kit.

## Required

```bash
npm run typecheck
npm run e2e
npm run quality:gate
```

## Manual Browser Checks

1. Block or remove the client script and submit the form; the server completes the same workflow through normal navigation.
2. Restore the script and submit; only the declared fragment changes.
3. Confirm the address bar matches the returned URL.
4. Confirm focus remains on the corresponding control or moves to the declared focus target/fragment.
5. Use Back and Forward; visible content must match the URL after the reload.

## Expected Results

- Only explicitly marked, same-origin GET/POST forms are intercepted.
- Unsupported forms retain native browser behavior.
- A failed fetch or malformed HTML response falls back to native submission.
- No executable browser code is embedded inline in Worker-rendered HTML.
- At least one Playwright scenario runs with `javaScriptEnabled: false` against a functional form path.
- The enhanced path has browser coverage for fragment replacement, URL, focus, and Back/Forward behavior.
