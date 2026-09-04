# Checks

Run these after applying the Workers AI kit.

## Required

```bash
npm run types
npm run types:check
npm test
npm run typecheck
npm run quality:gate
```

## Expected Results

- `wrangler.jsonc` declares `AI` and a non-secret `AI_MODEL` variable.
- `worker-configuration.d.ts` exposes both values through the generated `Env` interface.
- Model output is accepted only after an application-owned runtime validator succeeds.
- Binding failures, malformed output, and timeout paths return the caller's deterministic fallback.
- A permanently pending runner still resolves to the timeout fallback, and non-positive or non-finite timeout values are rejected.
- Every call emits redacted start and finish events; fallback finishes include only the bounded reason code.
- The target's normal quality gate runs `npm run types:check` so committed binding declarations cannot drift silently.
- Tests use the mock runner without network or account access.
- Prompts, schemas, and fallbacks belong to the adopting feature; the generic boundary contains no product data.

Before deployment, confirm the configured model still appears in Cloudflare's current JSON Mode supported-model list.
