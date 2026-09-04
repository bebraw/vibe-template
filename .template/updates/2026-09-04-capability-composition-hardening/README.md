# Harden Worker Capability Composition

Use this update when a downstream project adopted the Room State or Browser Static Assets kits before their Worker test, script-guard, and coverage contracts were reconciled.

## Apply

1. Read ADR-024, ADR-056, ADR-057, ADR-060, and the current capability-kit spec.
2. Replace `@cloudflare/vitest-pool-workers` with `@cloudflare/vitest-plugin`, including imports and test TypeScript ambient types.
3. Replace `@vitest/coverage-v8` with matching-version `@vitest/coverage-istanbul` wherever tests run inside the Workers runtime. Preserve existing coverage thresholds and globs.
4. Port the current Worker client-script guard and focused tests. Permit only empty same-origin `type="module"` tags below `/assets/`; retain rejections for inline, malformed, classic, remote, traversal, event-handler, and `javascript:` forms.
5. When Browser Static Assets is installed, exclude `src/browser/**` from unit coverage and keep Playwright mandatory in the full quality gate.
6. Port the synthetic standard-adopter verification if the target retains capability kits. Its Workers AI path must use the copied mock, disable remote test bindings, and point the Worker test plugin at a derived test-only Wrangler configuration that omits the AI binding.
7. Remove `HOME=$PWD` from Wrangler development and browser-server scripts. Retain only environment variables that intentionally control the relevant tool.

## Fallback

If the target already has a framework test runner, asset pipeline, HTML parser, or browser-coverage merger, preserve those stronger conventions. Apply the same ownership boundaries and security outcomes instead of copying template-specific configuration wholesale.

## Verify

- `node --test scripts/assert-no-worker-client-scripts.test.mjs`
- `npm run capabilities:verify`
- `npm run capabilities:verify:browser`
- `npm run quality:gate`
- `npm run ci:local`
