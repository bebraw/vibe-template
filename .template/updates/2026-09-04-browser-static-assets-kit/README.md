# Add The Browser Static Assets Kit

Use this update when a template-derived server-rendered Worker needs a small typed browser-module and static-assets path without adopting a framework.

## Apply

1. Read ADR-057 and the current capability-kit spec.
2. Copy `.capabilities/browser-static-assets/` and follow its README, manifest, npm recipe, and checks.
3. Preserve an existing Vite, framework, or bundler pipeline rather than adding this kit alongside it.
4. Treat `public/assets/` as generated output, keep `public/_headers` authored, and attach equivalent CSP/security headers to Worker-generated HTML.
5. Apply the Progressive Interaction updates when that kit is already present: preserve `.js` import suffixes and keep both JavaScript-disabled and JavaScript-enabled scenarios.
6. Apply `patch.diff` or record the same optional-pipeline boundary in the target's architecture documentation.

## Fallback

If the target requires package bundling, hashed chunks, CSS processing, or a framework adapter, use its established toolchain and port only the external-module, security-header, cache, and browser-test contracts.

## Verify

- `npm run build:browser`
- `npm run e2e`
- `npx wrangler deploy --dry-run --experimental-provision=false --experimental-auto-create=false`
- `npm run capabilities:verify`
- `npm run quality:gate`
